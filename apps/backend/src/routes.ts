import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";

import { runDynamicEnrichment } from "./lib/enrichment/run-dynamic-enrichment";
import { runStaticEnrichment } from "./lib/enrichment/run-static-enrichment";
import { buildLeadCsvExport, buildLeadPdfExport } from "./lib/leads/export";
import {
  createLeadNote,
  createSearchRun,
  finalizeSearchRun,
  getClientsOverview,
  getLeadDetail,
  getLeadMetricsOverview,
  listAllClients,
  listAllLeads,
  listClients,
  listLeadNotes,
  listLeads,
  listLeadStatusHistory,
  persistLeadCandidates,
  updateLeadStatus,
} from "./lib/leads/repository";
import { crmLeadStatuses, leadStatuses } from "./lib/leads/status";
import {
  getPlaceDetails,
  mapPlaceToLeadCandidate,
  textSearchPlaces,
} from "./lib/places/client";
import { getPlacesEnv, MissingEnvError } from "./lib/server-env";

import { sendInternalError, sendZodError } from "./utils";

const leadSortBy = ["updated_at", "score", "reviews_count", "created_at"] as const;
const sortDirection = ["asc", "desc"] as const;

const listFilterFields = {
  city: z.string().trim().min(1).optional(),
  rubroComercial: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  onlyWithoutWebsite: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  onlyWithPhone: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  sortBy: z.enum(leadSortBy).default("updated_at"),
  sortDir: z.enum(sortDirection).default("desc"),
} as const;

const listClientFilterFields = {
  ...listFilterFields,
  status: z.enum(crmLeadStatuses).optional(),
} as const;

const listLeadFilterFields = {
  ...listFilterFields,
  status: z.enum(leadStatuses).optional(),
} as const;

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
} as const;

const listLeadsQuerySchema = z.object({
  ...paginationFields,
  ...listLeadFilterFields,
});

const listClientsQuerySchema = z.object({
  ...paginationFields,
  ...listClientFilterFields,
});

const exportLeadsQuerySchema = z.object(listLeadFilterFields);

const exportClientsQuerySchema = z.object(listClientFilterFields);

const leadIdParamsSchema = z.object({
  leadId: z.string().uuid(),
});

const listHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const listNotesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const createLeadNoteSchema = z.object({
  note: z.string().trim().min(1).max(3000),
});

const updateLeadStatusSchema = z.object({
  status: z.enum(leadStatuses),
});

const leadSearchSchema = z.object({
  rubroComercial: z.string().min(1),
  city: z.string().min(1),
  keywords: z.string().min(1).optional(),
  pageSize: z.number().int().min(1).max(20).default(10),
  languageCode: z.string().min(2).max(5).default("es"),
  regionCode: z.string().length(2).optional(),
});

const runStaticSchema = z.object({
  batchSize: z.number().int().min(1).max(50).default(10),
});

const runDynamicSchema = z.object({
  batchSize: z.number().int().min(1).max(50).default(5),
});

type LeadSearchRequest = z.infer<typeof leadSearchSchema>;

function buildTextQuery(input: LeadSearchRequest) {
  const base = `${input.rubroComercial} en ${input.city}`;
  return input.keywords ? `${base} ${input.keywords}` : base;
}

function isNonNullableLead<T>(value: T | null): value is T {
  return value !== null;
}

function pickListQueryPayload(query: Request["query"]) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    city: query.city,
    rubroComercial: query.rubroComercial,
    phone: query.phone,
    status: query.status,
    onlyWithoutWebsite: query.onlyWithoutWebsite,
    onlyWithPhone: query.onlyWithPhone,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  };
}

function pickExportQueryPayload(query: Request["query"]) {
  return {
    city: query.city,
    rubroComercial: query.rubroComercial,
    phone: query.phone,
    status: query.status,
    onlyWithoutWebsite: query.onlyWithoutWebsite,
    onlyWithPhone: query.onlyWithPhone,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  };
}

function buildExportFilename(prefix: string, extension: "csv" | "pdf") {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.${extension}`;
}

function isAuthorizedInternalRequest(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return true;
  }

  const headerSecret = req.header("x-cron-secret");
  if (headerSecret === secret) {
    return true;
  }

  const authHeader = req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length) === secret;
  }

  return false;
}

function requireInternalAuth(req: Request, res: Response) {
  if (!isAuthorizedInternalRequest(req)) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return false;
  }

  return true;
}

export function buildV1Router() {
  const router = Router();

  router.get("/leads", async (req, res) => {
    try {
      const payload = listLeadsQuerySchema.parse(pickListQueryPayload(req.query));

      const result = await listLeads({
        page: payload.page,
        pageSize: payload.pageSize,
        city: payload.city,
        rubroComercial: payload.rubroComercial,
        phone: payload.phone,
        status: payload.status ?? "nuevo",
        onlyWithoutWebsite: payload.onlyWithoutWebsite,
        onlyWithPhone: payload.onlyWithPhone,
        sortBy: payload.sortBy,
        sortDir: payload.sortDir,
      });

      return res.status(200).json({
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.pageSize)),
        leads: result.rows,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid query params", error);
      }

      return sendInternalError(res, "Failed to list leads", error);
    }
  });

  router.get("/clients", async (req, res) => {
    try {
      const payload = listClientsQuerySchema.parse(pickListQueryPayload(req.query));

      const result = await listClients({
        page: payload.page,
        pageSize: payload.pageSize,
        city: payload.city,
        rubroComercial: payload.rubroComercial,
        phone: payload.phone,
        status: payload.status,
        onlyWithoutWebsite: payload.onlyWithoutWebsite,
        onlyWithPhone: payload.onlyWithPhone,
        sortBy: payload.sortBy,
        sortDir: payload.sortDir,
      });

      return res.status(200).json({
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.pageSize)),
        leads: result.rows,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid query params", error);
      }

      return sendInternalError(res, "Failed to list clients", error);
    }
  });

  router.get("/leads/export.csv", async (req, res) => {
    try {
      const payload = exportLeadsQuerySchema.parse(pickExportQueryPayload(req.query));
      const rows = await listAllLeads({
        city: payload.city,
        rubroComercial: payload.rubroComercial,
        phone: payload.phone,
        status: payload.status ?? "nuevo",
        onlyWithoutWebsite: payload.onlyWithoutWebsite,
        onlyWithPhone: payload.onlyWithPhone,
        sortBy: payload.sortBy,
        sortDir: payload.sortDir,
      });

      const body = buildLeadCsvExport({
        generatedAt: new Date().toISOString(),
        pipeline: "leads",
        filters: {
          city: payload.city,
          rubroComercial: payload.rubroComercial,
          phone: payload.phone,
          status: payload.status ?? "nuevo",
          onlyWithoutWebsite: payload.onlyWithoutWebsite,
          onlyWithPhone: payload.onlyWithPhone,
          sortBy: payload.sortBy,
          sortDir: payload.sortDir,
        },
        rows,
      });

      res.setHeader("content-type", "text/csv; charset=utf-8");
      res.setHeader("content-disposition", `attachment; filename="${buildExportFilename("synttek-leads", "csv")}"`);
      res.setHeader("cache-control", "no-store");
      return res.status(200).send(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid query params", error);
      }

      return sendInternalError(res, "Failed to export leads CSV", error);
    }
  });

  router.get("/leads/export.pdf", async (req, res) => {
    try {
      const payload = exportLeadsQuerySchema.parse(pickExportQueryPayload(req.query));
      const generatedAt = new Date().toISOString();
      const rows = await listAllLeads({
        city: payload.city,
        rubroComercial: payload.rubroComercial,
        phone: payload.phone,
        status: payload.status ?? "nuevo",
        onlyWithoutWebsite: payload.onlyWithoutWebsite,
        onlyWithPhone: payload.onlyWithPhone,
        sortBy: payload.sortBy,
        sortDir: payload.sortDir,
      });

      const body = await buildLeadPdfExport({
        generatedAt,
        pipeline: "leads",
        filters: {
          city: payload.city,
          rubroComercial: payload.rubroComercial,
          phone: payload.phone,
          status: payload.status ?? "nuevo",
          onlyWithoutWebsite: payload.onlyWithoutWebsite,
          onlyWithPhone: payload.onlyWithPhone,
          sortBy: payload.sortBy,
          sortDir: payload.sortDir,
        },
        rows,
      });

      res.setHeader("content-type", "application/pdf");
      res.setHeader("content-disposition", `attachment; filename="${buildExportFilename("synttek-leads-report", "pdf")}"`);
      res.setHeader("cache-control", "no-store");
      return res.status(200).send(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid query params", error);
      }

      return sendInternalError(res, "Failed to export leads PDF", error);
    }
  });

  router.get("/clients/export.csv", async (req, res) => {
    try {
      const payload = exportClientsQuerySchema.parse(pickExportQueryPayload(req.query));
      const rows = await listAllClients({
        city: payload.city,
        rubroComercial: payload.rubroComercial,
        phone: payload.phone,
        status: payload.status,
        onlyWithoutWebsite: payload.onlyWithoutWebsite,
        onlyWithPhone: payload.onlyWithPhone,
        sortBy: payload.sortBy,
        sortDir: payload.sortDir,
      });

      const body = buildLeadCsvExport({
        generatedAt: new Date().toISOString(),
        pipeline: "clients",
        filters: {
          city: payload.city,
          rubroComercial: payload.rubroComercial,
          phone: payload.phone,
          status: payload.status,
          onlyWithoutWebsite: payload.onlyWithoutWebsite,
          onlyWithPhone: payload.onlyWithPhone,
          sortBy: payload.sortBy,
          sortDir: payload.sortDir,
        },
        rows,
      });

      res.setHeader("content-type", "text/csv; charset=utf-8");
      res.setHeader("content-disposition", `attachment; filename="${buildExportFilename("synttek-clients", "csv")}"`);
      res.setHeader("cache-control", "no-store");
      return res.status(200).send(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid query params", error);
      }

      return sendInternalError(res, "Failed to export clients CSV", error);
    }
  });

  router.get("/clients/export.pdf", async (req, res) => {
    try {
      const payload = exportClientsQuerySchema.parse(pickExportQueryPayload(req.query));
      const generatedAt = new Date().toISOString();
      const rows = await listAllClients({
        city: payload.city,
        rubroComercial: payload.rubroComercial,
        phone: payload.phone,
        status: payload.status,
        onlyWithoutWebsite: payload.onlyWithoutWebsite,
        onlyWithPhone: payload.onlyWithPhone,
        sortBy: payload.sortBy,
        sortDir: payload.sortDir,
      });

      const body = await buildLeadPdfExport({
        generatedAt,
        pipeline: "clients",
        filters: {
          city: payload.city,
          rubroComercial: payload.rubroComercial,
          phone: payload.phone,
          status: payload.status,
          onlyWithoutWebsite: payload.onlyWithoutWebsite,
          onlyWithPhone: payload.onlyWithPhone,
          sortBy: payload.sortBy,
          sortDir: payload.sortDir,
        },
        rows,
      });

      res.setHeader("content-type", "application/pdf");
      res.setHeader("content-disposition", `attachment; filename="${buildExportFilename("synttek-clients-report", "pdf")}"`);
      res.setHeader("cache-control", "no-store");
      return res.status(200).send(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid query params", error);
      }

      return sendInternalError(res, "Failed to export clients PDF", error);
    }
  });

  router.post("/leads/search", async (req, res) => {
    let searchRunId: string | null = null;
    const payloadResult = leadSearchSchema.safeParse(req.body);

    if (!payloadResult.success) {
      return sendZodError(res, "Invalid payload", payloadResult.error);
    }

    try {
      const payload = payloadResult.data;
      getPlacesEnv();
      const textQuery = buildTextQuery(payload);

      searchRunId = await createSearchRun(textQuery, payload.city, payload.rubroComercial);

      const textSearchResult = await textSearchPlaces({
        textQuery,
        pageSize: payload.pageSize,
        languageCode: payload.languageCode,
        regionCode: payload.regionCode,
      });

      const places = textSearchResult.places ?? [];
      const enrichedPlaces = await Promise.all(
        places.map(async (place) => {
          if (!place.name) {
            return place;
          }

          try {
            const details = await getPlaceDetails(place.name, payload.languageCode);
            return { ...place, ...details };
          } catch {
            return place;
          }
        }),
      );

      const leads = enrichedPlaces
        .map((place) => mapPlaceToLeadCandidate(place, payload.rubroComercial, payload.city))
        .filter(isNonNullableLead);

      const persistResult = await persistLeadCandidates(leads);

      await finalizeSearchRun(searchRunId, {
        total_found: leads.length,
        total_saved: persistResult.totalSaved,
        status: "completed",
      });

      return res.status(200).json({
        searchRunId,
        query: textQuery,
        totalFound: leads.length,
        totalSaved: persistResult.totalSaved,
        hasMore: Boolean(textSearchResult.nextPageToken),
        savedPlaceIds: persistResult.savedPlaceIds,
        leads,
      });
    } catch (error) {
      if (error instanceof MissingEnvError) {
        return res.status(503).json({
          message: "Search provider is not configured",
          error: error.message,
          searchRunId,
        });
      }

      if (searchRunId) {
        try {
          await finalizeSearchRun(searchRunId, {
            total_found: 0,
            total_saved: 0,
            status: "error",
          });
        } catch {
          // noop
        }
      }

      return res.status(500).json({
        message: "Failed to search leads",
        error: error instanceof Error ? error.message : "Unknown error",
        searchRunId,
      });
    }
  });

  router.get("/leads/:leadId", async (req, res) => {
    try {
      const { leadId } = leadIdParamsSchema.parse(req.params);
      const lead = await getLeadDetail(leadId);

      if (!lead) {
        return res.status(404).json({
          message: "Lead not found",
        });
      }

      return res.status(200).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid request", error);
      }

      return sendInternalError(res, "Failed to get lead detail", error);
    }
  });

  router.patch("/leads/:leadId/status", async (req, res) => {
    try {
      const { leadId } = leadIdParamsSchema.parse(req.params);
      const payload = updateLeadStatusSchema.parse(req.body);
      const result = await updateLeadStatus(leadId, payload.status);

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid payload", error);
      }

      return sendInternalError(res, "Failed to update lead status", error);
    }
  });

  router.get("/leads/:leadId/history", async (req, res) => {
    try {
      const { leadId } = leadIdParamsSchema.parse(req.params);
      const query = listHistoryQuerySchema.parse({
        limit: req.query.limit,
      });

      const history = await listLeadStatusHistory(leadId, query.limit);

      return res.status(200).json({
        leadId,
        total: history.length,
        items: history,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid request", error);
      }

      return sendInternalError(res, "Failed to get lead history", error);
    }
  });

  router.get("/leads/:leadId/notes", async (req, res) => {
    try {
      const { leadId } = leadIdParamsSchema.parse(req.params);
      const query = listNotesQuerySchema.parse({
        limit: req.query.limit,
      });

      const items = await listLeadNotes(leadId, query.limit);

      return res.status(200).json({
        leadId,
        total: items.length,
        items,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid request", error);
      }

      return sendInternalError(res, "Failed to get lead notes", error);
    }
  });

  router.post("/leads/:leadId/notes", async (req, res) => {
    try {
      const { leadId } = leadIdParamsSchema.parse(req.params);
      const payload = createLeadNoteSchema.parse(req.body);
      const note = await createLeadNote(leadId, payload.note);

      return res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid payload", error);
      }

      return sendInternalError(res, "Failed to create lead note", error);
    }
  });

  router.get("/metrics/overview", async (_req, res) => {
    try {
      const metrics = await getLeadMetricsOverview();
      return res.status(200).json(metrics);
    } catch (error) {
      return sendInternalError(res, "Failed to load metrics overview", error);
    }
  });

  router.get("/clients/overview", async (_req, res) => {
    try {
      const metrics = await getClientsOverview();
      return res.status(200).json(metrics);
    } catch (error) {
      return sendInternalError(res, "Failed to load clients overview", error);
    }
  });

  router.post("/enrichment/run", async (req, res) => {
    if (!requireInternalAuth(req, res)) {
      return;
    }

    try {
      const payload = runStaticSchema.parse(req.body ?? {});
      const result = await runStaticEnrichment({ batchSize: payload.batchSize });
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid payload", error);
      }

      return sendInternalError(res, "Failed to run enrichment", error);
    }
  });

  router.post("/enrichment/run-dynamic", async (req, res) => {
    if (!requireInternalAuth(req, res)) {
      return;
    }

    try {
      const payload = runDynamicSchema.parse(req.body ?? {});
      const result = await runDynamicEnrichment({ batchSize: payload.batchSize });
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendZodError(res, "Invalid payload", error);
      }

      return sendInternalError(res, "Failed to run dynamic enrichment", error);
    }
  });

  router.post("/internal/cron/enrichment", async (req, res) => {
    if (!requireInternalAuth(req, res)) {
      return;
    }

    try {
      const staticResult = await runStaticEnrichment({ batchSize: 20 });
      const dynamicResult = await runDynamicEnrichment({ batchSize: 8 });

      return res.status(200).json({
        ok: true,
        staticResult,
        dynamicResult,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        message: "Failed to run cron enrichment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}

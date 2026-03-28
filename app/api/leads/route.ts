import { NextResponse } from "next/server";
import { z } from "zod";

import { listLeads } from "@/lib/leads/repository";
import { leadStatuses } from "@/lib/leads/status";

const leadSortBy = ["updated_at", "score", "reviews_count", "created_at"] as const;
const sortDirection = ["asc", "desc"] as const;

const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  city: z.string().trim().min(1).optional(),
  rubroComercial: z.string().trim().min(1).optional(),
  status: z.enum(leadStatuses).optional(),
  onlyWithoutWebsite: z.enum(["true", "false"]).optional().transform((value) => value === "true"),
  onlyWithPhone: z.enum(["true", "false"]).optional().transform((value) => value === "true"),
  sortBy: z.enum(leadSortBy).default("updated_at"),
  sortDir: z.enum(sortDirection).default("desc"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const payload = listLeadsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      rubroComercial: searchParams.get("rubroComercial") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      onlyWithoutWebsite: searchParams.get("onlyWithoutWebsite") ?? undefined,
      onlyWithPhone: searchParams.get("onlyWithPhone") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortDir: searchParams.get("sortDir") ?? undefined,
    });

    const result = await listLeads({
      page: payload.page,
      pageSize: payload.pageSize,
      city: payload.city,
      rubroComercial: payload.rubroComercial,
      status: payload.status,
      onlyWithoutWebsite: payload.onlyWithoutWebsite,
      onlyWithPhone: payload.onlyWithPhone,
      sortBy: payload.sortBy,
      sortDir: payload.sortDir,
    });

    return NextResponse.json(
      {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.pageSize)),
        leads: result.rows,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid query params",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        message: "Failed to list leads",
        error: message,
      },
      { status: 500 },
    );
  }
}

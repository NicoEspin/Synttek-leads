import { getApiUrl } from "@/features/leads/api/api-base-url";
import { buildListQuery } from "@/features/leads/api/build-list-query";
import type { ListLeadsRequest } from "@/features/leads/types";

type ExportPipeline = "leads" | "clients";
type ExportFormat = "csv" | "pdf";

type ExportLeadsParams = {
  pipeline: ExportPipeline;
  format: ExportFormat;
  filters: ListLeadsRequest;
};

type ExportLeadsResult = {
  blob: Blob;
  filename: string;
};

function buildFilename(pipeline: ExportPipeline, format: ExportFormat) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const baseName = pipeline === "clients" ? "synttek-clients" : "synttek-leads";
  const suffix = format === "pdf" ? "report" : "export";
  return `${baseName}-${suffix}-${dateStamp}.${format}`;
}

async function parseExportError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await response.json()) as { message?: string; error?: string };
    return data.error ?? data.message ?? "No se pudo exportar el archivo";
  }

  const text = await response.text();
  return text || "No se pudo exportar el archivo";
}

export async function exportLeads({ pipeline, format, filters }: ExportLeadsParams): Promise<ExportLeadsResult> {
  const query = buildListQuery(filters);
  const basePath = pipeline === "clients" ? "/v1/clients/export" : "/v1/leads/export";
  const response = await fetch(getApiUrl(`${basePath}.${format}?${query}`), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await parseExportError(response));
  }

  return {
    blob: await response.blob(),
    filename: buildFilename(pipeline, format),
  };
}

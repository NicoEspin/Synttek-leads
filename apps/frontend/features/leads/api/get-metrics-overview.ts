import type { LeadMetricsOverview } from "@/features/leads/types";
import { getApiUrl } from "@/features/leads/api/api-base-url";

export async function getMetricsOverview(): Promise<LeadMetricsOverview> {
  const response = await fetch(getApiUrl("/v1/metrics/overview"), {
    method: "GET",
  });

  const data = (await response.json()) as Partial<LeadMetricsOverview> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to load metrics overview");
  }

  return {
    totalLeads: data.totalLeads ?? 0,
    withoutWebsite: data.withoutWebsite ?? 0,
    withWhatsapp: data.withWhatsapp ?? 0,
    withInstagram: data.withInstagram ?? 0,
    enrichmentPending: data.enrichmentPending ?? 0,
    enrichmentDone: data.enrichmentDone ?? 0,
    enrichmentFailed: data.enrichmentFailed ?? 0,
    statusContactado: data.statusContactado ?? 0,
  };
}

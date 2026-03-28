import { getApiUrl } from "@/features/leads/api/api-base-url";

type RunEnrichmentResponse = {
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  leads: Array<{
    leadId: string;
    status: "done" | "failed";
    reason?: string;
  }>;
};

export async function runEnrichment(batchSize = 10): Promise<RunEnrichmentResponse> {
  const response = await fetch(getApiUrl("/v1/enrichment/run"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ batchSize }),
  });

  const data = (await response.json()) as Partial<RunEnrichmentResponse> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to run enrichment");
  }

  return {
    totalProcessed: data.totalProcessed ?? 0,
    totalSucceeded: data.totalSucceeded ?? 0,
    totalFailed: data.totalFailed ?? 0,
    leads: data.leads ?? [],
  };
}

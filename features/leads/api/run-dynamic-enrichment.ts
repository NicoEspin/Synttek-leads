type RunDynamicEnrichmentResponse = {
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  leads: Array<{
    leadId: string;
    status: "done" | "failed";
    reason?: string;
  }>;
};

export async function runDynamicEnrichment(
  batchSize = 5,
): Promise<RunDynamicEnrichmentResponse> {
  const response = await fetch("/api/enrichment/run-dynamic", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ batchSize }),
  });

  const data = (await response.json()) as Partial<RunDynamicEnrichmentResponse> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to run dynamic enrichment");
  }

  return {
    totalProcessed: data.totalProcessed ?? 0,
    totalSucceeded: data.totalSucceeded ?? 0,
    totalFailed: data.totalFailed ?? 0,
    leads: data.leads ?? [],
  };
}

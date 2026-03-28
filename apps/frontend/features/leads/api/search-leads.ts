import type { SearchLeadsRequest, SearchLeadsResponse } from "@/features/leads/types";
import { getApiUrl } from "@/features/leads/api/api-base-url";

export async function searchLeads(payload: SearchLeadsRequest): Promise<SearchLeadsResponse> {
  const response = await fetch(getApiUrl("/v1/leads/search"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as Partial<SearchLeadsResponse> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    const reason = data.error ?? data.message ?? "Unknown error";
    throw new Error(reason);
  }

  if (!data.searchRunId || !Array.isArray(data.leads)) {
    throw new Error("Invalid API response for /v1/leads/search");
  }

  return {
    searchRunId: data.searchRunId,
    query: data.query ?? "",
    totalFound: data.totalFound ?? 0,
    totalSaved: data.totalSaved ?? 0,
    hasMore: data.hasMore ?? false,
    savedPlaceIds: data.savedPlaceIds ?? [],
    leads: data.leads,
  };
}

import type { ListLeadsRequest, ListLeadsResponse } from "@/features/leads/types";
import { getApiUrl } from "@/features/leads/api/api-base-url";
import { buildListQuery } from "@/features/leads/api/build-list-query";

export async function listClients(params: ListLeadsRequest): Promise<ListLeadsResponse> {
  const query = buildListQuery(params);
  const response = await fetch(getApiUrl(`/v1/clients?${query}`), {
    method: "GET",
  });

  const data = (await response.json()) as Partial<ListLeadsResponse> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to load clients");
  }

  return {
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 12,
    total: data.total ?? 0,
    totalPages: data.totalPages ?? 1,
    leads: data.leads ?? [],
  };
}

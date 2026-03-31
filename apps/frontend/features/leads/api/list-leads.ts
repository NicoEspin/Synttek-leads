import type { ListLeadsRequest, ListLeadsResponse } from "@/features/leads/types";
import { getApiUrl } from "@/features/leads/api/api-base-url";

function buildQuery(params: ListLeadsRequest) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.city) searchParams.set("city", params.city);
  if (params.rubroComercial) searchParams.set("rubroComercial", params.rubroComercial);
  if (params.phone) searchParams.set("phone", params.phone);
  if (params.status) searchParams.set("status", params.status);
  if (typeof params.onlyWithoutWebsite === "boolean") {
    searchParams.set("onlyWithoutWebsite", String(params.onlyWithoutWebsite));
  }
  if (typeof params.onlyWithPhone === "boolean") {
    searchParams.set("onlyWithPhone", String(params.onlyWithPhone));
  }
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDir) searchParams.set("sortDir", params.sortDir);

  return searchParams.toString();
}

export async function listLeads(params: ListLeadsRequest): Promise<ListLeadsResponse> {
  const query = buildQuery(params);
  const response = await fetch(getApiUrl(`/v1/leads?${query}`), {
    method: "GET",
  });

  const data = (await response.json()) as Partial<ListLeadsResponse> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to load leads");
  }

  return {
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 12,
    total: data.total ?? 0,
    totalPages: data.totalPages ?? 1,
    leads: data.leads ?? [],
  };
}

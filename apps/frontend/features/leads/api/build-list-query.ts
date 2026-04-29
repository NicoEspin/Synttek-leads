import type { ListLeadsRequest } from "@/features/leads/types";

export function buildListQuery(params: ListLeadsRequest) {
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

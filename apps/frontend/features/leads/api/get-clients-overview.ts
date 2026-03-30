import { getApiUrl } from "@/features/leads/api/api-base-url";
import type { ClientsOverview } from "@/features/leads/types";

export async function getClientsOverview(): Promise<ClientsOverview> {
  const response = await fetch(getApiUrl("/v1/clients/overview"), {
    method: "GET",
  });

  const data = (await response.json()) as Partial<ClientsOverview> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Failed to load clients overview");
  }

  return {
    totalClients: data.totalClients ?? 0,
    revisado: data.revisado ?? 0,
    contactado: data.contactado ?? 0,
    respondio: data.respondio ?? 0,
    enProceso: data.enProceso ?? 0,
    descartado: data.descartado ?? 0,
    ganado: data.ganado ?? 0,
  };
}

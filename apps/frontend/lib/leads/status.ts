export const leadStatuses = [
  "nuevo",
  "revisado",
  "contactado",
  "respondio",
  "en_proceso",
  "descartado",
  "ganado",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

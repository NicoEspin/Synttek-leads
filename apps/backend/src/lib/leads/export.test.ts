import assert from "node:assert/strict";
import test from "node:test";

import { buildLeadCsvExport, buildLeadPdfExport } from "./export";
import type { LeadListItem } from "./repository";

const sampleLead: LeadListItem = {
  id: "lead-1",
  placeId: "place-1",
  businessName: "Cafe Central",
  rubroComercial: "Gastronomia",
  city: "Cordoba",
  phoneE164: "+5493511234567",
  websiteUrl: null,
  hasWebsite: false,
  rating: 4.6,
  reviewsCount: 128,
  score: 87,
  status: "nuevo",
  mapsUrl: "https://maps.google.com/?cid=123",
  whatsappUrl: "https://wa.me/5493511234567",
  instagramUrl: "https://instagram.com/cafecentral",
  enrichmentStatus: "done",
  updatedAt: "2026-04-29T12:00:00.000Z",
};

test("buildLeadCsvExport includes headers and row values", () => {
  const csv = buildLeadCsvExport({
    generatedAt: "2026-04-29T12:00:00.000Z",
    pipeline: "leads",
    filters: {
      city: "Cordoba",
      rubroComercial: "Gastronomia",
      sortBy: "updated_at",
      sortDir: "desc",
    },
    rows: [sampleLead],
  });

  assert.match(csv, /Negocio/);
  assert.match(csv, /Cafe Central/);
  assert.match(csv, /\+5493511234567/);
  assert.match(csv, /https:\/\/wa\.me\/5493511234567/);
});

test("buildLeadPdfExport returns a PDF buffer", async () => {
  const pdf = await buildLeadPdfExport({
    generatedAt: "2026-04-29T12:00:00.000Z",
    pipeline: "clients",
    filters: {
      status: "contactado",
      sortBy: "updated_at",
      sortDir: "desc",
    },
    rows: [sampleLead],
  });

  assert.equal(Buffer.isBuffer(pdf), true);
  assert.equal(pdf.subarray(0, 4).toString("utf8"), "%PDF");
  assert.ok(pdf.length > 1000);
});

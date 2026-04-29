import PDFDocument from "pdfkit";

import type { LeadListItem } from "./repository";

type ExportPipeline = "leads" | "clients";

type ExportFilters = {
  city?: string;
  rubroComercial?: string;
  phone?: string;
  status?: string;
  onlyWithoutWebsite?: boolean;
  onlyWithPhone?: boolean;
  sortBy: "updated_at" | "score" | "reviews_count" | "created_at";
  sortDir: "asc" | "desc";
};

type LeadExportContext = {
  generatedAt: string;
  pipeline: ExportPipeline;
  filters: ExportFilters;
  rows: LeadListItem[];
};

const csvColumns: Array<{ key: string; label: string; getValue: (lead: LeadListItem) => string | number | boolean | null }> = [
  { key: "businessName", label: "Negocio", getValue: (lead) => lead.businessName },
  { key: "rubroComercial", label: "Rubro", getValue: (lead) => lead.rubroComercial },
  { key: "city", label: "Ciudad", getValue: (lead) => lead.city },
  { key: "status", label: "Estado CRM", getValue: (lead) => lead.status },
  { key: "score", label: "Score", getValue: (lead) => lead.score },
  { key: "rating", label: "Rating", getValue: (lead) => lead.rating },
  { key: "reviewsCount", label: "Resenas", getValue: (lead) => lead.reviewsCount },
  { key: "phoneE164", label: "Telefono", getValue: (lead) => lead.phoneE164 },
  { key: "hasWebsite", label: "Tiene website", getValue: (lead) => lead.hasWebsite },
  { key: "websiteUrl", label: "Website", getValue: (lead) => lead.websiteUrl },
  { key: "whatsappUrl", label: "WhatsApp", getValue: (lead) => lead.whatsappUrl },
  { key: "instagramUrl", label: "Instagram", getValue: (lead) => lead.instagramUrl },
  { key: "mapsUrl", label: "Google Maps", getValue: (lead) => lead.mapsUrl },
  { key: "enrichmentStatus", label: "Enrichment", getValue: (lead) => lead.enrichmentStatus },
  { key: "placeId", label: "Place ID", getValue: (lead) => lead.placeId },
  { key: "updatedAt", label: "Actualizado", getValue: (lead) => lead.updatedAt },
];

function escapeCsvValue(value: string | number | boolean | null) {
  if (value === null) {
    return "";
  }

  const normalized = String(value).replace(/"/g, '""');
  return `"${normalized}"`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFilters(filters: ExportFilters) {
  const chips = [
    filters.city ? `Ciudad: ${filters.city}` : null,
    filters.rubroComercial ? `Rubro: ${filters.rubroComercial}` : null,
    filters.phone ? `Telefono: ${filters.phone}` : null,
    filters.status ? `Estado: ${filters.status}` : null,
    filters.onlyWithoutWebsite ? "Solo sin website" : null,
    filters.onlyWithPhone ? "Solo con telefono" : null,
    `Orden: ${filters.sortBy} ${filters.sortDir}`,
  ];

  return chips.filter((value): value is string => Boolean(value));
}

function buildPdfLeadLines(lead: LeadListItem) {
  return [
    `Estado CRM: ${lead.status}   |   Score: ${lead.score}   |   Enrichment: ${lead.enrichmentStatus}`,
    `Ciudad / Rubro: ${lead.city} / ${lead.rubroComercial}`,
    `Contacto: ${lead.phoneE164 ?? "Sin telefono"}`,
    `Website: ${lead.websiteUrl ?? "Sin website"}`,
    `WhatsApp: ${lead.whatsappUrl ?? "Sin WhatsApp"}`,
    `Instagram: ${lead.instagramUrl ?? "Sin Instagram"}`,
    `Maps: ${lead.mapsUrl ?? "Sin URL de Maps"}`,
    `Rating: ${lead.rating ? lead.rating.toFixed(1) : "-"}   |   Resenas: ${lead.reviewsCount}   |   Actualizado: ${formatDateTime(lead.updatedAt)}`,
  ];
}

function ensurePdfSpace(doc: PDFKit.PDFDocument, requiredHeight: number) {
  if (doc.y + requiredHeight <= doc.page.height - doc.page.margins.bottom) {
    return;
  }

  doc.addPage();
}

export function buildLeadCsvExport(context: LeadExportContext) {
  const header = csvColumns.map((column) => escapeCsvValue(column.label)).join(",");
  const rows = context.rows.map((lead) => csvColumns.map((column) => escapeCsvValue(column.getValue(lead))).join(","));
  return `\uFEFF${[header, ...rows].join("\n")}`;
}

export async function buildLeadPdfExport(context: LeadExportContext) {
  const doc = new PDFDocument({
    margin: 42,
    size: "A4",
  });

  const chunks: Buffer[] = [];

  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(18).text(context.pipeline === "clients" ? "Reporte de clientes CRM" : "Reporte de leads nuevos");
  doc.moveDown(0.4);
  doc.fontSize(10).fillColor("#475569").text(`Generado: ${formatDateTime(context.generatedAt)}`);
  doc.text(`Total exportado: ${context.rows.length}`);

  const filterSummary = formatFilters(context.filters);
  if (filterSummary.length > 0) {
    doc.moveDown(0.6);
    doc.fontSize(10).fillColor("#0f172a").text("Filtros aplicados:");
    doc.fontSize(9).fillColor("#475569").text(filterSummary.join(" | "));
  }

  doc.moveDown(0.9);

  if (context.rows.length === 0) {
    doc.fontSize(11).fillColor("#475569").text("No hay resultados para exportar con estos filtros.");
    doc.end();
    return bufferPromise;
  }

  context.rows.forEach((lead, index) => {
    ensurePdfSpace(doc, 132);
    const cardTop = doc.y;
    doc.roundedRect(42, cardTop, doc.page.width - 84, 114, 10).fillAndStroke("#f8fafc", "#e2e8f0");
    doc.fillColor("#0f172a");
    doc.fontSize(12).text(`${index + 1}. ${lead.businessName}`, 56, cardTop + 10, {
      width: doc.page.width - 112,
    });

    let currentY = cardTop + 30;
    for (const line of buildPdfLeadLines(lead)) {
      doc.fontSize(9).fillColor("#334155").text(line, 56, currentY, {
        width: doc.page.width - 112,
      });
      currentY = doc.y + 4;
    }

    doc.y = currentY + 10;
  });

  doc.end();
  return bufferPromise;
}

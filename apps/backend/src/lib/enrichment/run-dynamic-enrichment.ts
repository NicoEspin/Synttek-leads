import { chromium } from "playwright";

import {
  applyLeadEnrichmentResult,
  listLeadsForDynamicEnrichment,
  markLeadEnrichmentFailed,
} from "@/lib/leads/repository";

import {
  extractContactSignalsFromHtml,
  type EnrichmentContactSignal,
} from "@/lib/enrichment/extract-contact-signals";

type RunDynamicEnrichmentInput = {
  batchSize: number;
};

type EnrichmentLeadResult = {
  leadId: string;
  status: "done" | "failed";
  reason?: string;
};

type RunDynamicEnrichmentResult = {
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  leads: EnrichmentLeadResult[];
};

function mapContactToLeadContact(signal: EnrichmentContactSignal) {
  return {
    channel: signal.channel,
    value: signal.value,
    source: "website_crawler" as const,
    confidence: signal.confidence,
    isConfirmed: signal.verification === "confirmed",
  };
}

export async function runDynamicEnrichment(
  input: RunDynamicEnrichmentInput,
): Promise<RunDynamicEnrichmentResult> {
  const leads = await listLeadsForDynamicEnrichment(input.batchSize);
  const results: EnrichmentLeadResult[] = [];

  if (leads.length === 0) {
    return {
      totalProcessed: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      leads: [],
    };
  }

  const browser = await chromium.launch({ headless: true });

  try {
    for (const lead of leads) {
      const page = await browser.newPage();

      try {
        await page.goto(lead.websiteUrl, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });

        await page.waitForTimeout(2000);

        const html = await page.content();
        const extraction = extractContactSignalsFromHtml(html);

        await applyLeadEnrichmentResult({
          leadId: lead.id,
          whatsappUrl: extraction.whatsappUrl,
          whatsappSource: extraction.whatsappSource,
          instagramUrl: extraction.instagramUrl,
          instagramHandle: extraction.instagramHandle,
          instagramSource: extraction.instagramSource,
          contacts: extraction.contacts.map(mapContactToLeadContact),
        });

        results.push({
          leadId: lead.id,
          status: "done",
        });
      } catch (error) {
        await markLeadEnrichmentFailed(lead.id);
        const reason = error instanceof Error ? error.message : "unknown error";

        results.push({
          leadId: lead.id,
          status: "failed",
          reason,
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  const totalSucceeded = results.filter((result) => result.status === "done").length;
  const totalFailed = results.filter((result) => result.status === "failed").length;

  return {
    totalProcessed: results.length,
    totalSucceeded,
    totalFailed,
    leads: results,
  };
}

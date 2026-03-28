import {
  applyLeadEnrichmentResult,
  listLeadsForStaticEnrichment,
  markLeadEnrichmentFailed,
} from "@/lib/leads/repository";
import { getServerEnv } from "@/lib/server-env";

import {
  extractContactSignalsFromHtml,
  type EnrichmentContactSignal,
} from "@/lib/enrichment/extract-contact-signals";

type RunStaticEnrichmentInput = {
  batchSize: number;
};

type EnrichmentLeadResult = {
  leadId: string;
  status: "done" | "failed";
  reason?: string;
};

type RunStaticEnrichmentResult = {
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

export async function runStaticEnrichment(
  input: RunStaticEnrichmentInput,
): Promise<RunStaticEnrichmentResult> {
  const leads = await listLeadsForStaticEnrichment(input.batchSize);
  const { ENRICHMENT_USER_AGENT } = getServerEnv();
  const results: EnrichmentLeadResult[] = [];

  for (const lead of leads) {
    try {
      const response = await fetch(lead.websiteUrl, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
        headers: {
          "User-Agent": ENRICHMENT_USER_AGENT,
        },
      });

      if (!response.ok) {
        await markLeadEnrichmentFailed(lead.id);
        results.push({
          leadId: lead.id,
          status: "failed",
          reason: `HTTP ${response.status}`,
        });
        continue;
      }

      const html = await response.text();
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
    }
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

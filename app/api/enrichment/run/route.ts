import { NextResponse } from "next/server";
import { z } from "zod";

import { runStaticEnrichment } from "@/lib/enrichment/run-static-enrichment";
import { getServerEnv } from "@/lib/server-env";

const runEnrichmentSchema = z.object({
  batchSize: z.number().int().min(1).max(50).default(10),
});

function isAuthorized(request: Request) {
  const { CRON_SECRET } = getServerEnv();
  if (!CRON_SECRET) {
    return true;
  }

  const received = request.headers.get("x-cron-secret");
  return received === CRON_SECRET;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const payload = runEnrichmentSchema.parse(body);
    const result = await runStaticEnrichment({ batchSize: payload.batchSize });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid payload",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        message: "Failed to run enrichment",
        error: message,
      },
      { status: 500 },
    );
  }
}

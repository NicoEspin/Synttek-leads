import { NextResponse } from "next/server";

import { runDynamicEnrichment } from "@/lib/enrichment/run-dynamic-enrichment";
import { runStaticEnrichment } from "@/lib/enrichment/run-static-enrichment";
import { getServerEnv } from "@/lib/server-env";

function isAuthorized(request: Request) {
  const { CRON_SECRET } = getServerEnv();
  if (!CRON_SECRET) {
    return true;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret === CRON_SECRET) {
    return true;
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length) === CRON_SECRET;
  }

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const staticResult = await runStaticEnrichment({ batchSize: 20 });
    const dynamicResult = await runDynamicEnrichment({ batchSize: 8 });

    return NextResponse.json(
      {
        ok: true,
        staticResult,
        dynamicResult,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to run cron enrichment",
        error: message,
      },
      { status: 500 },
    );
  }
}

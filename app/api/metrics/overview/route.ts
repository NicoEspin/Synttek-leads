import { NextResponse } from "next/server";

import { getLeadMetricsOverview } from "@/lib/leads/repository";

export async function GET() {
  try {
    const metrics = await getLeadMetricsOverview();

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        message: "Failed to load metrics overview",
        error: message,
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { listLeadStatusHistory } from "@/lib/leads/repository";

const paramsSchema = z.object({
  leadId: z.string().uuid(),
});

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  try {
    const params = await context.params;
    const { leadId } = paramsSchema.parse(params);
    const { searchParams } = new URL(request.url);

    const query = querySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
    });

    const history = await listLeadStatusHistory(leadId, query.limit);

    return NextResponse.json(
      {
        leadId,
        total: history.length,
        items: history,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid request",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        message: "Failed to get lead history",
        error: message,
      },
      { status: 500 },
    );
  }
}

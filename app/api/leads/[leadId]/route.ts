import { NextResponse } from "next/server";
import { z } from "zod";

import { getLeadDetail } from "@/lib/leads/repository";

const paramsSchema = z.object({
  leadId: z.string().uuid(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  try {
    const params = await context.params;
    const { leadId } = paramsSchema.parse(params);

    const lead = await getLeadDetail(leadId);
    if (!lead) {
      return NextResponse.json(
        {
          message: "Lead not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(lead, { status: 200 });
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
        message: "Failed to get lead detail",
        error: message,
      },
      { status: 500 },
    );
  }
}

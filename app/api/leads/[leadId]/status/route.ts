import { NextResponse } from "next/server";
import { z } from "zod";

import { updateLeadStatus } from "@/lib/leads/repository";
import { leadStatuses } from "@/lib/leads/status";

const updateLeadStatusSchema = z.object({
  status: z.enum(leadStatuses),
});

const paramsSchema = z.object({
  leadId: z.string().uuid(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  try {
    const params = await context.params;
    const { leadId } = paramsSchema.parse(params);
    const body = await request.json();
    const payload = updateLeadStatusSchema.parse(body);

    const result = await updateLeadStatus(leadId, payload.status);

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
        message: "Failed to update lead status",
        error: message,
      },
      { status: 500 },
    );
  }
}

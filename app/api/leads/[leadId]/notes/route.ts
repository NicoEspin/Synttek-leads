import { NextResponse } from "next/server";
import { z } from "zod";

import { createLeadNote, listLeadNotes } from "@/lib/leads/repository";

const paramsSchema = z.object({
  leadId: z.string().uuid(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const createNoteSchema = z.object({
  note: z.string().trim().min(1).max(3000),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  try {
    const params = await context.params;
    const { leadId } = paramsSchema.parse(params);
    const { searchParams } = new URL(request.url);

    const query = listQuerySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
    });

    const items = await listLeadNotes(leadId, query.limit);

    return NextResponse.json(
      {
        leadId,
        total: items.length,
        items,
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
        message: "Failed to get lead notes",
        error: message,
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  try {
    const params = await context.params;
    const { leadId } = paramsSchema.parse(params);
    const body = await request.json();
    const payload = createNoteSchema.parse(body);

    const note = await createLeadNote(leadId, payload.note);

    return NextResponse.json(note, { status: 201 });
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
        message: "Failed to create lead note",
        error: message,
      },
      { status: 500 },
    );
  }
}

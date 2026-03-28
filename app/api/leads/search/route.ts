import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSearchRun,
  finalizeSearchRun,
  persistLeadCandidates,
} from "@/lib/leads/repository";
import {
  getPlaceDetails,
  mapPlaceToLeadCandidate,
  textSearchPlaces,
} from "@/lib/places/client";

const leadSearchSchema = z.object({
  rubroComercial: z.string().min(1),
  city: z.string().min(1),
  keywords: z.string().min(1).optional(),
  pageSize: z.number().int().min(1).max(20).default(10),
  languageCode: z.string().min(2).max(5).default("es"),
  regionCode: z.string().length(2).optional(),
});

type LeadSearchRequest = z.infer<typeof leadSearchSchema>;

function isNonNullableLead<T>(value: T | null): value is T {
  return value !== null;
}

function buildTextQuery(input: LeadSearchRequest) {
  const base = `${input.rubroComercial} en ${input.city}`;
  if (!input.keywords) {
    return base;
  }

  return `${base} ${input.keywords}`;
}

export async function POST(request: Request) {
  let searchRunId: string | null = null;

  try {
    const body = await request.json();
    const payload = leadSearchSchema.parse(body);
    const textQuery = buildTextQuery(payload);

    searchRunId = await createSearchRun(textQuery, payload.city, payload.rubroComercial);

    const textSearchResult = await textSearchPlaces({
      textQuery,
      pageSize: payload.pageSize,
      languageCode: payload.languageCode,
      regionCode: payload.regionCode,
    });

    const places = textSearchResult.places ?? [];

    const enrichedPlaces = await Promise.all(
      places.map(async (place) => {
        if (!place.name) {
          return place;
        }

        try {
          const details = await getPlaceDetails(place.name, payload.languageCode);
          return {
            ...place,
            ...details,
          };
        } catch {
          return place;
        }
      }),
    );

    const leads = enrichedPlaces
      .map((place) => mapPlaceToLeadCandidate(place, payload.rubroComercial, payload.city))
      .filter(isNonNullableLead);

    const persistResult = await persistLeadCandidates(leads);

    await finalizeSearchRun(searchRunId, {
      total_found: leads.length,
      total_saved: persistResult.totalSaved,
      status: "completed",
    });

    return NextResponse.json(
      {
        searchRunId,
        query: textQuery,
        totalFound: leads.length,
        totalSaved: persistResult.totalSaved,
        hasMore: Boolean(textSearchResult.nextPageToken),
        savedPlaceIds: persistResult.savedPlaceIds,
        leads,
      },
      { status: 200 },
    );
  } catch (error) {
    if (searchRunId) {
      try {
        await finalizeSearchRun(searchRunId, {
          total_found: 0,
          total_saved: 0,
          status: "error",
        });
      } catch {
        // Ignore finalize errors and return the primary failure.
      }
    }

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
        message: "Failed to search leads",
        error: message,
        searchRunId,
      },
      { status: 500 },
    );
  }
}

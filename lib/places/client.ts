import { getServerEnv } from "@/lib/server-env";
import { classifyWebsitePresence } from "@/lib/leads/website-signals";

const PLACES_API_BASE_URL = "https://places.googleapis.com/v1";

type PlacesDisplayName = {
  text?: string;
  languageCode?: string;
};

type PlacesApiPlace = {
  id?: string;
  name?: string;
  displayName?: PlacesDisplayName;
  formattedAddress?: string;
  primaryType?: string;
  types?: string[];
  businessStatus?: string;
  googleMapsUri?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
};

type TextSearchResponse = {
  places?: PlacesApiPlace[];
  nextPageToken?: string;
};

type PlacesTextSearchInput = {
  textQuery: string;
  pageSize: number;
  languageCode: string;
  regionCode?: string;
};

export type LeadSearchCandidate = {
  placeId: string;
  source: "google_places";
  businessName: string;
  rubroTecnico: string | null;
  rubroComercial: string;
  city: string;
  address: string | null;
  mapsUrl: string | null;
  businessStatus: string | null;
  phoneE164: string | null;
  websiteUrl: string | null;
  hasWebsite: boolean;
  instagramUrl: string | null;
  whatsappUrl: string | null;
  rating: number | null;
  reviewsCount: number;
};

async function placesFetch<T>(
  path: string,
  options: Omit<RequestInit, "headers"> & { fieldMask: string },
): Promise<T> {
  const { GOOGLE_PLACES_API_KEY } = getServerEnv();
  const response = await fetch(`${PLACES_API_BASE_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": options.fieldMask,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Places API error (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}

export async function textSearchPlaces(input: PlacesTextSearchInput) {
  const body = {
    textQuery: input.textQuery,
    pageSize: input.pageSize,
    languageCode: input.languageCode,
    regionCode: input.regionCode,
  };

  const fieldMask = [
    "places.id",
    "places.name",
    "places.displayName",
    "places.formattedAddress",
    "places.primaryType",
    "places.types",
    "places.businessStatus",
    "places.googleMapsUri",
  ].join(",");

  return placesFetch<TextSearchResponse>("/places:searchText", {
    method: "POST",
    body: JSON.stringify(body),
    fieldMask,
  });
}

export async function getPlaceDetails(placeResourceName: string, languageCode: string) {
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "primaryType",
    "types",
    "businessStatus",
    "googleMapsUri",
    "internationalPhoneNumber",
    "websiteUri",
    "rating",
    "userRatingCount",
  ].join(",");

  const path = `/${placeResourceName}?languageCode=${encodeURIComponent(languageCode)}`;
  return placesFetch<PlacesApiPlace>(path, {
    method: "GET",
    fieldMask,
  });
}

export function mapPlaceToLeadCandidate(
  place: PlacesApiPlace,
  rubroComercial: string,
  city: string,
): LeadSearchCandidate | null {
  if (!place.id || !place.displayName?.text) {
    return null;
  }

  const websiteSignals = classifyWebsitePresence(place.websiteUri ?? null);
  const reviewsCount = place.userRatingCount ?? 0;

  let instagramUrl: string | null = null;
  let whatsappUrl: string | null = null;

  if (websiteSignals.socialSignalType === "instagram") {
    instagramUrl = websiteSignals.normalizedUrl;
  }

  if (websiteSignals.socialSignalType === "whatsapp") {
    whatsappUrl = websiteSignals.normalizedUrl;
  }

  return {
    placeId: place.id,
    source: "google_places",
    businessName: place.displayName.text,
    rubroTecnico: place.primaryType ?? null,
    rubroComercial,
    city,
    address: place.formattedAddress ?? null,
    mapsUrl: place.googleMapsUri ?? null,
    businessStatus: place.businessStatus ?? null,
    phoneE164: place.internationalPhoneNumber ?? null,
    websiteUrl: websiteSignals.hasWebsite ? websiteSignals.normalizedUrl : null,
    hasWebsite: websiteSignals.hasWebsite,
    instagramUrl,
    whatsappUrl,
    rating: place.rating ?? null,
    reviewsCount,
  };
}

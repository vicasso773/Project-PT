// Google Places API (New). Optional: needs GOOGLE_PLACES_API_KEY.

import type { PlacesInfo } from "./types";

export type PlacesResult =
  | { ok: true; data: PlacesInfo }
  | { ok: false; reason: string };

const FIELDS = [
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours.weekdayDescriptions",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.businessStatus",
  "places.photos",
  "places.primaryTypeDisplayName",
].join(",");

export const bareHost = (u: string) => {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function toInfo(p: any, matchedWebsite: boolean): PlacesInfo {
  return {
    name: p.displayName?.text ?? "",
    address: p.formattedAddress,
    phone: p.nationalPhoneNumber,
    rating: p.rating,
    reviewCount: p.userRatingCount,
    hours: p.regularOpeningHours?.weekdayDescriptions,
    mapsUrl: p.googleMapsUri,
    website: p.websiteUri,
    matchedWebsite,
    status: p.businessStatus,
    photoCount: Array.isArray(p.photos) ? p.photos.length : 0,
    category: p.primaryTypeDisplayName?.text,
  };
}

export { toInfo };

/**
 * Search Google for the business. When `siteUrl` is given, we only accept a
 * listing whose website is the same domain, so we never compare against the wrong business.
 */
export async function lookupPlace(
  query: string,
  siteUrl?: string,
  apiKey = process.env.GOOGLE_PLACES_API_KEY,
): Promise<PlacesResult> {
  if (!apiKey) return { ok: false, reason: "Google Places key not set (GOOGLE_PLACES_API_KEY)." };
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELDS,
      },
      // Bias results toward the Chicago area.
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 5,
        locationBias: { circle: { center: { latitude: 41.88, longitude: -87.63 }, radius: 50000 } },
      }),
    });
    const json: any = await res.json();
    if (!res.ok) return { ok: false, reason: `Google Places error: ${json?.error?.message ?? res.status}` };
    const places: any[] = json.places ?? [];
    if (!places.length) return { ok: false, reason: `No Google listing found for "${query}".` };
    if (!siteUrl) return { ok: true, data: toInfo(places[0], false) };
    const host = bareHost(siteUrl);
    const match = places.find((p) => p.websiteUri && bareHost(p.websiteUri) === host);
    if (match) return { ok: true, data: toInfo(match, true) };
    return {
      ok: false,
      reason: `Found Google listings for "${query}", but none link to ${host}, so we couldn't confidently match the business.`,
    };
  } catch {
    return { ok: false, reason: "Couldn't reach Google Places." };
  }
}

import axios from "axios";
import { env } from "../../../config/env";

interface PhotoMeta {
  name?: string;
  widthPx?: number;
  heightPx?: number;
}

/**
 * Resolve a v1 photo resource name to a public CDN URL.
 * skipHttpRedirect=true → returns JSON { photoUri: "..." }
 * API key is NEVER exposed to the frontend.
 */
export async function resolvePhotoUrl(
  photoResourceName: string,
  maxWidthPx = 1200,
): Promise<string | undefined> {
  if (!env.GOOGLE_PLACES_API_KEY) return undefined;
  try {
    const res = await axios.get(
      `https://places.googleapis.com/v1/${photoResourceName}/media`,
      {
        params: {
          maxWidthPx,
          skipHttpRedirect: true,
          key: env.GOOGLE_PLACES_API_KEY,
        },
        timeout: 5000,
      },
    );
    const uri = res.data?.photoUri;
    return typeof uri === "string" ? uri : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Pick the best photo candidates (largest first, prefer landscape).
 */
export function getPhotoCandidates(photos: PhotoMeta[]) {
  const withMeta = photos.map((photo, index) => {
    const width = photo.widthPx ?? 0;
    const height = photo.heightPx ?? 0;
    const area = width * height;
    const aspect = height > 0 ? width / height : undefined;
    return { ...photo, index, area, aspect };
  });

  const landscape = withMeta.filter(
    (photo) => photo.aspect === undefined || photo.aspect >= 1.1,
  );

  return (landscape.length > 0 ? landscape : withMeta).sort(
    (a, b) => b.area - a.area || a.index - b.index,
  );
}

/**
 * Resolve the best available photo URL with minimal retries.
 */
export async function resolveBestPhotoUrl(
  photos: PhotoMeta[],
): Promise<string | undefined> {
  const candidates = getPhotoCandidates(photos).slice(0, 3);

  for (const candidate of candidates) {
    if (!candidate.name) continue;

    const hiRes = await resolvePhotoUrl(candidate.name, 1200);
    if (hiRes) return hiRes;

    const midRes = await resolvePhotoUrl(candidate.name, 800);
    if (midRes) return midRes;
  }

  return undefined;
}

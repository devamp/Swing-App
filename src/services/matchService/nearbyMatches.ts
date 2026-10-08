import type { FoundMatch } from './types';

export type SearchCenter = { latitude: number; longitude: number; label: string };

export function hasCoordinates(value: { latitude?: number; longitude?: number }): value is {
  latitude: number;
  longitude: number;
} {
  return (
    typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.longitude) <= 180
  );
}

export function selectNearbyMatches(
  matches: FoundMatch[],
  center: SearchCenter,
  radiusMiles: number,
  userId: string,
  now = Date.now(),
): FoundMatch[] {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  return matches
    .flatMap((match) => {
      if (match.userId === userId || match.startsAt.toMillis() < now || match.playersNeeded <= 0)
        return [];
      const court = match.matchCourtLocation;
      const coordinates = court.courtLocation ?? court;
      if (!hasCoordinates(coordinates)) return [];
      const a =
        Math.sin(radians(coordinates.latitude - center.latitude) / 2) ** 2 +
        Math.cos(radians(center.latitude)) *
          Math.cos(radians(coordinates.latitude)) *
          Math.sin(radians(coordinates.longitude - center.longitude) / 2) ** 2;
      const distanceMiles = 3958.8 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
      if (distanceMiles > radiusMiles) return [];
      // Stored court distances belong to the creator's search, not this viewer.
      return [{ ...match, matchCourtLocation: { ...court, distanceMiles } }];
    })
    .sort(
      (a, b) =>
        a.matchCourtLocation.distanceMiles! - b.matchCourtLocation.distanceMiles! ||
        a.startsAt.toMillis() - b.startsAt.toMillis(),
    );
}

import type { FoundMatch } from './types';
import Constants from '../../constants';
import type { SearchCriteria } from '../../navigation/screens/onboarding/OnboardingFlowTypes';

export type SearchCenter = { latitude: number; longitude: number; label: string };

export function getSavedSearchCenter(area?: SearchCriteria): SearchCenter | null {
  if (!area) return null;
  if (hasCoordinates(area)) {
    return { latitude: area.latitude, longitude: area.longitude, label: area.label };
  }
  // Older accounts saved the manual Portland preset as a label without coordinates.
  if (area.type === 'Manual' && area.label === Constants.PORTLAND) {
    return { ...Constants.PORTLAND_CENTER };
  }
  return null;
}

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

export function withViewerDistance(
  match: FoundMatch,
  viewerLocation: Pick<SearchCenter, 'latitude' | 'longitude'> | null,
): FoundMatch {
  const court = match.matchCourtLocation;
  const coordinates = court.courtLocation ?? court;
  let distanceMiles: number | undefined;

  if (viewerLocation && hasCoordinates(viewerLocation) && hasCoordinates(coordinates)) {
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const a =
      Math.sin(radians(coordinates.latitude - viewerLocation.latitude) / 2) ** 2 +
      Math.cos(radians(viewerLocation.latitude)) *
        Math.cos(radians(coordinates.latitude)) *
        Math.sin(radians(coordinates.longitude - viewerLocation.longitude) / 2) ** 2;
    distanceMiles = 3958.8 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
  }

  // Never use a distance saved by the match creator for another viewer.
  return { ...match, matchCourtLocation: { ...court, distanceMiles } };
}

export function selectNearbyMatches(
  matches: FoundMatch[],
  center: SearchCenter,
  radiusMiles: number,
  userId: string,
  now = Date.now(),
): FoundMatch[] {
  return matches
    .flatMap((match) => {
      if (
        match.userId === userId ||
        match.members?.includes(userId) ||
        match.startsAt.toMillis() < now ||
        match.playersNeeded <= 0
      )
        return [];
      const result = withViewerDistance(match, center);
      const distanceMiles = result.matchCourtLocation.distanceMiles;
      if (distanceMiles == null || distanceMiles > radiusMiles) return [];
      return [result];
    })
    .sort(
      (a, b) =>
        a.matchCourtLocation.distanceMiles! - b.matchCourtLocation.distanceMiles! ||
        a.startsAt.toMillis() - b.startsAt.toMillis(),
    );
}

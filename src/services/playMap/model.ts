import type {
  Filters,
  MapRegion,
  PlayMatch,
  PlayPlayer,
  PlayResult,
  SearchRequest,
  Coordinate,
} from './types';
export const DEFAULT_FILTERS: Filters = {
  sport: 'All sports',
  distance: 10,
  skill: 'Any skill',
  date: 'Any day',
  time: 'Any time',
  availability: 'Any availability',
};
export const DEFAULT_REGION: MapRegion = {
  latitude: 45.39,
  longitude: -122.748,
  latitudeDelta: 0.14,
  longitudeDelta: 0.14,
};
export function distanceMiles(a: Coordinate, b: Coordinate) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const h =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 7917.6 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function selectResults(
  data: (PlayMatch | PlayPlayer)[],
  { mode, filters: f, region }: SearchRequest,
  now = new Date(),
): PlayResult[] {
  return data
    .flatMap((item) => {
      if (
        item.kind !== mode ||
        (f.sport !== 'All sports' && item.sport !== f.sport) ||
        (f.skill !== 'Any skill' && item.skill !== f.skill)
      )
        return [];
      const distance = distanceMiles(region, item.coordinate);
      if (
        distance > f.distance ||
        Math.abs(item.coordinate.latitude - region.latitude) > region.latitudeDelta / 2 ||
        Math.abs(item.coordinate.longitude - region.longitude) > region.longitudeDelta / 2
      )
        return [];
      if (item.kind === 'matches') {
        const date = new Date(item.startsAt);
        if (date <= now || item.openSpots <= 0) return [];
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const afterTomorrow = new Date(tomorrow);
        afterTomorrow.setDate(tomorrow.getDate() + 1);
        if (f.date === 'Today' && date >= tomorrow) return [];
        if (f.date === 'Tomorrow' && (date < tomorrow || date >= afterTomorrow)) return [];
        const weekend = new Date(today);
        weekend.setDate(today.getDate() + (today.getDay() === 0 ? 0 : 6 - today.getDay()));
        const weekendEnd = new Date(weekend);
        weekendEnd.setDate(weekend.getDate() + (weekend.getDay() === 0 ? 1 : 2));
        if (f.date === 'This weekend' && (date < weekend || date >= weekendEnd)) return [];
        const time =
          date.getHours() < 12 ? 'Morning' : date.getHours() < 17 ? 'Afternoon' : 'Evening';
        if (f.time !== 'Any time' && f.time !== time) return [];
      } else if (
        f.availability !== 'Any availability' &&
        !item.availability.includes(f.availability)
      )
        return [];
      return [{ ...item, distanceMiles: distance }];
    })
    .sort((a, b) => a.distanceMiles - b.distanceMiles || a.id.localeCompare(b.id));
}
export const locationKey = (coordinate: Coordinate) =>
  `${coordinate.latitude}:${coordinate.longitude}`;
export type MarkerGroup = {
  id: string;
  coordinate: Coordinate;
  results: PlayResult[];
  exact: boolean;
  label: string;
};
/** Screen-space connected components prevent overlapping pins. Exact locations never split. */
export function clusterResults(
  results: PlayResult[],
  region: MapRegion,
  width: number,
  height: number,
): MarkerGroup[] {
  const groups: PlayResult[][] = [];
  const overlaps = (a: PlayResult, b: PlayResult) => {
    const x = ((a.coordinate.longitude - b.coordinate.longitude) / region.longitudeDelta) * width;
    const y = ((a.coordinate.latitude - b.coordinate.latitude) / region.latitudeDelta) * height;
    return Math.hypot(x, y) < 58;
  };
  for (const result of results) {
    const touching = groups.filter((group) => group.some((other) => overlaps(result, other)));
    const merged = [result, ...touching.flat()];
    for (const group of touching) groups.splice(groups.indexOf(group), 1);
    groups.push(merged);
  }
  return groups.map((group) => {
    // Preserve the list's ordering within a group, independently of zoom level.
    const members = results.filter((result) => group.includes(result));
    const exact = members.every(
      (item) => locationKey(item.coordinate) === locationKey(members[0].coordinate),
    );
    return {
      id: members
        .map((item) => item.id)
        .sort()
        .join('|'),
      results: members,
      exact,
      coordinate: {
        latitude: members.reduce((sum, item) => sum + item.coordinate.latitude, 0) / members.length,
        longitude:
          members.reduce((sum, item) => sum + item.coordinate.longitude, 0) / members.length,
      },
      label: exact
        ? members[0].kind === 'matches'
          ? members[0].venue
          : members[0].area
        : 'Nearby locations',
    };
  });
}
export const regionChanged = (a: MapRegion, b: MapRegion) =>
  Math.abs(a.latitude - b.latitude) > 0.0001 ||
  Math.abs(a.longitude - b.longitude) > 0.0001 ||
  Math.abs(a.latitudeDelta - b.latitudeDelta) > 0.0001 ||
  Math.abs(a.longitudeDelta - b.longitudeDelta) > 0.0001;
export function eligibleMatches(matches: PlayMatch[], player: PlayPlayer, now = new Date()) {
  return matches.filter(
    (match) =>
      match.hosted &&
      match.openSpots > 0 &&
      new Date(match.startsAt) > now &&
      match.sport === player.sport,
  );
}

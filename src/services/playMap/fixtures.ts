import type { Area, Availability, PlayMatch, PlayPlayer, Skill, Sport } from './types';
export const AREAS: Area[] = [
  { label: 'Tualatin, OR', latitude: 45.3716, longitude: -122.742 },
  { label: 'Lake Oswego, OR', latitude: 45.4107, longitude: -122.7205 },
  { label: 'Tigard, OR', latitude: 45.4306, longitude: -122.7715 },
  { label: 'Portland, OR', latitude: 45.5152, longitude: -122.6784 },
];
export const VENUES = [
  { name: 'Tualatin Community Park', latitude: 45.3862, longitude: -122.7634 },
  { name: 'Jurgens Park', latitude: 45.398, longitude: -122.7793 },
  { name: 'Browns Ferry Park', latitude: 45.3843, longitude: -122.7402 },
  { name: 'Westlake Park', latitude: 45.4275, longitude: -122.7205 },
  { name: 'Cook Park', latitude: 45.4023, longitude: -122.778 },
  { name: 'Gabriel Park', latitude: 45.4719, longitude: -122.722 },
];
export const AVAILABILITIES: Availability[] = [
  'Weekday mornings',
  'Weekday evenings',
  'Weekend mornings',
  'Weekend afternoons',
];
export function makeFixtures(now = new Date()) {
  const date = (days: number, hour: number) => {
    const value = new Date(now);
    value.setDate(value.getDate() + days);
    value.setHours(hour, 0, 0, 0);
    return value.toISOString();
  };
  const specs: [number, Sport, Skill, number, number, number, boolean][] = [
    [0, 'Tennis', 'Intermediate', 0, 18, 1, false],
    [0, 'Tennis', 'Beginner', 1, 9, 3, false],
    [0, 'Pickleball', 'Intermediate', 2, 17, 2, false],
    [1, 'Pickleball', 'Beginner', 1, 10, 3, false],
    [2, 'Tennis', 'Advanced', 2, 18, 1, false],
    [3, 'Pickleball', 'Intermediate', 3, 14, 2, false],
    [4, 'Tennis', 'Intermediate', 4, 9, 1, false],
    [5, 'Tennis', 'Advanced', 5, 18, 2, false],
    [0, 'Tennis', 'Intermediate', 2, 18, 2, true],
    [1, 'Pickleball', 'Beginner', 3, 10, 3, true],
    [2, 'Tennis', 'Advanced', 4, 9, 0, true],
    [3, 'Pickleball', 'Intermediate', -1, 10, 2, true],
  ];
  const matches: PlayMatch[] = specs.map(
    ([venue, sport, skill, day, hour, openSpots, hosted], i) => ({
      id: `play-match-${i}`,
      kind: 'matches',
      sport,
      skill,
      coordinate: VENUES[venue],
      area: venue < 3 ? 'Tualatin' : 'Portland metro',
      venue: VENUES[venue].name,
      title:
        sport === 'Tennis'
          ? openSpots === 1
            ? 'Friendly singles'
            : 'Social doubles'
          : 'Pickleball open play',
      startsAt: date(day, hour),
      openSpots,
      hosted,
      note: 'A friendly game and a little fresh air. Bring your paddle or racket and water. All are welcome!',
    }),
  );
  const names = [
    'Alex Chen',
    'Maya Patel',
    'Jordan Lee',
    'Sam Rivera',
    'Taylor Brooks',
    'Casey Nguyen',
    'Morgan Davis',
    'Jamie Wilson',
  ];
  const players: PlayPlayer[] = names.map((name, i) => ({
    id: `play-player-${i}`,
    kind: 'players',
    name,
    sport: i % 2 ? 'Pickleball' : 'Tennis',
    skill: (['Intermediate', 'Beginner', 'Advanced'] as Skill[])[i % 3],
    // Shared neighborhood centers are intentionally coarse; never device/live positions.
    coordinate: i < 3 ? AREAS[0] : i < 5 ? { latitude: 45.376, longitude: -122.745 } : AREAS[i % 4],
    area: i < 5 ? 'Tualatin area' : `${AREAS[i % 4].label.split(',')[0]} area`,
    availability: [AVAILABILITIES[i % 4], AVAILABILITIES[(i + 1) % 4]],
  }));
  return { matches, players };
}

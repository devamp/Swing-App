import { makeFixtures, VENUES } from './fixtures';
import { eligibleMatches, selectResults } from './model';
import type { PlayMapService } from './types';
export type MockScenario =
  | 'success'
  | 'empty'
  | 'error'
  | 'slow'
  | 'location-unavailable'
  | 'no-hosted'
  | 'invite-error'
  | 'create-error';
export function createMockPlayMapService(
  scenario: MockScenario = 'success',
  delayMs = scenario === 'slow' ? 8000 : 650,
): PlayMapService {
  const data = makeFixtures();
  if (scenario === 'no-hosted') data.matches = data.matches.filter((match) => !match.hosted);
  const invites = new Set<string>();
  let failedSearch = false;
  let failedInvite = false;
  let failedCreate = false;
  const wait = () => new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  return {
    async search(request) {
      await wait();
      if (scenario === 'error' && !failedSearch) {
        failedSearch = true;
        throw new Error('Connection unavailable. Please try again.');
      }
      if (scenario === 'empty') return [];
      return selectResults([...data.matches, ...data.players], request);
    },
    async getMatch(id) {
      await wait();
      return data.matches.find((match) => match.id === id);
    },
    async getHostedMatches(player) {
      await wait();
      return eligibleMatches(data.matches, player);
    },
    async invite(player, matchId) {
      await wait();
      if (scenario === 'invite-error' && !failedInvite) {
        failedInvite = true;
        throw new Error('Your invitation wasn’t sent. Please retry.');
      }
      if (!eligibleMatches(data.matches, player).some((match) => match.id === matchId))
        throw new Error('This match no longer has an open spot.');
      // Idempotent mock: retries never send a second invitation or reserve a spot.
      invites.add(`${player.id}:${matchId}`);
    },
    async createMatch(input) {
      await wait();
      if (scenario === 'create-error' && !failedCreate) {
        failedCreate = true;
        throw new Error('Couldn’t create your match. Please retry.');
      }
      const venue = VENUES[input.venueIndex];
      if (
        !venue ||
        !Number.isFinite(Date.parse(input.startsAt)) ||
        new Date(input.startsAt) <= new Date() ||
        input.openSpots < 1
      )
        throw new Error('Choose a future time, a venue, and at least one open spot.');
      const match = {
        ...input,
        id: `play-created-${data.matches.length}`,
        kind: 'matches' as const,
        hosted: true,
        coordinate: venue,
        venue: venue.name,
        area: 'Portland metro',
        title: 'Friendly doubles',
        note: 'Looking forward to playing together!',
      };
      data.matches.push(match);
      return match;
    },
  };
}
// Set EXPO_PUBLIC_PLAY_MAP_SCENARIO in .env.local and restart Metro. No UI debug controls.
export const mockScenario = (process.env.EXPO_PUBLIC_PLAY_MAP_SCENARIO ||
  'no-hosted') as MockScenario;
// Replace this adapter with your implementation of PlayMapService when the backend is ready.
export const playMapService: PlayMapService = createMockPlayMapService(mockScenario);

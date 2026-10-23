import type { FoundMatch } from '../services/matchService/types';

export type MatchPlayer = { id: string; name: string };
export type MyMatch = {
  match: FoundMatch;
  role: 'hosted' | 'joined';
  players: MatchPlayer[];
};

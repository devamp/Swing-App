export type Mode = 'matches' | 'players';
 type Sport = 'Tennis' | 'Pickleball';
export type Skill = 'Beginner' | 'Intermediate' | 'Advanced';
export type Availability =
  | 'Weekday mornings'
  | 'Weekday evenings'
  | 'Weekend mornings'
  | 'Weekend afternoons';
export type Coordinate = { latitude: number; longitude: number };
export type MapRegion = Coordinate & { latitudeDelta: number; longitudeDelta: number };
export type Area = Coordinate & { label: string };
export type Filters = {
  sport: 'All sports' | Sport;
  distance: number;
  skill: 'Any skill' | Skill;
  date: 'Any day' | 'Today' | 'Tomorrow' | 'This weekend';
  time: 'Any time' | 'Morning' | 'Afternoon' | 'Evening';
  availability: 'Any availability' | Availability;
};
type BaseResult = { id: string; sport: Sport; skill: Skill; coordinate: Coordinate; area: string };
export type PlayMatch = BaseResult & {
  kind: 'matches';
  title: string;
  venue: string;
  startsAt: string;
  openSpots: number;
  hosted: boolean;
  note: string;
};
export type PlayPlayer = BaseResult & {
  kind: 'players';
  name: string;
  availability: Availability[];
};
type PlayResult = (PlayMatch | PlayPlayer) & { distanceMiles: number };
export type SearchRequest = { mode: Mode; filters: Filters; region: MapRegion };
export type CreatePlayMatch = {
  sport: Sport;
  skill: Skill;
  venueIndex: number;
  startsAt: string;
  openSpots: number;
};
/** All backend-dependent Play Map operations. No Firebase/auth types cross this boundary. */
export interface PlayMapService {
  search(request: SearchRequest): Promise<PlayResult[]>;
  getMatch(id: string): Promise<PlayMatch | undefined>;
  getHostedMatches(player: PlayPlayer): Promise<PlayMatch[]>;
  invite(player: PlayPlayer, matchId: string): Promise<void>;
  createMatch(input: CreatePlayMatch): Promise<PlayMatch>;
}

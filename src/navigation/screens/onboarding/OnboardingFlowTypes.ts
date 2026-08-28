export type SportPreference = 'Tennis' | 'Pickleball' | 'Both';

export type SearchRadiusMiles = 5 | 10 | 25;

export type SearchCriteria =
  | {
      type: 'Current';
      label: 'Current location';
      latitude?: number;
      longitude?: number;
    }
  | {
      type: 'Manual';
      label: string;
    };

export type SkillLevel = 'Beginner' | 'Casual' | 'Intermediate' | 'Advanced' | 'Competitive';

export type AvailabilityPreference = 'Morning' | 'Afternoon' | 'Evening' | 'Weekend';

export type PlayStyle = 'Rally' | 'Singles' | 'Doubles' | 'Casual Match' | 'Open Play';

export type OnboardingSportParams = {
  selectedSport: SportPreference;
};

export type OnboardingLocationParams = OnboardingSportParams & {
  searchCriteria: SearchCriteria;
  radiusMiles: SearchRadiusMiles;
};

export type OnboardingMatchPreferencesParams = OnboardingLocationParams & {
  skillLevel: SkillLevel;
  availability: AvailabilityPreference[];
  playStyles: PlayStyle[];
};

export type MatchDetails = {
  courtType?: 'Indoor' | 'Outdoor';
  distance: string;
  gameType?: PlayStyle;
  latitude: number;
  longitude: number;
  numPlayers: number;
  playDate?: string;
  playerStatus?: 'Confirmed' | 'Pending';
  skillLevel: SkillLevel;
  locationName?: string;
  playTime?: string;
};

export type OnboardingMatchedPlayerDetails = {
  id: string;
  name: string;
  sport: 'Tennis' | 'Pickleball';
  matchDetails: MatchDetails;
};

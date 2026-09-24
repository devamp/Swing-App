declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

export type SignUpCredentials = {
  username: string;
  email: string;
  password: string;
};

export type User = {
  username: string;
  email: string;
  onboardingPreferences: OnboardingMatchPreferencesParams;
  profile: PlayerProfile;
  isClaimed: boolean;
  createdAt: any;
  updatedAt: any;
};

export type CourtType = 'public_outdoor' | 'public_indoor' | 'private' | 'unknown';
export type SkillLevel =
  | 'any'
  | 'beginner'
  | 'casual'
  | 'intermediate'
  | 'advanced'
  | 'competitive';
export type Sport = 'tennis' | 'pickleball';

export type CourtLocation = {
  name: string;
  address?: string;
  distanceMiles?: number;
  courtType?: CourtType;
  courtLocation?: {
    latitude: number;
    longitude: number;
  };
  // Kept for compatibility with court records created before courtLocation was added.
  latitude?: number;
  longitude?: number;
};

export type ProfileSport = 'Tennis' | 'Pickleball';

export type ProfileSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type PreferredGameType = 'Singles' | 'Doubles' | 'Both';

export type ProfilePlayStyle = 'Casual' | 'Competitive' | 'Both';

export type MatchActivity = {
  upcoming: number;
  joined: number;
  hosted: number;
};

export type PlayerProfile = {
  location?: string;
  availabilityStatus?: string;
  bio?: string;
  sports?: Partial<Record<ProfileSport, ProfileSkillLevel>>;
  preferredGameType?: PreferredGameType;
  playStyle?: ProfilePlayStyle;
  typicalAvailability?: string[];
  matchActivity?: MatchActivity;
};

export type PlayerProfileUpdate = Omit<PlayerProfile, 'matchActivity'> & {
  displayName: string;
};

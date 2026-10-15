// Match service types
import type { FieldValue, Timestamp } from 'firebase/firestore';
import { CourtLocation, SkillLevel, Sport } from '../../types';
import { SportPreference } from '../../navigation/screens/onboarding/OnboardingFlowTypes';

export type CreateMatchForm = {
  sport: Sport | null;
  location: CourtLocation | null;
  dateLabel: string | null;
  timeLabel: string | null;
  matchDate: Date | null;
  matchTime: Date | null;
  skillLevel: SkillLevel;
  gameType: string | null;
  playersNeeded: number;
  matchName: string;
  note: string;
};

export type CreateMatchParams = {
  sport: Sport;
  location: CourtLocation;
  startsAt: Date;
  skillLevel: SkillLevel;
  gameType: string;
  playersNeeded: number;
  note: string;
  matchName: string;
};

export type DBMatch = {
  id: string;
  userId: string;
  sport: Sport;
  matchCourtLocation: CourtLocation;
  startsAt: Timestamp;
  skillLevel: SkillLevel;
  gameType: string;
  playersNeeded: number;
  note: string;
  matchName: string;
  members: string[];
  hostName: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

export type FoundMatch = DBMatch & {
  id: string;
};

export type FindMatchFilter = {
  isOpenMatchesSearch: boolean;
  sport: SportPreference;
};

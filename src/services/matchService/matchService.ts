import { Database } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  query,
  limit,
  updateDoc,
  increment,
  where,
  getDoc,
} from 'firebase/firestore';
import { CreateMatchParams, DBMatch, FindMatchFilter, FoundMatch } from './types';
import { authService } from '../authService';

class MatchService {
  async createMatch(createMatchParams: CreateMatchParams): Promise<string> {
    try {
      const authUser = authService.getCurrentUser();
      if (!authUser) throw new Error('Could not retrieve auth user');

      const { uid } = authUser;
      const { sport, location, startsAt, skillLevel, gameType, playersNeeded, note } =
        createMatchParams;

      if (!Number.isFinite(startsAt.getTime())) {
        throw new Error('Match start time is invalid');
      }
      if (startsAt.getTime() <= Date.now()) {
        throw new Error('Match start time must be in the future');
      }

      // Create match
      const matchRef = doc(collection(Database, 'Matches'));

      const newMatchDetails: DBMatch = {
        id: matchRef.id,
        userId: uid,
        sport,
        matchCourtLocation: location,
        startsAt: Timestamp.fromDate(startsAt),
        skillLevel,
        gameType,
        playersNeeded,
        note: note.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(matchRef, newMatchDetails);

      // Update user record
      const userRef = doc(Database, 'Users', uid);
      await updateDoc(userRef, {
        'profile.matchActivity.hosted': increment(1),
      });
      return matchRef.id;
    } catch (error) {
      console.error('Error creating match: ', error);
      throw error;
    }
  }

  async getMatchDetailsById(matchId: string): Promise<FoundMatch | null> {
    try {
      const ref = doc(Database, 'Matches', matchId);
      const dbMatch = await getDoc(ref);

      if (dbMatch.exists()) {
        return {
          ...(dbMatch.data() as Omit<FoundMatch, 'id'>),
          id: dbMatch.id,
        };
      }

      console.log(`Could not find match by id: ${matchId}`);
      return null;
    } catch (error) {
      console.error('Error getting match by id: ', error);
      throw error;
    }
  }

  async getUpcomingMatchForUser(userId: string): Promise<FoundMatch | null> {
    try {
      const matchesQuery = query(collection(Database, 'Matches'), where('userId', '==', userId));
      const querySnapshot = await getDocs(matchesQuery);
      const now = Date.now();

      const upcomingMatches = querySnapshot.docs
        .map((matchDocument) => ({
          ...(matchDocument.data() as Omit<FoundMatch, 'id'>),
          id: matchDocument.id,
        }))
        .filter((match) => match.startsAt.toMillis() >= now)
        .sort(
          (firstMatch, secondMatch) =>
            firstMatch.startsAt.toMillis() - secondMatch.startsAt.toMillis(),
        );

      return upcomingMatches[0] ?? null;
    } catch (error) {
      console.error('Error finding upcoming match: ', error);
      throw error;
    }
  }

  // Find all matches that match a certain criteria
  async findMatches({
    filter,
    size = 3,
  }: {
    filter?: Partial<FindMatchFilter>;
    size?: number;
  } = {}): Promise<FoundMatch[]> {
    try {
      const isOpenMatchesSearch = filter?.isOpenMatchesSearch;
      const collectionRef = collection(Database, 'Matches');

      let querySnapshot;
      let matchesQuery;
      if (isOpenMatchesSearch) {
        const authUser = authService.getCurrentUser();
        if (!authUser) throw new Error('Could not retrieve auth user');

        matchesQuery = query(collectionRef, limit(size), where('userId', '!=', authUser.uid));
      } else {
        matchesQuery = query(collectionRef, limit(size));
      }

      querySnapshot = await getDocs(matchesQuery);

      const matches: FoundMatch[] = [];
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const {
            userId,
            sport,
            startsAt,
            skillLevel,
            gameType,
            playersNeeded,
            note,
            createdAt,
            updatedAt,
            matchCourtLocation,
          } = doc.data();

          matches.push({
            id: doc.id,
            userId,
            sport,
            startsAt,
            skillLevel,
            gameType,
            playersNeeded,
            note,
            createdAt,
            updatedAt,
            matchCourtLocation,
          });
        });
      }

      return matches;
    } catch (error) {
      console.error('Error finding matches: ', error);
      throw error;
    }
  }
}

export const matchService = new MatchService();

import { Database } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  query,
  limit,
  updateDoc,
  increment,
  where,
  getDoc,
  runTransaction,
  arrayUnion,
  or,
  arrayRemove,
} from 'firebase/firestore';
import { CreateMatchParams, DBMatch, FindMatchFilter, FoundMatch } from './types';
import { authService } from '../authService';
import { SwingBadRequestError, SwingError, SwingNotFoundError } from '../errorService';

const discoverableMatchesQuery = () =>
  query(collection(Database, 'Matches'), where('startsAt', '>=', Timestamp.now()));

class MatchService {
  async createMatch(createMatchParams: CreateMatchParams): Promise<string> {
    try {
      const authUser = authService.getCurrentUser();
      if (!authUser) throw new SwingBadRequestError('Please sign in to continue.');

      const { uid, displayName } = authUser;
      const { sport, location, startsAt, skillLevel, gameType, playersNeeded, note, matchName } =
        createMatchParams;

      if (!Number.isFinite(startsAt.getTime())) {
        throw new SwingBadRequestError('Choose a valid match start time.');
      }
      if (startsAt.getTime() <= Date.now()) {
        throw new SwingBadRequestError('Choose a match start time in the future.');
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
        matchName: matchName.trim() || `${authUser.displayName}'s Match`,
        members: [],
        hostName: displayName ?? '?',
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
      throw SwingError.parse(error);
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
      throw SwingError.parse(error);
    }
  }

  async getUpcomingMatchForUser(userId: string): Promise<FoundMatch | null> {
    try {
      const matchesQuery = query(
        collection(Database, 'Matches'),
        or(where('userId', '==', userId), where('members', 'array-contains', userId)),
      );
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
      throw SwingError.parse(error);
    }
  }

  async getDiscoverableMatches(): Promise<FoundMatch[]> {
    // Filter geographically before limiting the Dashboard preview. A fixed first page
    // can otherwise report no results while nearby matches exist on later pages.
    const snapshot = await getDocsFromServer(discoverableMatchesQuery());
    return snapshot.docs.map((document) => ({
      ...(document.data() as Omit<FoundMatch, 'id'>),
      id: document.id,
    }));
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
      const { isOpenMatchesSearch, sport } = filter ?? ({} as Partial<FindMatchFilter>);
      const collectionRef = collection(Database, 'Matches');

      let querySnapshot;
      let matchesQuery = query(collectionRef, limit(size));

      // Filter checks
      if (isOpenMatchesSearch) {
        const authUser = authService.getCurrentUser();
        if (!authUser) throw new SwingBadRequestError('Please sign in to continue.');

        matchesQuery = query(collectionRef, limit(size), where('userId', '!=', authUser.uid));
      }

      if (sport && sport !== 'Both') {
        matchesQuery = query(collectionRef, limit(size), where('sport', '==', sport.toLowerCase()));
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
            matchName,
            members,
            hostName,
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
            matchName,
            members,
            hostName,
          });
        });
      }

      return matches;
    } catch (error) {
      console.error('Error finding matches: ', error);
      throw SwingError.parse(error);
    }
  }

  async deleteMatchById(matchId: string): Promise<void> {
    try {
      const authUser = authService.getCurrentUser();
      if (!authUser) throw new SwingBadRequestError('Please sign in to continue.');

      const ref = doc(Database, 'Matches', matchId);
      await runTransaction(Database, async (transaction) => {
        const dbMatch = await transaction.get(ref);
        // Already removed: do not decrement the host's count again.
        if (!dbMatch.exists()) return;
        if (dbMatch.data().userId !== authUser.uid) {
          throw new SwingBadRequestError('You can only delete matches you host.');
        }

        const userRef = doc(Database, 'Users', authUser.uid);
        transaction.update(userRef, {
          'profile.matchActivity.hosted': increment(-1),
        });

        dbMatch.data().members.forEach((memberId: string) => {
          const userRef = doc(Database, 'Users', memberId);
          transaction.update(userRef, {
            'profile.matchActivity.joined': increment(-1),
          });
        });

        transaction.delete(ref);
      });
    } catch (error) {
      console.error('Error deleting match by id: ', error);
      throw SwingError.parse(error);
    }
  }

  async joinMatch(userId: string, matchId: string) {
    try {
      await runTransaction(Database, async (transaction) => {
        const matchRef = doc(Database, 'Matches', matchId);

        const dbMatch = await transaction.get(matchRef);
        if (!dbMatch.exists())
          throw new SwingNotFoundError(
            'This match is no longer available. Please choose another match.',
          );

        const {
          userId: hostId,
          startsAt,
          members,
          playersNeeded,
        }: DBMatch = dbMatch.data() as DBMatch;

        // Reject host join
        if (hostId === userId) throw new SwingBadRequestError('You’re already hosting this match.');

        // Pre-checks
        if (startsAt <= Timestamp.now())
          throw new SwingBadRequestError(
            'This match has already started. Please choose another match.',
          );
        if (playersNeeded == 0)
          throw new SwingBadRequestError('This match is full. Please choose another match.');
        if (members.includes(userId))
          throw new SwingBadRequestError('You’ve already joined this match.');

        // Create membership and decrement open spot
        const userRef = doc(Database, 'Users', userId);

        transaction.update(matchRef, {
          members: arrayUnion(userId),
          playersNeeded: increment(-1),
        });
        transaction.update(userRef, {
          'profile.matchActivity.joined': increment(1),
        });
      });
    } catch (error) {
      console.error(`Error joining match ${matchId}: `, error);
      throw SwingError.parse(error);
    }
  }

  async leaveMatch(userId: string, matchId: string): Promise<void> {
    try {
      await runTransaction(Database, async (transaction) => {
        const matchRef = doc(Database, 'Matches', matchId);

        const dbMatch = await transaction.get(matchRef);
        if (!dbMatch.exists()) throw new SwingNotFoundError('This match is no longer available.');

        const {
          userId: hostId,
          startsAt,
          members,
          playersNeeded,
        }: DBMatch = dbMatch.data() as DBMatch;

        // Pre-checks
        if (startsAt <= Timestamp.now())
          throw new SwingBadRequestError('Cannot leave a match that has already started.');
        if (!members.includes(userId))
          throw new SwingBadRequestError('Cannot leave a match of which you are not a member.');

        // Create membership and decrement open spot
        const userRef = doc(Database, 'Users', userId);

        // Add a spot back to the match and remove membership
        transaction.update(matchRef, {
          members: arrayRemove(userId),
          playersNeeded: increment(1),
        });
        // Remove joined count from user
        transaction.update(userRef, {
          'profile.matchActivity.joined': increment(-1),
        });
      });
    } catch (error) {
      console.error(`Error leaving match ${matchId}: `, error);
      throw SwingError.parse(error);
    }
  }

  subscribeToDiscoverableMatchChanges(onChange: () => void, onError: (error: Error) => void) {
    return onSnapshot(
      discoverableMatchesQuery(),
      { includeMetadataChanges: true },
      (snapshot) => {
        // Wait for server confirmation rather than refreshing from a cached snapshot.
        if (!snapshot.metadata.fromCache) onChange();
      },
      onError,
    );
  }
}

export const matchService = new MatchService();

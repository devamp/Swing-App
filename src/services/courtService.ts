import { SwingError } from './errorService';
import { CourtLocation } from '../types';
import { Database } from './firebase';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

class CourtService {
  async loadCourts(): Promise<CourtLocation[]> {
    try {
      const snapshot = await getDocs(collection(Database, 'Courts'));
      console.log(`Loaded ${snapshot.docs.length} courts`);
      return snapshot.docs.map((court) => court.data() as CourtLocation);
    } catch (error) {
      console.error('Error loading courts: ', error);
      throw SwingError.parse(error);
    }
  }
}

export const courtService = new CourtService();

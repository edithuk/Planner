import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Trip } from '../types';

const TRIPS_DOC = 'trips';

export async function saveTripsToFirestore(userId: string, trips: Trip[]): Promise<void> {
  const docRef = doc(db, 'users', userId, TRIPS_DOC, 'data');
  await setDoc(docRef, {
    trips,
    updatedAt: new Date().toISOString(),
  });
}

export async function loadTripsFromFirestore(userId: string): Promise<Trip[]> {
  const docRef = doc(db, 'users', userId, TRIPS_DOC, 'data');
  const snapshot = await getDoc(docRef);
  const data = snapshot.data();
  if (data?.trips && Array.isArray(data.trips)) {
    return data.trips as Trip[];
  }
  return [];
}

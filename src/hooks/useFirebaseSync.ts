import { useEffect, useRef } from 'react';
import { auth } from '../lib/firebase';
import { loadTripsFromFirestore } from '../lib/firestore';
import { useTripStore } from '../store/tripStore';

export function useFirebaseSync() {
  const { setTrips } = useTripStore();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setTrips([]);
        isInitialLoad.current = true;
        return;
      }

      isInitialLoad.current = true;
      try {
        const trips = await loadTripsFromFirestore(user.uid);
        setTrips(trips);
      } catch (err) {
        console.error('Firestore load error:', err);
        setTrips([]);
      } finally {
        isInitialLoad.current = false;
      }
    });

    return unsubAuth;
  }, [setTrips]);
}

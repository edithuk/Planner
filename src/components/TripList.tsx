import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveTripsToFirestore } from '../lib/firestore';
import { useTripStore } from '../store/tripStore';
import type { Trip } from '../types';
import { TripCard } from './TripCard.tsx';
import { TripMap, type MapItemWithSection } from './TripMap.tsx';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function getAllMapItems(trip: Trip | undefined): MapItemWithSection[] {
  if (!trip) return [];
  const items: MapItemWithSection[] = [];
  trip.recommendedPlaces.forEach((item, i) =>
    items.push({ item, section: 'recommendedPlaces', index: i + 1 })
  );
  trip.wishlist.forEach((item, i) =>
    items.push({ item, section: 'wishlist', index: i + 1 })
  );
  trip.todo.forEach((item, i) =>
    items.push({ item, section: 'todo', index: i + 1 })
  );
  trip.days.forEach((day, dayIndex) => {
    day.items.forEach((item, i) =>
      items.push({ item, section: 'days', dayIndex, index: i + 1 })
    );
  });
  return items;
}

export function TripList() {
  const { trips, addTrip } = useTripStore();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(
    trips[0]?.id ?? null
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? trips[0];

  const handleAddTrip = () => {
    addTrip();
    const newTrips = useTripStore.getState().trips;
    const lastTrip = newTrips[newTrips.length - 1];
    if (lastTrip) setSelectedTripId(lastTrip.id);
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      setSaveError('Not logged in');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setSaveStatus('saving');
    setSaveError(null);
    try {
      const tripsData = useTripStore.getState().trips;
      await saveTripsToFirestore(user.uid, tripsData);
      setSaveStatus('saved');
      setSaveError(null);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
      setSaveError(`${message}${code ? ` (${code})` : ''}`);
      setSaveStatus('error');
      console.error('Save error:', err);
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveError(null);
      }, 5000);
    }
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Planner</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddTrip}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium text-sm text-white transition-all shadow-md hover:shadow-lg"
          >
            + Add Trip
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 disabled:cursor-not-allowed font-medium text-sm text-white transition-all shadow-md"
          >
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved!'}
            {saveStatus === 'error' && 'Error'}
            {saveStatus === 'idle' && 'Save'}
          </button>
          {saveError && (
            <span className="text-red-400 text-xs max-w-[200px] truncate" title={saveError}>
              {saveError}
            </span>
          )}
          <button
            onClick={() => signOut(auth)}
            className="px-4 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm transition-all"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-900 overflow-y-auto">
          <div className="p-3 space-y-1">
            {trips.length === 0 ? (
              <p className="p-3 text-zinc-500 text-sm">No trips yet</p>
            ) : (
              trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                    selectedTripId === trip.id
                      ? 'bg-blue-600/30 text-blue-300 font-medium shadow-sm border border-blue-500/50'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {trip.name}
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-zinc-900">
          {selectedTrip ? (
            <TripCard trip={selectedTrip} />
          ) : (
            <div className="flex items-center justify-center flex-1 text-zinc-500">
              Add a trip to get started
            </div>
          )}
        </main>

        <aside className="w-[400px] shrink-0 border-l border-zinc-800 bg-zinc-900 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-100">Map</h3>
            <p className="text-xs text-zinc-500 mt-0.5">All locations by section</p>
          </div>
          <div className="flex-1 min-h-0">
            <TripMap items={getAllMapItems(selectedTrip)} className="h-full" />
          </div>
        </aside>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveTripsToFirestore } from '../lib/firestore';
import { useTripStore } from '../store/tripStore';
import type { Trip } from '../types';
import { TripCard } from './TripCard.tsx';
import { TripMap, type MapItemWithSection } from './TripMap.tsx';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type MobileView = 'planner' | 'map';

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
  const [mobileView, setMobileView] = useState<MobileView>('planner');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="h-screen min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      <header className="flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 md:px-6 md:py-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="lg:hidden p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            aria-label="Toggle trips"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-base md:text-xl font-bold tracking-tight text-zinc-100 truncate">Planner</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 min-w-0">
          <button
            onClick={handleAddTrip}
            className="px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-lg md:rounded-xl bg-blue-600 hover:bg-blue-500 font-medium text-xs md:text-sm text-white transition-all shadow-md whitespace-nowrap"
          >
            + Add Trip
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-lg md:rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 disabled:cursor-not-allowed font-medium text-xs md:text-sm text-white transition-all shadow-md whitespace-nowrap"
          >
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved!'}
            {saveStatus === 'error' && 'Error'}
            {saveStatus === 'idle' && 'Save'}
          </button>
          {saveError && (
            <span className="hidden sm:inline text-red-400 text-xs max-w-[120px] md:max-w-[200px] truncate" title={saveError}>
              {saveError}
            </span>
          )}
          <button
            onClick={() => signOut(auth)}
            className="px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-lg md:rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs md:text-sm transition-all whitespace-nowrap"
          >
            Sign out
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <div className="flex-1 flex overflow-hidden relative min-h-0 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <aside
          className={`flex flex-col w-56 shrink-0 border-r border-zinc-800 bg-zinc-900 overflow-y-auto transition-transform duration-200 ease-out
            fixed left-0 top-0 bottom-0 z-50 pt-14 lg:pt-0
            lg:relative lg:left-auto lg:top-auto lg:bottom-auto lg:z-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          <div className="p-3 space-y-1">
            {trips.length === 0 ? (
              <p className="p-3 text-zinc-500 text-sm">No trips yet</p>
            ) : (
              trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => {
                    setSelectedTripId(trip.id);
                    setSidebarOpen(false);
                  }}
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

        <main
          className={`flex-1 flex flex-col overflow-hidden min-w-0 bg-zinc-900 ${mobileView === 'planner' ? 'flex' : 'hidden'} lg:flex`}
        >
          {selectedTrip ? (
            <TripCard trip={selectedTrip} />
          ) : (
            <div className="flex items-center justify-center flex-1 text-zinc-500 p-4">
              Add a trip to get started
            </div>
          )}
        </main>

        <aside
          className={`shrink-0 border-l border-zinc-800 bg-zinc-900 flex-col overflow-hidden flex
            w-full lg:w-[400px]
            ${mobileView === 'map' ? 'flex' : 'hidden'} lg:flex`}
        >
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-100">Map</h3>
            <p className="text-xs text-zinc-500 mt-0.5">All locations by section</p>
          </div>
          <div className="flex-1 min-h-[300px] lg:min-h-0">
            <TripMap items={getAllMapItems(selectedTrip)} className="h-full min-h-[280px]" />
          </div>
        </aside>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 flex border-t border-zinc-800 bg-zinc-900 z-30 safe-area-padding">
        <button
          onClick={() => setMobileView('planner')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors min-h-[48px] ${
            mobileView === 'planner' ? 'text-blue-400 border-b-2 border-blue-500 bg-zinc-800/50' : 'text-zinc-400'
          }`}
        >
          Planner
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors min-h-[48px] ${
            mobileView === 'map' ? 'text-blue-400 border-b-2 border-blue-500 bg-zinc-800/50' : 'text-zinc-400'
          }`}
        >
          Map
        </button>
      </div>
    </div>
  );
}

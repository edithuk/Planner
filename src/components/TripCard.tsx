import type { Trip } from '../types';
import { useTripStore } from '../store/tripStore';
import { DndTripSections } from './DndTripSections';

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-4 md:p-5">
      <div className="shrink-0 space-y-4 md:space-y-5">
        <input
          type="text"
          value={trip.name}
          onChange={(e) =>
            useTripStore.getState().updateTrip(trip.id, { name: e.target.value })
          }
          className="text-xl md:text-2xl font-bold bg-transparent border-b-2 border-zinc-600 text-zinc-100 focus:border-blue-500 outline-none px-2 py-1.5 transition-colors placeholder-zinc-500 w-full"
        />
      </div>
      <DndTripSections trip={trip} />
    </div>
  );
}

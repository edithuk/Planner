import type { Trip } from '../types';
import { useTripStore } from '../store/tripStore';
import { SectionColumn } from './SectionColumn.tsx';
import { AddDaySection } from './AddDaySection.tsx';

interface TripSectionsProps {
  trip: Trip;
}

export function TripSections({ trip }: TripSectionsProps) {
  const { updateDaySection, removeDaySection } = useTripStore();

  return (
    <div className="flex flex-col flex-1 min-h-0 mt-5">
      {/* Single scroll container: Recommended, Wishlist, To Do + Day Plan */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 md:space-y-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <SectionColumn
            tripId={trip.id}
            title="Recommended Places"
            items={trip.recommendedPlaces}
            section="recommendedPlaces"
            showRecommendedFor
            fixedSectionStyle="bg-zinc-800 border-l-4 border-l-rose-500 border border-zinc-600"
          />
        <SectionColumn
          tripId={trip.id}
          title="Wishlist"
          items={trip.wishlist}
          section="wishlist"
          showRecommendedFor
          fixedSectionStyle="bg-zinc-800 border-l-4 border-l-amber-500 border border-zinc-600"
        />
        <SectionColumn
          tripId={trip.id}
          title="To Do"
          items={trip.todo}
          section="todo"
          showRecommendedFor
          fixedSectionStyle="bg-zinc-800 border-l-4 border-l-emerald-500 border border-zinc-600"
        />
        </div>

        {trip.days.length > 0 && (
          <div className="space-y-4 w-full max-w-full">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider sticky top-0 bg-zinc-900 py-2 z-10">
              Day Plan
            </h3>
            <div className="grid grid-cols-1 gap-4 w-full">
              {trip.days.map((day, index) => (
                <SectionColumn
                  key={day.id}
                  tripId={trip.id}
                  title={day.name}
                  items={day.items}
                  section="days"
                  dayId={day.id}
                  dayIndex={index}
                  onRenameDay={(name: string) => updateDaySection(trip.id, day.id, name)}
                  onRemoveDay={() => removeDaySection(trip.id, day.id)}
                />
              ))}
            </div>
          </div>
        )}
        <AddDaySection tripId={trip.id} />
      </div>
    </div>
  );
}

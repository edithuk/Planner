import { useDroppable } from '@dnd-kit/core';
import type { PlaceItem } from '../types';
import { useTripStore } from '../store/tripStore';
import { PlaceCard } from './PlaceCard';
import { PlaceAutocompleteInput } from './PlaceAutocompleteInput';
import { DaySectionHeader } from './DaySectionHeader';

type SectionKey = 'wishlist' | 'todo' | 'recommendedPlaces' | 'days';

// Day sections use distinct colors (no rose, amber, emerald - reserved for Recommended, Wishlist, To Do)
const DAY_COLORS = [
  'bg-zinc-800 border-l-4 border-l-violet-500 border border-zinc-600',     // Day 1
  'bg-zinc-800 border-l-4 border-l-sky-500 border border-zinc-600',       // Day 2
  'bg-zinc-800 border-l-4 border-l-cyan-500 border border-zinc-600',       // Day 3
  'bg-zinc-800 border-l-4 border-l-orange-500 border border-zinc-600',    // Day 4
  'bg-zinc-800 border-l-4 border-l-fuchsia-500 border border-zinc-600',    // Day 5
  'bg-zinc-800 border-l-4 border-l-indigo-500 border border-zinc-600',    // Day 6
  'bg-zinc-800 border-l-4 border-l-teal-500 border border-zinc-600',       // Day 7
  'bg-zinc-800 border-l-4 border-l-pink-500 border border-zinc-600',      // Day 8
  'bg-zinc-800 border-l-4 border-l-lime-500 border border-zinc-600',      // Day 9
  'bg-zinc-800 border-l-4 border-l-blue-500 border border-zinc-600',      // Day 10
];

const SECTION_TITLE_COLORS: Record<string, string> = {
  recommendedPlaces: 'text-rose-400',
  wishlist: 'text-amber-400',
  todo: 'text-emerald-400',
};

const DAY_TITLE_COLORS = [
  'text-violet-400', 'text-sky-400', 'text-cyan-400', 'text-orange-400',
  'text-fuchsia-400', 'text-indigo-400', 'text-teal-400', 'text-pink-400',
  'text-lime-400', 'text-blue-400',
];

interface SectionColumnProps {
  tripId: string;
  title: string;
  items: PlaceItem[];
  section: SectionKey;
  dayId?: string;
  dayIndex?: number;
  showRecommendedFor?: boolean;
  fixedSectionStyle?: string;
  onRenameDay?: (name: string) => void;
  onRemoveDay?: () => void;
}

export function SectionColumn({
  tripId,
  title,
  items,
  section,
  dayId,
  dayIndex,
  showRecommendedFor,
  fixedSectionStyle,
  onRenameDay,
  onRemoveDay,
}: SectionColumnProps) {
  const { addItemToSection, addItemToDay } = useTripStore();

  const dropId = `drop-${tripId}-${section}-${dayId ?? 'x'}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { tripId, section, dayId },
  });

  const handleAddPlace = (item: Omit<PlaceItem, 'id'>) => {
    if (section === 'days' && dayId) {
      addItemToDay(tripId, dayId, item);
    } else if (section !== 'days') {
      addItemToSection(tripId, section, item);
    }
  };

  const baseStyles = section === 'days' && dayIndex !== undefined
    ? DAY_COLORS[dayIndex % DAY_COLORS.length]
    : fixedSectionStyle ?? 'bg-zinc-800 border-l-4 border-l-zinc-500 border border-zinc-600';

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border p-4 min-h-[200px] transition-all shadow-lg ${baseStyles} ${
        isOver ? '!border-blue-500 ring-2 ring-blue-400/50' : ''
      }`}
    >
      {onRenameDay && onRemoveDay ? (
        <DaySectionHeader
          title={title}
          onRename={onRenameDay}
          onRemove={onRemoveDay}
          titleColor={dayIndex !== undefined ? DAY_TITLE_COLORS[dayIndex % DAY_TITLE_COLORS.length] : undefined}
        />
      ) : (
        <h3 className={`font-semibold mb-3 ${SECTION_TITLE_COLORS[section] ?? 'text-zinc-200'}`}>{title}</h3>
      )}
      <div className="space-y-2">
        {items.map((item, index) => (
          <PlaceCard
            key={item.id}
            item={item}
            index={index + 1}
            tripId={tripId}
            section={section}
            dayId={dayId}
            showRecommendedFor={showRecommendedFor}
          />
        ))}
      </div>
      <div className="mt-3">
        <PlaceAutocompleteInput
          onSelect={handleAddPlace}
          placeholder={`Add to ${title}...`}
          section={section}
        />
      </div>
    </div>
  );
}

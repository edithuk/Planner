import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PlaceItem } from '../types';
import { useTripStore } from '../store/tripStore';

type SectionKey = 'wishlist' | 'todo' | 'recommendedPlaces' | 'days';

interface PlaceCardProps {
  item: PlaceItem;
  index: number;
  tripId: string;
  section: SectionKey;
  dayId?: string;
  showRecommendedFor?: boolean;
}

export function PlaceCard({
  item,
  index,
  tripId,
  section,
  dayId,
  showRecommendedFor,
}: PlaceCardProps) {
  const [editingRecommendedFor, setEditingRecommendedFor] = useState(false);
  const [recommendedForValue, setRecommendedForValue] = useState(
    item.recommendedFor ?? ''
  );
  const { updateItem, removeItem } = useTripStore();

  const dragId = `item-${tripId}-${item.id}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dragId,
    data: { tripId, section, dayId, itemId: item.id },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const showInstructions = section === 'days' || section === 'wishlist' || section === 'todo';

  const handleBlurRecommendedFor = () => {
    setEditingRecommendedFor(false);
    if (recommendedForValue !== (item.recommendedFor ?? '')) {
      updateItem(tripId, item.id, { recommendedFor: recommendedForValue || undefined }, section, dayId);
    }
  };

  const handleInstructionsChange = (value: string) => {
    updateItem(tripId, item.id, { instructions: value || undefined }, section, dayId);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group rounded-lg bg-zinc-800 border-2 p-3 transition cursor-grab active:cursor-grabbing shadow-md ${
        isDragging ? 'opacity-0' : 'border-zinc-600 hover:border-zinc-500 hover:shadow-lg'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 flex items-start gap-2">
          <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-600 text-zinc-300 text-xs font-semibold">
            {index}
          </span>
          <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-200 truncate">{item.name}</p>
          {showRecommendedFor && (
            <div className="mt-1">
              {editingRecommendedFor ? (
                <input
                  type="text"
                  value={recommendedForValue}
                  onChange={(e) => setRecommendedForValue(e.target.value)}
                  onBlur={handleBlurRecommendedFor}
                  onKeyDown={(e) => e.key === 'Enter' && handleBlurRecommendedFor()}
                  placeholder="Recommended for..."
                  className="w-full text-sm bg-zinc-700 rounded px-2 py-1 text-zinc-200 placeholder-zinc-500 border border-zinc-600"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setEditingRecommendedFor(true)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  {item.recommendedFor ? `For: ${item.recommendedFor}` : '+ Add recommended for'}
                </button>
              )}
            </div>
          )}
          {showInstructions && (
            <div
              className="mt-3"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <label className="text-xs text-zinc-500 block mb-0.5">Instructions</label>
              <textarea
                value={item.instructions ?? ''}
                onChange={(e) => handleInstructionsChange(e.target.value)}
                placeholder="Add instructions..."
                rows={2}
                className="w-full text-sm bg-zinc-700 rounded px-2 py-1.5 text-zinc-200 placeholder-zinc-500 border border-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          </div>
        </div>
        <button
          onClick={() => removeItem(tripId, item.id, section, dayId)}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-zinc-500 hover:text-red-400 text-sm p-1 min-w-[32px] min-h-[32px] flex items-center justify-center touch-manipulation transition"
          aria-label="Remove"
        >
          ×
        </button>
      </div>
    </div>
  );
}

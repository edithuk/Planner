import type { PlaceItem } from '../types';

interface PlaceCardOverlayProps {
  item: PlaceItem;
  index: number;
  showRecommendedFor?: boolean;
}

export default function PlaceCardOverlay({
  item,
  index,
  showRecommendedFor,
}: PlaceCardOverlayProps) {
  return (
    <div className="rounded-lg bg-zinc-800 border-2 border-blue-400 p-3 shadow-xl cursor-grabbing rotate-2 opacity-95 w-[min(280px,85vw)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 flex items-start gap-2">
          <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-600 text-zinc-300 text-xs font-semibold">
            {index}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-zinc-200 truncate">{item.name}</p>
            {showRecommendedFor && item.recommendedFor && (
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                For: {item.recommendedFor}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

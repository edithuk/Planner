import { useState } from 'react';
import { useTripStore } from '../store/tripStore';

interface AddDaySectionProps {
  tripId: string;
}

export function AddDaySection({ tripId }: AddDaySectionProps) {
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { addDaySection } = useTripStore();

  const handleAdd = () => {
    if (isAdding && name.trim()) {
      addDaySection(tripId, name.trim());
      setName('');
      setIsAdding(false);
    } else if (!isAdding) {
      setIsAdding(true);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setName('');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
      {isAdding ? (
        <>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Day name (e.g. Day 1, Beach Day)"
            className="px-3 py-2.5 rounded-lg bg-zinc-700 border border-zinc-600 text-zinc-200 placeholder-zinc-500 w-full min-w-0 sm:w-48 sm:flex-1 text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium min-h-[44px] touch-manipulation"
            >
              Add
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-zinc-600 hover:bg-zinc-500 text-zinc-200 text-sm min-h-[44px] touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto px-4 py-3.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 text-sm font-medium border-2 border-dashed border-emerald-500/50 hover:border-emerald-500 transition-all min-h-[48px] touch-manipulation active:scale-[0.98]"
        >
          + Add Day Section
        </button>
      )}
    </div>
  );
}

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
    <div className="flex items-center gap-2">
      {isAdding ? (
        <>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Day name (e.g. Day 1, Beach Day)"
            className="px-3 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-zinc-200 placeholder-zinc-500 w-48"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
          >
            Add
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg bg-zinc-600 hover:bg-zinc-500 text-zinc-200 text-sm"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 text-sm font-medium border-2 border-dashed border-emerald-500/50 hover:border-emerald-500 transition-all"
        >
          + Add Day Section
        </button>
      )}
    </div>
  );
}

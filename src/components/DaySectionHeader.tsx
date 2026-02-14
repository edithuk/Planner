import { useState } from 'react';

interface DaySectionHeaderProps {
  title: string;
  onRename: (name: string) => void;
  onRemove: () => void;
  titleColor?: string;
}

export function DaySectionHeader({ title, onRename, onRemove, titleColor }: DaySectionHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  const handleSave = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) {
      onRename(trimmed);
    } else {
      setValue(title);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setEditing(false);
              setValue(title);
            }
          }}
          className="flex-1 font-semibold text-zinc-200 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={`font-semibold text-left flex-1 truncate hover:opacity-90 ${titleColor ?? 'text-zinc-200 hover:text-zinc-400'}`}
        >
          {title}
        </button>
      )}
      <button
        onClick={onRemove}
        className="text-zinc-500 hover:text-red-400 text-sm px-1"
        aria-label="Remove day"
      >
        ×
      </button>
    </div>
  );
}

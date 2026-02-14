// Section colors for map pins and cards - kept in sync
export const SECTION_PIN_COLORS = {
  recommendedPlaces: '#e11d48', // rose
  wishlist: '#d97706',          // amber
  todo: '#059669',             // emerald
} as const;

// Day pins use distinct colors (no rose, amber, emerald - reserved for fixed sections)
export const DAY_PIN_COLORS = [
  '#7c3aed', // Day 1 - violet
  '#0ea5e9', // Day 2 - sky
  '#06b6d4', // Day 3 - cyan
  '#ea580c', // Day 4 - orange
  '#c026d3', // Day 5 - fuchsia
  '#4f46e5', // Day 6 - indigo
  '#0d9488', // Day 7 - teal
  '#ec4899', // Day 8 - pink
  '#84cc16', // Day 9 - lime
  '#3b82f6', // Day 10 - blue
];

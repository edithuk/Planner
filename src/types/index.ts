export interface PlaceItem {
  id: string;
  name: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  recommendedFor?: string;
  /** Instructions or notes - used in wishlist, todo, and day sections */
  instructions?: string;
}

export interface DaySection {
  id: string;
  name: string;
  items: PlaceItem[];
}

export interface Trip {
  id: string;
  name: string;
  wishlist: PlaceItem[];
  todo: PlaceItem[];
  days: DaySection[];
  recommendedPlaces: PlaceItem[];
}

export interface AppState {
  trips: Trip[];
}

export type SectionType = 'wishlist' | 'todo' | 'days' | 'recommendedPlaces';

import { create } from 'zustand';
import type { Trip, PlaceItem, DaySection } from '../types';

function generateId() {
  return crypto.randomUUID();
}

interface TripStore {
  trips: Trip[];
  setTrips: (trips: Trip[]) => void;
  addTrip: () => void;
  updateTrip: (id: string, updates: Partial<Omit<Trip, 'id'>>) => void;
  deleteTrip: (id: string) => void;
  addItemToSection: (
    tripId: string,
    section: 'wishlist' | 'todo' | 'recommendedPlaces',
    item: Omit<PlaceItem, 'id'>
  ) => void;
  addItemToDay: (tripId: string, dayId: string, item: Omit<PlaceItem, 'id'>) => void;
  moveItem: (
    tripId: string,
    itemId: string,
    fromSection: 'wishlist' | 'todo' | 'recommendedPlaces' | 'days',
    fromDayId?: string,
    toSection?: 'wishlist' | 'todo' | 'recommendedPlaces' | 'days',
    toDayId?: string,
    toIndex?: number
  ) => void;
  removeItem: (
    tripId: string,
    itemId: string,
    section: 'wishlist' | 'todo' | 'recommendedPlaces' | 'days',
    dayId?: string
  ) => void;
  updateItem: (
    tripId: string,
    itemId: string,
    updates: Partial<PlaceItem>,
    section: 'wishlist' | 'todo' | 'recommendedPlaces' | 'days',
    dayId?: string
  ) => void;
  addDaySection: (tripId: string, name?: string) => void;
  updateDaySection: (tripId: string, dayId: string, name: string) => void;
  removeDaySection: (tripId: string, dayId: string) => void;
}

function getEmptyTrip(): Trip {
  return {
    id: generateId(),
    name: 'New Trip',
    wishlist: [],
    todo: [],
    days: [],
    recommendedPlaces: [],
  };
}

function findItemInTrip(
  trip: Trip,
  itemId: string
): { section: 'wishlist' | 'todo' | 'recommendedPlaces' | 'days'; index: number; dayId?: string } | null {
  const sections: Array<{ key: 'wishlist' | 'todo' | 'recommendedPlaces'; items: PlaceItem[] }> = [
    { key: 'wishlist', items: trip.wishlist },
    { key: 'todo', items: trip.todo },
    { key: 'recommendedPlaces', items: trip.recommendedPlaces },
  ];
  for (const { key, items } of sections) {
    const index = items.findIndex((i) => i.id === itemId);
    if (index >= 0) return { section: key, index };
  }
  for (const day of trip.days) {
    const index = day.items.findIndex((i) => i.id === itemId);
    if (index >= 0) return { section: 'days', index, dayId: day.id };
  }
  return null;
}

export const useTripStore = create<TripStore>((set) => ({
  trips: [],

  setTrips: (trips) => set({ trips }),

  addTrip: () =>
    set((state) => ({
      trips: [...state.trips, getEmptyTrip()],
    })),

  updateTrip: (id, updates) =>
    set((state) => ({
      trips: state.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTrip: (id) =>
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
    })),

  addItemToSection: (tripId, section, item) =>
    set((state) => {
      const newItem: PlaceItem = { ...item, id: generateId() };
      return {
        trips: state.trips.map((t) => {
          if (t.id !== tripId) return t;
          const updated = { ...t };
          if (section === 'wishlist') updated.wishlist = [...t.wishlist, newItem];
          else if (section === 'todo') updated.todo = [...t.todo, newItem];
          else if (section === 'recommendedPlaces')
            updated.recommendedPlaces = [...t.recommendedPlaces, newItem];
          return updated;
        }),
      };
    }),

  addItemToDay: (tripId, dayId, item) =>
    set((state) => {
      const newItem: PlaceItem = { ...item, id: generateId() };
      return {
        trips: state.trips.map((t) => {
          if (t.id !== tripId) return t;
          return {
            ...t,
            days: t.days.map((d) =>
              d.id === dayId ? { ...d, items: [...d.items, newItem] } : d
            ),
          };
        }),
      };
    }),

  moveItem: (tripId, itemId, fromSection, fromDayId, toSection, toDayId, toIndex) =>
    set((state) => {
      const trip = state.trips.find((t) => t.id === tripId);
      if (!trip) return state;

      const fromLoc = findItemInTrip(trip, itemId);
      if (!fromLoc) return state;

      let item: PlaceItem | undefined;
      const removeFrom = (t: Trip): Trip => {
        if (fromSection === 'days' && fromDayId) {
          const day = t.days.find((d) => d.id === fromDayId);
          if (!day) return t;
          const idx = day.items.findIndex((i) => i.id === itemId);
          if (idx < 0) return t;
          item = day.items[idx];
          return {
            ...t,
            days: t.days.map((d) =>
              d.id === fromDayId
                ? { ...d, items: d.items.filter((i) => i.id !== itemId) }
                : d
            ),
          };
        }
        if (fromSection === 'wishlist') {
          const idx = t.wishlist.findIndex((i) => i.id === itemId);
          if (idx < 0) return t;
          item = t.wishlist[idx];
          return { ...t, wishlist: t.wishlist.filter((i) => i.id !== itemId) };
        }
        if (fromSection === 'todo') {
          const idx = t.todo.findIndex((i) => i.id === itemId);
          if (idx < 0) return t;
          item = t.todo[idx];
          return { ...t, todo: t.todo.filter((i) => i.id !== itemId) };
        }
        if (fromSection === 'recommendedPlaces') {
          const idx = t.recommendedPlaces.findIndex((i) => i.id === itemId);
          if (idx < 0) return t;
          item = t.recommendedPlaces[idx];
          return {
            ...t,
            recommendedPlaces: t.recommendedPlaces.filter((i) => i.id !== itemId),
          };
        }
        return t;
      };

      const addTo = (t: Trip, i: PlaceItem): Trip => {
        if (!toSection) return t;
        if (toSection === 'days' && toDayId) {
          const day = t.days.find((d) => d.id === toDayId);
          if (!day) return t;
          const newItems = [...day.items];
          const idx = toIndex ?? newItems.length;
          newItems.splice(idx, 0, i);
          return {
            ...t,
            days: t.days.map((d) =>
              d.id === toDayId ? { ...d, items: newItems } : d
            ),
          };
        }
        if (toSection === 'wishlist') {
          const newItems = [...t.wishlist];
          const idx = toIndex ?? newItems.length;
          newItems.splice(idx, 0, i);
          return { ...t, wishlist: newItems };
        }
        if (toSection === 'todo') {
          const newItems = [...t.todo];
          const idx = toIndex ?? newItems.length;
          newItems.splice(idx, 0, i);
          return { ...t, todo: newItems };
        }
        if (toSection === 'recommendedPlaces') {
          const newItems = [...t.recommendedPlaces];
          const idx = toIndex ?? newItems.length;
          newItems.splice(idx, 0, i);
          return { ...t, recommendedPlaces: newItems };
        }
        return t;
      };

      let updatedTrip = removeFrom(trip);
      if (item) updatedTrip = addTo(updatedTrip, item);

      return {
        trips: state.trips.map((t) => (t.id === tripId ? updatedTrip : t)),
      };
    }),

  removeItem: (tripId, itemId, section, dayId) =>
    set((state) => ({
      trips: state.trips.map((t) => {
        if (t.id !== tripId) return t;
        if (section === 'days' && dayId) {
          return {
            ...t,
            days: t.days.map((d) =>
              d.id === dayId ? { ...d, items: d.items.filter((i) => i.id !== itemId) } : d
            ),
          };
        }
        if (section === 'wishlist') return { ...t, wishlist: t.wishlist.filter((i) => i.id !== itemId) };
        if (section === 'todo') return { ...t, todo: t.todo.filter((i) => i.id !== itemId) };
        if (section === 'recommendedPlaces')
          return { ...t, recommendedPlaces: t.recommendedPlaces.filter((i) => i.id !== itemId) };
        return t;
      }),
    })),

  updateItem: (tripId, itemId, updates, section, dayId) =>
    set((state) => ({
      trips: state.trips.map((t) => {
        if (t.id !== tripId) return t;
        const updateIn = (items: PlaceItem[]) =>
          items.map((i) => (i.id === itemId ? { ...i, ...updates } : i));
        if (section === 'days' && dayId) {
          return {
            ...t,
            days: t.days.map((d) =>
              d.id === dayId ? { ...d, items: updateIn(d.items) } : d
            ),
          };
        }
        if (section === 'wishlist') return { ...t, wishlist: updateIn(t.wishlist) };
        if (section === 'todo') return { ...t, todo: updateIn(t.todo) };
        if (section === 'recommendedPlaces')
          return { ...t, recommendedPlaces: updateIn(t.recommendedPlaces) };
        return t;
      }),
    })),

  addDaySection: (tripId, name) =>
    set((state) => {
      const trip = state.trips.find((t) => t.id === tripId);
      if (!trip) return state;
      const dayNum = trip.days.length + 1;
      const newDay: DaySection = {
        id: generateId(),
        name: name ?? `Day ${dayNum}`,
        items: [],
      };
      return {
        trips: state.trips.map((t) =>
          t.id === tripId ? { ...t, days: [...t.days, newDay] } : t
        ),
      };
    }),

  updateDaySection: (tripId, dayId, name) =>
    set((state) => ({
      trips: state.trips.map((t) =>
        t.id === tripId
          ? { ...t, days: t.days.map((d) => (d.id === dayId ? { ...d, name } : d)) }
          : t
      ),
    })),

  removeDaySection: (tripId, dayId) =>
    set((state) => ({
      trips: state.trips.map((t) =>
        t.id === tripId ? { ...t, days: t.days.filter((d) => d.id !== dayId) } : t
      ),
    })),
}));

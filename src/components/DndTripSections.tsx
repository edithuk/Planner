import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { PlaceItem, Trip } from '../types';
import { useTripStore } from '../store/tripStore';
import { TripSections } from './TripSections';
import { PlaceCardOverlay } from './PlaceCardOverlay';

interface DndTripSectionsProps {
  trip: Trip;
}

function findItem(
  trip: Trip,
  section: string,
  dayId: string | undefined,
  itemId: string
): PlaceItem | undefined {
  if (section === 'days' && dayId) {
    const day = trip.days.find((d) => d.id === dayId);
    return day?.items.find((i) => i.id === itemId);
  }
  if (section === 'wishlist') return trip.wishlist.find((i) => i.id === itemId);
  if (section === 'todo') return trip.todo.find((i) => i.id === itemId);
  if (section === 'recommendedPlaces') return trip.recommendedPlaces.find((i) => i.id === itemId);
  return undefined;
}

export function DndTripSections({ trip }: DndTripSectionsProps) {
  const { moveItem, reorderItem } = useTripStore();
  const [activeDrag, setActiveDrag] = useState<{
    item: PlaceItem;
    index: number;
    section: string;
    dayId?: string;
    showRecommendedFor?: boolean;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as {
      tripId: string;
      section: string;
      dayId?: string;
      itemId: string;
    } | undefined;
    if (!data) return;
    const item = findItem(trip, data.section, data.dayId, data.itemId);
    if (!item) return;
    const items =
      data.section === 'days' && data.dayId
        ? trip.days.find((d) => d.id === data.dayId)?.items ?? []
        : data.section === 'wishlist'
          ? trip.wishlist
          : data.section === 'todo'
            ? trip.todo
            : trip.recommendedPlaces;
    const index = items.findIndex((i) => i.id === item.id) + 1;
    setActiveDrag({
      item,
      index,
      section: data.section,
      dayId: data.dayId,
      showRecommendedFor:
        data.section === 'recommendedPlaces' ||
        data.section === 'wishlist' ||
        data.section === 'todo',
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as {
      tripId: string;
      section: string;
      dayId?: string;
      itemId: string;
    } | undefined;
    const overData = over.data.current as {
      tripId: string;
      section: string;
      dayId?: string;
    } | undefined;

    if (!activeData || !overData || activeData.tripId !== overData.tripId) return;

    const sameSection =
      activeData.section === overData.section &&
      (activeData.dayId ?? 'x') === (overData.dayId ?? 'x');

    if (sameSection) {
      // Reorder within same section when dropping on another item
      const overId = String(over.id);
      if (overId.startsWith('item-')) {
        const section = activeData.section as 'wishlist' | 'todo' | 'recommendedPlaces' | 'days';
        const dayId = activeData.dayId;
        const items =
          section === 'days' && dayId
            ? trip.days.find((d) => d.id === dayId)?.items ?? []
            : section === 'wishlist'
              ? trip.wishlist
              : section === 'todo'
                ? trip.todo
                : trip.recommendedPlaces;
        const overItemIndex = items.findIndex(
          (i) => `item-${trip.id}-${i.id}` === overId
        );
        if (overItemIndex >= 0) {
          const fromIndex = items.findIndex((i) => i.id === activeData.itemId);
          const toIndex =
            fromIndex < overItemIndex ? overItemIndex - 1 : overItemIndex;
          if (fromIndex !== toIndex) {
            reorderItem(trip.id, activeData.itemId, section, dayId, toIndex);
          }
        }
      }
      return;
    }

    const fromSection = activeData.section as 'wishlist' | 'todo' | 'recommendedPlaces' | 'days';
    const toSection = overData.section as 'wishlist' | 'todo' | 'recommendedPlaces' | 'days';
    const toDayId = overData.dayId;
    const fromDayId = activeData.dayId;

    moveItem(
      activeData.tripId,
      activeData.itemId,
      fromSection,
      fromDayId,
      toSection,
      toDayId
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <TripSections trip={trip} />
      <DragOverlay>
        {activeDrag ? (
          <PlaceCardOverlay
            item={activeDrag.item}
            index={activeDrag.index}
            showRecommendedFor={activeDrag.showRecommendedFor}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

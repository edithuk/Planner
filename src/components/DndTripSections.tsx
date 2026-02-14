import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Trip } from '../types';
import { useTripStore } from '../store/tripStore';
import { TripSections } from './TripSections';

interface DndTripSectionsProps {
  trip: Trip;
}

export function DndTripSections({ trip }: DndTripSectionsProps) {
  const { moveItem } = useTripStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
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
    // Don't move if dropping on same section
    if (
      activeData.section === overData.section &&
      (activeData.dayId ?? 'x') === (overData.dayId ?? 'x')
    )
      return;

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
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <TripSections trip={trip} />
    </DndContext>
  );
}

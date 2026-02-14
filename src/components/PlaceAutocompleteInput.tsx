/// <reference types="google.maps" />
import { useEffect, useRef } from 'react';
import type { PlaceItem } from '../types';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

type SectionKey = 'wishlist' | 'todo' | 'recommendedPlaces' | 'days';

interface PlaceAutocompleteInputProps {
  onSelect: (item: Omit<PlaceItem, 'id'>) => void;
  placeholder?: string;
  section: SectionKey;
}

export function PlaceAutocompleteInput({
  onSelect,
  placeholder = 'Search for a place...',
}: PlaceAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { loaded } = useGoogleMaps();

  useEffect(() => {
    if (!loaded || !inputRef.current || !window.google?.maps?.places) return;

    const autocomplete = new google.maps.places.Autocomplete(
      inputRef.current,
      { types: ['establishment', 'geocode'] }
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;

      const lat = loc.lat();
      const lng = loc.lng();
      const name = place.name || place.formatted_address || 'Unknown place';

      onSelect({
        name,
        placeId: place.place_id,
        lat,
        lng,
      });

      if (inputRef.current) inputRef.current.value = '';
    });

    autocompleteRef.current = autocomplete;
    return () => {
      if (autocompleteRef.current && google?.maps?.event) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [loaded, onSelect]);

  if (!loaded) {
    return (
      <input
        type="text"
        placeholder="Loading places..."
        disabled
        className="w-full py-2 px-3 rounded-lg bg-zinc-700 text-zinc-400 text-sm border border-zinc-600"
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className="w-full py-2 px-3 rounded-lg bg-zinc-700 border border-zinc-600 text-zinc-200 placeholder-zinc-500 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
    />
  );
}

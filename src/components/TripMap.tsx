/// <reference types="google.maps" />
import { useEffect, useRef } from 'react';
import type { PlaceItem } from '../types';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { SECTION_PIN_COLORS, DAY_PIN_COLORS } from '../lib/sectionColors.ts';

export interface MapItemWithSection {
  item: PlaceItem;
  section: 'wishlist' | 'todo' | 'recommendedPlaces' | 'days';
  dayIndex?: number;
  index?: number;
}

interface TripMapProps {
  items: MapItemWithSection[];
  className?: string;
}

const DEFAULT_CENTER = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;

function getPinColor(section: MapItemWithSection['section'], dayIndex?: number): string {
  if (section === 'days' && dayIndex !== undefined) {
    return DAY_PIN_COLORS[dayIndex % DAY_PIN_COLORS.length];
  }
  return SECTION_PIN_COLORS[section as keyof typeof SECTION_PIN_COLORS];
}

export function TripMap({ items, className = '' }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const { loaded } = useGoogleMaps();

  useEffect(() => {
    if (!loaded || !mapRef.current || !window.google?.maps) return;

    const map = new google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [loaded]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !loaded) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const itemsWithCoords = items.filter((i) => i.item.lat != null && i.item.lng != null);
    if (itemsWithCoords.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    itemsWithCoords.forEach(({ item, section, dayIndex, index }) => {
      const pos = { lat: item.lat!, lng: item.lng! };
      const fillColor = getPinColor(section, dayIndex);
      const numLabel = index != null ? `${index}. ` : '';
      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: `${numLabel}${item.name}`,
        label: index != null ? { text: String(index), color: '#ffffff' } : undefined,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      markersRef.current.push(marker);
      bounds.extend(pos);
    });

    if (itemsWithCoords.length === 1) {
      const first = itemsWithCoords[0];
      map.setCenter({ lat: first.item.lat!, lng: first.item.lng! });
      map.setZoom(14);
    } else {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [items, loaded]);

  if (!loaded) {
    return (
        <div className={`min-h-[200px] rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 ${className}`}>
        Loading map...
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`w-full min-h-[200px] rounded-xl overflow-hidden border border-zinc-700 ${className}`}
    />
  );
}

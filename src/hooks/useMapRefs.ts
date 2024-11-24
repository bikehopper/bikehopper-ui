import { useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

export type MapRefs = ReturnType<typeof useMapRefs>;

export default function useMapRefs() {
  const mapRef = useRef<MapRef>(null);
  const mapOverlayRef = useRef<HTMLDivElement | null>(null);
  const mapControlBottomLeftRef = useRef<HTMLElement | null>(null);
  const mapControlBottomRightRef = useRef<HTMLElement | null>(null);
  const mapControlTopLeftRef = useRef<HTMLElement | null>(null);
  const mapControlTopRightRef = useRef<HTMLElement | null>(null);

  const handleMapLoad = () => {
    console.log('map load');
    mapControlBottomLeftRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-bottom-left',
    )[0] as HTMLElement;
    mapControlBottomRightRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-bottom-right',
    )[0] as HTMLElement;
    mapControlTopLeftRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-top-left',
    )[0] as HTMLElement;
    mapControlTopRightRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-top-right',
    )[0] as HTMLElement;
  };

  return {
    mapRef,
    mapOverlayRef,
    mapControlBottomLeftRef,
    mapControlBottomRightRef,
    mapControlTopLeftRef,
    mapControlTopRightRef,
    handleMapLoad,
  };
}

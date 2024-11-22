import { useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

export type MapRefs = ReturnType<typeof useMapRefs>;

export default function useMapRefs() {
  const mapRef = useRef<MapRef>(null);
  const mapOverlayRef = useRef<HTMLElement | null>(null);
  const mapControlBottomLeftRef = useRef<Element>();
  const mapControlBottomRightRef = useRef<Element>();
  const mapControlTopLeftRef = useRef<Element>();
  const mapControlTopRightRef = useRef<Element>();

  const handleMapLoad = () => {
    console.log('map load');
    mapControlBottomLeftRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-bottom-left',
    )[0];
    mapControlBottomRightRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-bottom-right',
    )[0];
    mapControlTopLeftRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-top-left',
    )[0];
    mapControlTopRightRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-top-right',
    )[0];
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

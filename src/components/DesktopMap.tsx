import { useRef } from 'react';
import BikeHopperMap from './BikeHopperMap';
import type { MapRef } from 'react-map-gl/maplibre';

type Props = {
  sidebar?: JSX.Element;
};

import './DesktopMap.css';

export default function DesktopMap({ sidebar }: Props) {
  const mapRef = useRef<MapRef>(null);
  const mapOverlayRef = useRef(null);
  const hideMap = false;

  return (
    <div className="DesktopMap">
      <div className="DesktopMap_sidebar">{sidebar}</div>
      <div className="DesktopMap_map">
        <BikeHopperMap
          ref={mapRef}
          overlayRef={mapOverlayRef}
          hidden={hideMap}
        />
      </div>
    </div>
  );
}

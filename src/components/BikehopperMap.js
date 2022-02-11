import * as React from 'react';
import { useEffect } from 'react';
import * as turf from '@turf/helpers';
import MapGL, { Layer, Marker, Source } from 'react-map-gl';
import MarkerSVG from './MarkerSVG';

import 'maplibre-gl/dist/maplibre-gl.css';

function BikehopperMap(props) {
  // the callbacks contain event.lngLat for the point, which can replace startPoint/endPoint
  const { startPoint, endPoint, routeCoords, bbox, onStartPointDrag, onEndPointDrag } = props;
  const mapRef = React.useRef();

  const initialViewState = {
    // hardcode San Francisco view for now
    latitude: 37.75117670681911,
    longitude: -122.44574920654225,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  };

  const centerOnBbox = () => {
    const map = mapRef.current?.getMap();
    if (!map || !bbox) return;

    const [minx, miny, maxx, maxy] = bbox;
    map.fitBounds([[minx, miny], [maxx, maxy]], {
      padding: 40
    });
  }

  useEffect(centerOnBbox, [bbox])

  const layerStyle = {
    id: 'line',
    type: 'line',
    paint: {
      'line-width': 3,
      'line-color': '#007cbf'
    }
  };

  return (
    <MapGL
      initialViewState={initialViewState}
      ref={mapRef}
      style={{
        width: '100vw',
        height: '100vh',
      }}
      mapStyle="mapbox://styles/mapbox/light-v9"
      mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
    >
      {routeCoords && <Source type="geojson" data={turf.lineString(routeCoords)}>
        <Layer {...layerStyle} />
      </Source>}
      {startPoint && <Marker
        id='startMarker'
        longitude={startPoint[0]}
        latitude={startPoint[1]}
        draggable={true}
        onDragEnd={onStartPointDrag}
        offsetLeft={-13}
        offsetTop={-39}
      >
        <MarkerSVG />
      </Marker>}
      {endPoint && <Marker
        id='endMarker'
        longitude={endPoint[0]}
        latitude={endPoint[1]}
        draggable={true}
        onDragEnd={onEndPointDrag}
        offsetLeft={-13}
        offsetTop={-39}
      >
        <MarkerSVG />
      </Marker>}
    </MapGL >
  );
}

export default BikehopperMap;

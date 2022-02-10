import * as React from 'react';
import { useState } from 'react';
import * as turf from '@turf/helpers';
import MapGL, { Layer, Marker, Source } from 'react-map-gl';
import MarkerSVG from './MarkerSVG';

import 'maplibre-gl/dist/maplibre-gl.css';

function BikehopperMap(props) {
  // the callbacks contain event.lngLat for the point, which can replace startPoint/endPoint
  const { startPoint, endPoint, path, onStartPointDrag, onEndPointDrag } = props;
  const mapRef = React.useRef();

  const [viewport, setViewport] = useState({
    // hardcode San Francisco view for now
    latitude: 37.75117670681911,
    longitude: -122.44574920654225,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  const centerOnBbox = () => {
    const map = mapRef.current.getMap();
    if (!path || !path.bbox) return;

    const [minx, miny, maxx, maxy] = path.bbox;
    const { center: { lng, lat }, zoom } = map.cameraForBounds([[minx, miny], [maxx, maxy]], {
      padding: 40
    });
    setViewport({ latitude: lat, longitude: lng, zoom, bearing: 0, pitch: 0 });
  }

  React.useEffect(centerOnBbox, [path])

  const feats = path && turf.featureCollection(path.legs.map(leg => turf.lineString(leg.geometry.coordinates, { 'route_color': leg['route_color'] })))

  const legStyle = {
    type: 'line',
    paint: {
      'line-width': 3,
      'line-color': ['to-color', ['concat', '#', ['coalesce', ['get', 'route_color'], '007cbf']]]
    }
  };

  return (
    <MapGL
      {...viewport}
      ref={mapRef}
      width="100vw"
      height="100vh"
      mapStyle="mapbox://styles/mapbox/light-v9"
      onViewportChange={setViewport}
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
    >
      {feats && <Source key="routeSource" type="geojson" data={feats} >
        <Layer key="routeLayer" {...legStyle} />
      </Source>
      }
      {
        startPoint && <Marker
          id='startMarker'
          longitude={startPoint[0]}
          latitude={startPoint[1]}
          draggable={true}
          onDragEnd={onStartPointDrag}
          offsetLeft={-13}
          offsetTop={-39}
        >
          <MarkerSVG />
        </Marker>
      }
      {
        endPoint && <Marker
          id='endMarker'
          longitude={endPoint[0]}
          latitude={endPoint[1]}
          draggable={true}
          onDragEnd={onEndPointDrag}
          offsetLeft={-13}
          offsetTop={-39}
        >
          <MarkerSVG />
        </Marker>
      }
    </MapGL >
  );
}

export default BikehopperMap;

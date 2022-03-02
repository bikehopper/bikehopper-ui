import * as React from 'react';
import { useState, useEffect } from 'react';
import { routeToGeoJSON, cycleways } from '../lib/geometry';
import MapGL, {
  Layer,
  Marker,
  Source,
  GeolocateControl,
  NavigationControl,
} from 'react-map-gl';
import MarkerSVG from './MarkerSVG';

import 'maplibre-gl/dist/maplibre-gl.css';
import './BikehopperMap.css';

function BikehopperMap(props) {
  // the callbacks contain event.lngLat for the point, which can replace startPoint/endPoint
  const { startPoint, endPoint, route, onStartPointDrag, onEndPointDrag } =
    props;

  const mapRef = React.useRef();
  const geolocateControlRef = React.useRef();
  const [activePath, setActivePath] = useState(0);

  const initialViewState = {
    // hardcode San Francisco view for now
    latitude: 37.75117670681911,
    longitude: -122.44574920654225,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  };

  const handleRouteClick = (evt) => {
    if (evt.features?.length) {
      setActivePath(evt.features[0].properties['path_index']);
    }
  };

  useEffect(() => {
    geolocateControlRef.current?.trigger();
  }, []);

  // center viewport on route paths
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !route?.paths?.length) return;

    // merge all bboxes
    const bboxes = route.paths.map((path) => path.bbox);
    const [minx, miny, maxx, maxy] = bboxes.reduce((acc, cur) => [
      Math.min(acc[0], cur[0]), // minx
      Math.min(acc[1], cur[1]), // miny
      Math.max(acc[2], cur[2]), // maxx
      Math.max(acc[3], cur[3]), // maxy
    ]);

    map.fitBounds(
      [
        [minx, miny],
        [maxx, maxy],
      ],
      {
        padding: 40,
      },
    );
  }, [route]);

  const features = routeToGeoJSON(route);
  const cyclewayFeatures = cycleways(route);

  const legStyle = {
    id: 'routeLayer',
    type: 'line',
    filter: ['!', ['to-boolean', ['get', 'is_transition']]],
    layout: {
      'line-sort-key': getLegSortKey(activePath),
    },
    paint: {
      'line-width': 3,
      'line-color': getLegColorStyle(activePath),
    },
  };

  const transitionStyle = {
    id: 'transitionLayer',
    type: 'line',
    filter: ['to-boolean', ['get', 'is_transition']],
    layout: {
      'line-sort-key': getLegSortKey(activePath),
    },
    paint: {
      'line-width': 3,
      'line-color': 'darkgray',
      'line-dasharray': [1, 1],
    },
  };

  const navigationControlStyle = {
    visibility: mapRef.current?.getBearing() !== 0 ? 'visible' : 'hidden',
  };

  const routeLabelStyle = {
    id: 'routeLabelLayer',
    type: 'symbol',
    filter: ['!', ['to-boolean', ['get', 'is_transition']]],
    layout: {
      'symbol-sort-key': getLabelSortKey(activePath),
      'symbol-placement': 'line-center',
      'text-size': 16,
      'text-field': getLabelTextField(),
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': getLegColorStyle(activePath),
      'text-halo-color': 'white',
      'text-halo-width': 2,
    },
  };

  const cyclewayStyle = {
    id: 'cyclewayLayer',
    type: 'symbol',
    filter: ['has', 'cycleway'],
    layout: {
      'symbol-sort-key': getLabelSortKey(activePath),
      'symbol-placement': 'line-center',
      'text-size': 24,
      'text-field': ['get', 'cycleway'],
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': getLegColorStyle(activePath),
      'text-halo-color': 'white',
      'text-halo-width': 2,
    },
  };

  return (
    <div className="BikehopperMap">
      <MapGL
        initialViewState={initialViewState}
        ref={mapRef}
        style={{
          // expand to fill parent container div
          // this is because MapGL does not have a className prop
          width: '100%',
          height: '100%',
        }}
        mapStyle="mapbox://styles/mapbox/light-v9"
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        interactiveLayerIds={[
          'routeLayer',
          'transitionLayer',
          'routeLabelLayer',
        ]}
        onClick={handleRouteClick}
      >
        <GeolocateControl ref={geolocateControlRef} />
        <NavigationControl
          showZoom={false}
          style={{ ...navigationControlStyle }}
        />

        <Source id="routeSource" type="geojson" data={features}>
          <Layer {...legStyle} />
          <Layer {...transitionStyle} />
          <Layer {...routeLabelStyle} />
        </Source>
        <Source id="cyclewaySource" type="geojson" data={cyclewayFeatures}>
          <Layer {...cyclewayStyle} />
        </Source>
        {startPoint && (
          <Marker
            id="startMarker"
            longitude={startPoint[0]}
            latitude={startPoint[1]}
            draggable={true}
            onDragEnd={onStartPointDrag}
            offsetLeft={-13}
            offsetTop={-39}
          >
            <MarkerSVG fillColor="#2fa7cc" />
          </Marker>
        )}
        {endPoint && (
          <Marker
            id="endMarker"
            longitude={endPoint[0]}
            latitude={endPoint[1]}
            draggable={true}
            onDragEnd={onEndPointDrag}
            offsetLeft={-13}
            offsetTop={-39}
          >
            <MarkerSVG fillColor="#ea526f" />
          </Marker>
        )}
      </MapGL>
    </div>
  );
}

function getLegSortKey(indexOfActivePath) {
  return ['case', ['==', ['get', 'path_index'], indexOfActivePath], 9999, 0];
}

function getLabelSortKey(indexOfActivePath) {
  return ['case', ['==', ['get', 'path_index'], indexOfActivePath], 9999, 0];
}

function getLegColorStyle(indexOfActivePath) {
  return [
    'case',
    ['==', ['get', 'path_index'], indexOfActivePath],
    // for active path use the route color from GTFS or fallback to blue
    ['to-color', ['get', 'route_color'], 'royalblue'],
    // inactive paths are darkgray
    ['to-color', 'darkgray'],
  ];
}

function getLabelTextField() {
  const text = [
    'case',
    ['==', ['get', 'type'], 'bike2'],
    'bike',
    ['has', 'route_name'],
    ['get', 'route_name'],
    'unknown',
  ];
  return ['format', text];
}

export default BikehopperMap;

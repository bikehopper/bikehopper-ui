import * as React from 'react';
import { useState, useEffect } from 'react';
import { routeToGeoJSON } from '../lib/geometry';
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

  const transitStyle = {
    id: 'transitLayer',
    type: 'line',
    filter: ['==', ['get', 'type'], 'pt'],
    layout: {
      'line-sort-key': getPathSortKey(activePath),
    },
    paint: {
      'line-width': 3,
      'line-color': getTransitColorStyle(activePath),
    },
  };

  const standardBikeStyle = {
    id: 'standardBikeLayer',
    type: 'line',
    filter: [
      'any',
      isCycleway(),
      isCyclewayTrack(),
      isCyclewayLane(),
      isCyclewayMissing(),
      isCyclewayNo(),
    ],
    layout: {
      'line-sort-key': getPathSortKey(activePath),
    },
    paint: {
      'line-width': 3,
      'line-color': getBikeColorStyle(activePath),
    },
  };

  const sharedLaneStyle = {
    id: 'sharedLaneLayer',
    type: 'line',
    filter: isCyclewaySharedLane(),
    layout: {
      'line-sort-key': getPathSortKey(activePath),
    },
    paint: {
      'line-width': 3,
      'line-color': getBikeColorStyle(activePath),
      'line-dasharray': [1, 1],
    },
  };

  const transitionStyle = {
    id: 'transitionLayer',
    type: 'line',
    filter: ['to-boolean', ['get', 'is_transition']],
    layout: {
      'line-sort-key': getPathSortKey(activePath),
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

  const transitLabelStyle = {
    id: 'transitLabelLayer',
    type: 'symbol',
    filter: ['==', ['get', 'type'], 'pt'],
    layout: {
      'symbol-sort-key': getPathSortKey(activePath),
      'symbol-placement': 'line-center',
      'text-size': 16,
      'text-field': getLabelTextField(),
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': getTransitColorStyle(activePath),
      'text-halo-color': 'white',
      'text-halo-width': 2,
    },
  };
  const bikeLabelStyle = {
    id: 'bikeLabelLayer',
    type: 'symbol',
    filter: [
      'all',
      ['has', 'cycleway'],
      ['!', isCyclewayMissing()],
      ['!', isCyclewayNo()],
    ],
    layout: {
      'symbol-sort-key': getPathSortKey(activePath),
      'symbol-placement': 'line-center',
      'text-size': 16,
      'text-field': getLabelTextField(),
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': getBikeColorStyle(activePath),
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
          'transitLayer',
          'standardBikeLayer',
          'sharedLaneLayer',
          'transitionLayer',
          'transitLabelLayer',
          'bikeLabelLayer',
        ]}
        onClick={handleRouteClick}
      >
        <GeolocateControl ref={geolocateControlRef} />
        <NavigationControl
          showZoom={false}
          style={{ ...navigationControlStyle }}
        />

        <Source id="routeSource" type="geojson" data={features}>
          <Layer {...transitStyle} />
          <Layer {...standardBikeStyle} />
          <Layer {...sharedLaneStyle} />
          <Layer {...transitionStyle} />
          <Layer {...transitLabelStyle} />
          <Layer {...bikeLabelStyle} />
          {/* <Layer {...sharedLaneStyle}/> */}
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

function getPathSortKey(indexOfActivePath) {
  return ['case', ['==', ['get', 'path_index'], indexOfActivePath], 9999, 0];
}

function getTransitColorStyle(indexOfActivePath) {
  return [
    'case',
    ['==', ['get', 'path_index'], indexOfActivePath],
    // for active path use the route color from GTFS or fallback to blue
    ['to-color', ['get', 'route_color'], 'red'],
    // inactive paths are darkgray
    ['to-color', 'darkgray'],
  ];
}

function getBikeColorStyle(indexOfActivePath) {
  const color = [
    'case',
    ['==', ['get', 'path_index'], indexOfActivePath],
    [
      'case',
      isCycleway(),
      '#006600',
      isCyclewayTrack(),
      '#006600',
      isCyclewayLane(),
      '#3e8e3e',
      isCyclewaySharedLane(),
      '#71c171',
      // ...
      'royalblue',
    ],
    'darkgray',
  ];
  return ['to-color', color];
}

function isCycleway() {
  return ['==', ['get', 'cycleway'], 'cycleway'];
}

function isCyclewayTrack() {
  return ['==', ['get', 'cycleway'], 'track'];
}

function isCyclewayLane() {
  return ['==', ['get', 'cycleway'], 'lane'];
}

function isCyclewaySharedLane() {
  return ['==', ['get', 'cycleway'], 'shared_lane'];
}

function isCyclewayMissing() {
  return ['==', ['get', 'cycleway'], 'missing'];
}

function isCyclewayNo() {
  return ['==', ['get', 'cycleway'], 'no'];
}

function getLabelTextField() {
  const text = ['case', ['has', 'label'], ['get', 'label'], ''];
  return ['format', text];
}

export default BikehopperMap;

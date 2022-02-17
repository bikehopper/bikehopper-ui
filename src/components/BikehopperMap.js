import * as React from 'react';
import { useState, useEffect } from 'react';
import * as turf from '@turf/helpers';
import MapGL, {
  Layer,
  Marker,
  Source,
  GeolocateControl,
  NavigationControl,
} from 'react-map-gl';
import MarkerSVG from './MarkerSVG';

import 'maplibre-gl/dist/maplibre-gl.css';

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

  let routeFeatures = null;
  if (route?.paths?.length > 0) {
    routeFeatures = turf.featureCollection(
      route.paths
        .map((path, index) =>
          path.legs.map((leg) =>
            turf.lineString(leg.geometry.coordinates, {
              route_color: '#' + leg.route_color,
              path_index: index,
              type: leg.type,
              route_name: leg.route_name,
            }),
          ),
        )
        .flat(),
    );
  }

  const legStyle = {
    id: 'routeLayer',
    type: 'line',
    layout: {
      'line-sort-key': getLegSortKey(activePath),
    },
    paint: {
      'line-width': 3,
      'line-color': getLegColorStyle(activePath),
    },
  };

  const navigationControlStyle = {
    visibility: mapRef.current?.getBearing() !== 0 ? 'visible' : 'hidden',
  };

  const routeLabelStyle = {
    id: 'routeLabelLayer',
    type: 'symbol',
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
      interactiveLayerIds={['routeLayer']}
      onClick={handleRouteClick}
    >
      <GeolocateControl ref={geolocateControlRef} />
      <NavigationControl
        showZoom={false}
        style={{ ...navigationControlStyle }}
      />
      <Source id="routeSource" type="geojson" data={routeFeatures}>
        <Layer {...legStyle} />
      </Source>
      <Source id="routeLabels" type="geojson" data={routeFeatures}>
        <Layer {...routeLabelStyle} />
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

import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MapGL, {
  Layer,
  Marker,
  Source,
  GeolocateControl,
  NavigationControl,
} from 'react-map-gl';
import { routesToGeoJSON, EMPTY_GEOJSON } from '../lib/geometry';
import { DEFAULT_VIEWPORT, mapMoved } from '../features/viewport';
import { routeClicked } from '../features/routes';
import MarkerSVG from './MarkerSVG';

import 'maplibre-gl/dist/maplibre-gl.css';
import './BikehopperMap.css';

function BikehopperMap(props) {
  const dispatch = useDispatch();
  const { startCoords, endCoords, routes, onStartPointDrag, onEndPointDrag } =
    props;

  const mapRef = React.useRef();
  const geolocateControlRef = React.useRef();

  const activePath = useSelector((state) => state.routes.activeRoute);

  const handleRouteClick = (evt) => {
    if (evt.features?.length) {
      dispatch(routeClicked(evt.features[0].properties.path_index));
    }
  };

  useEffect(() => {
    geolocateControlRef.current?.trigger();
  }, []);

  // center viewport on route paths
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !routes?.length) return;

    // merge all bboxes
    const bboxes = routes.map((path) => path.bbox);
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
  }, [routes]);

  const handleMoveEnd = (evt) => {
    dispatch(mapMoved(evt.viewState));
  };

  const features = routes ? routesToGeoJSON(routes) : EMPTY_GEOJSON;

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
    filter: [
      'all',
      ['==', ['get', 'path_index'], activePath],
      ['!', ['to-boolean', ['get', 'is_transition']]],
    ],
    layout: {
      'symbol-sort-key': getLabelSortKey(activePath),
      'symbol-placement': 'line-center',
      'text-size': 16,
      'text-field': getLabelTextField(),
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': 'white',
      'text-halo-color': getLegColorStyle(activePath),
      'text-halo-width': 2,
    },
  };

  return (
    <div className="BikehopperMap">
      <MapGL
        initialViewState={DEFAULT_VIEWPORT}
        ref={mapRef}
        style={{
          // expand to fill parent container div
          // this is because MapGL does not have a className prop
          width: '100%',
          height: '100%',
        }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        interactiveLayerIds={[
          'routeLayer',
          'transitionLayer',
          'routeLabelLayer',
        ]}
        onClick={handleRouteClick}
        onMoveEnd={handleMoveEnd}
      >
        <GeolocateControl ref={geolocateControlRef} />
        <NavigationControl
          showZoom={false}
          style={{ ...navigationControlStyle }}
        />

        <Source id="routeSource" type="geojson" data={features}>
          <Layer
            {...getLegOutlineStyle(
              'routeDropShadow',
              activePath,
              'black',
              24,
              true,
              0.5,
            )}
          />
          <Layer
            {...getLegOutlineStyle(
              'routeOutline',
              activePath,
              'white',
              8,
              false,
              1,
            )}
          />
          <Layer {...getLegStyle(activePath)} />
          <Layer {...transitionStyle} />
          <Layer {...routeLabelStyle} />
        </Source>
        {startCoords && (
          <Marker
            id="startMarker"
            longitude={startCoords[0]}
            latitude={startCoords[1]}
            draggable={true}
            onDragEnd={onStartPointDrag}
            offsetLeft={-13}
            offsetTop={-39}
          >
            <MarkerSVG fillColor="#2fa7cc" />
          </Marker>
        )}
        {endCoords && (
          <Marker
            id="endMarker"
            longitude={endCoords[0]}
            latitude={endCoords[1]}
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

function getLegStyle(activePath) {
  return {
    id: 'routeLayer',
    type: 'line',
    filter: ['!', ['to-boolean', ['get', 'is_transition']]],
    layout: {
      'line-cap': 'round',
      'line-sort-key': getLegSortKey(activePath),
    },
    paint: {
      'line-width': ['case', ['==', ['get', 'type'], 'bike2'], 4, 5],
      'line-color': getLegColorStyle(activePath),
    },
  };
}

function getLegOutlineStyle(
  layerId,
  activePath,
  lineColor,
  lineWidth,
  blur,
  opacity,
) {
  return {
    id: layerId,
    type: 'line',
    filter: [
      'all',
      ['==', ['get', 'path_index'], activePath],
      ['!', ['to-boolean', ['get', 'is_transition']]],
    ],
    layout: {
      'line-cap': 'round',
    },
    paint: {
      'line-width': lineWidth,
      'line-color': lineColor,
      'line-blur': blur ? 30 : 0,
      'line-opacity': opacity,
    },
  };
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
    ['to-color', ['get', 'route_color'], '#5aaa0a'],
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

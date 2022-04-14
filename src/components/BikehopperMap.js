import * as React from 'react';
import { useCallback, useLayoutEffect } from 'react';
import classnames from 'classnames';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import MapGL, {
  Layer,
  Marker,
  Source,
  GeolocateControl,
  NavigationControl,
} from 'react-map-gl';
import {
  routesToGeoJSON,
  EMPTY_GEOJSON,
  BIKEABLE_HIGHWAYS,
} from '../lib/geometry';
import lngLatToCoords from '../lib/lngLatToCoords';
import { geolocated } from '../features/geolocation';
import { LocationSourceType, locationDragged } from '../features/locations';
import { routeClicked } from '../features/routes';
import { mapMoved } from '../features/viewport';
import useResizeObserver from '../hooks/useResizeObserver';
import MarkerSVG from './MarkerSVG';

import 'maplibre-gl/dist/maplibre-gl.css';
import './BikehopperMap.css';

const ZOOM_PADDING = 40;

function BikehopperMap(props) {
  const mapRef = React.useRef();

  const dispatch = useDispatch();
  const {
    startPoint,
    startIsCurrentLocation,
    endPoint,
    endIsCurrentLocation,
    routes,
    activePath,
  } = useSelector(
    (state) => ({
      startPoint: state.locations.start?.point,
      endPoint: state.locations.end?.point,
      startIsCurrentLocation:
        state.locations.start?.source === LocationSourceType.UserGeolocation,
      endIsCurrentLocation:
        state.locations.end?.source === LocationSourceType.UserGeolocation,
      routes: state.routes.routes,
      activePath: state.routes.activeRoute,
    }),
    shallowEqual,
  );

  const startCoords = startPoint?.geometry?.coordinates;
  const endCoords = endPoint?.geometry?.coordinates;

  const handleRouteClick = (evt) => {
    if (evt.features?.length) {
      dispatch(routeClicked(evt.features[0].properties.path_index));
    }
  };

  const handleMoveEnd = (evt) => {
    dispatch(mapMoved(evt.viewState));
  };

  const handleStartPointDrag = (evt) => {
    dispatch(locationDragged('start', lngLatToCoords(evt.lngLat)));
  };

  const handleEndPointDrag = (evt) => {
    dispatch(locationDragged('end', lngLatToCoords(evt.lngLat)));
  };

  const handleGeolocate = (geolocateResultEvent) => {
    console.log('geolocate event', geolocateResultEvent);
    dispatch(
      geolocated(geolocateResultEvent.coords, geolocateResultEvent.timestamp),
    );
    // TODO handle errors as well
  };

  const resizeRef = useResizeObserver(
    useCallback(([width, height]) => {
      if (mapRef.current) mapRef.current.resize();
    }, []),
  );

  // center viewport on route paths
  useLayoutEffect(() => {
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

    // Before centering the map, we must resize the map, because on mobile,
    // showing the bottom pane with the routes overview will have resized the
    // map's container.
    //
    // This does result in an unnecessary, second resize call from the resize
    // observer above. Alas, there's no obvious way to make the resize observer
    // fire before this, and we need that observer to handle resizes that
    // happen for other reasons (device orientation change, desktop browser
    // window resize, etc).
    map.resize();
    map.fitBounds(
      [
        [minx, miny],
        [maxx, maxy],
      ],
      {
        padding: ZOOM_PADDING,
      },
    );
  }, [routes]);

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

  const viewState = useSelector(
    (state) => ({ ...state.viewport }),
    shallowEqual,
  );
  const viewStateOnFirstRender = React.useRef(viewState);

  return (
    <div
      className={classnames({
        BikehopperMap: true,
        BikehopperMap__hidden: props.hidden,
      })}
      ref={resizeRef}
    >
      <MapGL
        initialViewState={viewStateOnFirstRender.current}
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
          'transitLayer',
          'standardBikeLayer',
          'sharedLaneLayer',
          'transitionLayer',
          'transitLabelLayer',
          'bikeLabelLayer',
        ]}
        onClick={handleRouteClick}
        onMoveEnd={handleMoveEnd}
      >
        <GeolocateControl
          trackUserLocation={true}
          onGeolocate={handleGeolocate}
        />
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
          <Layer {...getTransitStyle(activePath)} />
          <Layer {...getStandardBikeStyle(activePath)} />
          <Layer {...getSharedLaneStyle(activePath)} />
          <Layer {...transitionStyle} />
          <Layer {...getTransitLabelStyle(activePath)} />
          <Layer {...getBikeLabelStyle(activePath)} />
        </Source>
        {startCoords && (routes || !startIsCurrentLocation) && (
          <Marker
            id="startMarker"
            longitude={startCoords[0]}
            latitude={startCoords[1]}
            draggable={true}
            onDragEnd={handleStartPointDrag}
            offsetLeft={-13}
            offsetTop={-39}
          >
            <MarkerSVG fillColor="#2fa7cc" />
          </Marker>
        )}
        {endCoords && (routes || !endIsCurrentLocation) && (
          <Marker
            id="endMarker"
            longitude={endCoords[0]}
            latitude={endCoords[1]}
            draggable={true}
            onDragEnd={handleEndPointDrag}
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

function getTransitStyle(activePath) {
  return {
    id: 'transitLayer',
    type: 'line',
    filter: ['==', ['get', 'type'], 'pt'],
    layout: {
      'line-cap': 'round',
      'line-sort-key': getLegSortKey(activePath),
    },
    paint: {
      'line-width': 5,
      'line-color': getTransitColorStyle(activePath),
    },
  };
}

function getStandardBikeStyle(activePath) {
  return {
    id: 'standardBikeLayer',
    type: 'line',
    filter: ['all', ['has', 'cycleway'], ['!', cyclewayIs('shared_lane')]],
    layout: {
      'line-cap': 'round',
      'line-sort-key': getLegSortKey(activePath),
    },
    paint: {
      'line-width': 4,
      'line-color': getBikeColorStyle(activePath),
    },
  };
}

function getSharedLaneStyle(activePath) {
  return {
    id: 'sharedLaneLayer',
    type: 'line',
    filter: cyclewayIs('shared_lane'),
    layout: {
      'line-cap': 'round',
      'line-sort-key': getLegSortKey(activePath),
    },
    paint: {
      'line-width': 4,
      'line-color': getBikeColorStyle(activePath),
      'line-dasharray': [1, 2],
    },
  };
}

function getTransitLabelStyle(activePath) {
  return {
    id: 'transitLabelLayer',
    type: 'symbol',
    filter: [
      'all',
      ['==', ['get', 'path_index'], activePath],
      ['==', ['get', 'type'], 'pt'],
    ],
    layout: {
      'symbol-sort-key': getLegSortKey(activePath),
      'symbol-placement': 'line-center',
      'text-size': 16,
      'text-field': getLabelTextField(),
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': 'white',
      'text-halo-color': getTransitColorStyle(activePath),
      'text-halo-width': 2,
    },
  };
}

function getBikeLabelStyle(activePath) {
  return {
    id: 'bikeLabelLayer',
    type: 'symbol',
    filter: [
      'all',
      ['==', ['get', 'path_index'], activePath],
      ['has', 'cycleway'],
      ['!', cyclewayIs('missing', 'no')],
    ],
    layout: {
      'symbol-sort-key': getLegSortKey(activePath),
      'symbol-placement': 'line-center',
      'text-size': 16,
      'text-field': getLabelTextField(),
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': 'white',
      'text-halo-color': getBikeColorStyle(activePath),
      'text-halo-width': 2,
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
    filter: ['==', ['get', 'path_index'], activePath],
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

function getTransitColorStyle(indexOfActivePath) {
  return [
    'case',
    ['==', ['get', 'path_index'], indexOfActivePath],
    // for active path use the route color from GTFS or fallback to blue
    ['to-color', ['get', 'route_color'], '#5aaa0a'],
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
      cyclewayIs('track', ...BIKEABLE_HIGHWAYS),
      '#006600',
      cyclewayIs('lane', 'shared_lane'),
      '#33cc33',
      // ...
      'royalblue',
    ],
    'darkgray',
  ];
  return ['to-color', color];
}

function getLabelTextField() {
  const text = ['case', ['has', 'label'], ['get', 'label'], ''];
  return ['format', text];
}

function cyclewayIs(...values) {
  if (values?.length === 1) {
    return ['==', ['get', 'cycleway'], values[0]];
  }
  return ['any', ...values.map((v) => ['==', ['get', 'cycleway'], v])];
}

export default BikehopperMap;

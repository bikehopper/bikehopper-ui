import * as React from 'react';
import { useCallback, useLayoutEffect } from 'react';
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
import { mapLoaded } from '../features/misc';
import { locationDragged } from '../features/routeParams';
import { routeClicked } from '../features/routes';
import { mapMoved } from '../features/viewport';
import useResizeObserver from '../hooks/useResizeObserver';
import { BOTTOM_DRAWER_DEFAULT_SCROLL } from '../lib/layout';
import MarkerSVG from './MarkerSVG';
import delay from '../lib/delay';
import * as VisualViewportTracker from '../lib/VisualViewportTracker';

import 'maplibre-gl/dist/maplibre-gl.css';
import './BikehopperMap.css';
import { DEFAULT_BIKE_COLOR, DEFAULT_INACTIVE_COLOR } from '../lib/colors';

const BikehopperMap = React.forwardRef((props, mapRef) => {
  const dispatch = useDispatch();
  const {
    startCoords,
    endCoords,
    routes,
    activePath,
    viewingDetails,
    viewingStep,
  } = useSelector(
    (state) => ({
      routes: state.routes.routes,
      // If we have fetched routes, display start and end markers at the coords
      // the routes are for; if not, but we do have start and/or end locations
      // with coords, display marker(s) at that location/those locations.
      startCoords: state.routes.routes
        ? state.routes.routeStartCoords
        : state.routeParams.start?.point?.geometry.coordinates,
      endCoords: state.routes.routes
        ? state.routes.routeEndCoords
        : state.routeParams.end?.point?.geometry.coordinates,
      activePath: state.routes.activeRoute,
      viewingDetails: state.routes.viewingDetails,
      viewingStep: state.routes.viewingStep,
    }),
    shallowEqual,
  );

  const handleRouteClick = (evt) => {
    if (evt.features?.length) {
      dispatch(routeClicked(evt.features[0].properties.path_index, 'map'));
    }
  };

  const handleMoveEnd = (evt) => {
    dispatch(mapMoved(evt.viewState));
  };

  const handleStartMarkerDrag = (evt) => {
    dispatch(locationDragged('start', lngLatToCoords(evt.lngLat)));
  };

  const handleEndMarkerDrag = (evt) => {
    dispatch(locationDragged('end', lngLatToCoords(evt.lngLat)));
  };

  const handleGeolocate = (geolocateResultEvent) => {
    dispatch(
      geolocated(geolocateResultEvent.coords, geolocateResultEvent.timestamp),
    );
    // TODO handle errors as well
  };

  const handleMapLoad = () => {
    if (props.onMapLoad) props.onMapLoad();
    dispatch(mapLoaded());

    // Make road labels larger
    mapRef.current
      .getMap()
      // This expression is copied over from mapbox-streets-v11 style,
      // but with all the size values increated by 2
      .setLayoutProperty('road-label', 'text-size', [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        [
          'match',
          ['get', 'class'],
          ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'],
          12,
          [
            'motorway_link',
            'trunk_link',
            'primary_link',
            'secondary_link',
            'tertiary_link',
            'pedestrian',
            'street',
            'street_limited',
          ],
          11,
          8.5,
        ],
        18,
        [
          'match',
          ['get', 'class'],
          ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'],
          18,
          [
            'motorway_link',
            'trunk_link',
            'primary_link',
            'secondary_link',
            'tertiary_link',
            'pedestrian',
            'street',
            'street_limited',
          ],
          18,
          15,
        ],
      ]);

    mapRef.current
      .getMap()
      .setPaintProperty('road-label', 'text-halo-width', 3);
  };

  const resizeRef = useResizeObserver(
    useCallback(
      ([width, height]) => {
        if (mapRef.current) mapRef.current.resize();
      },
      [mapRef],
    ),
  );

  // center viewport on route paths
  useLayoutEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !routes?.length) return;

    // merge all bboxes

    const bboxes = routes.map((path) => path.bbox);
    let [minx, miny, maxx, maxy] = bboxes.reduce((acc, cur) => [
      Math.min(acc[0], cur[0]), // minx
      Math.min(acc[1], cur[1]), // miny
      Math.max(acc[2], cur[2]), // maxx
      Math.max(acc[3], cur[3]), // maxy
    ]);

    minx = Math.min(minx, startCoords[0], endCoords[0]);
    miny = Math.min(miny, startCoords[1], endCoords[1]);
    maxx = Math.max(maxx, startCoords[0], endCoords[0]);
    maxy = Math.max(maxy, startCoords[1], endCoords[1]);

    // Before centering the map, we must resize the map, because on mobile,
    // showing the bottom pane with the routes overview will have resized the
    // map's container.
    //
    // This does result in an unnecessary, second resize call from the resize
    // observer above. Alas, there's no obvious way to make the resize observer
    // fire before this, and we need that observer to handle resizes that
    // happen for other reasons (device orientation change, desktop browser
    // window resize, etc).
    const resizeAndFitBounds = () => {
      const padding = {
        top: 20,
        left: 40,
        right: 40,
        bottom: 20,
      };
      if (props.overlayRef.current) {
        const overlayEl = props.overlayRef.current;
        const clientRect = overlayEl.getBoundingClientRect();
        padding.top += clientRect.top;
        padding.bottom +=
          window.innerHeight - clientRect.bottom + BOTTOM_DRAWER_DEFAULT_SCROLL;
        overlayEl.parentElement.scrollTop = 0;
      }
      map.resize();
      map.fitBounds(
        [
          [minx, miny],
          [maxx, maxy],
        ],
        {
          padding,
        },
      );
    };

    if (VisualViewportTracker.isKeyboardUp()) {
      // On mobile Safari we have to wait for the virtual keyboard to go away,
      // or we'll run this prematurely, with the map the wrong size.
      (async function waitToResizeAndFitBounds() {
        await Promise.race([
          VisualViewportTracker.waitForKeyboardDown(),
          delay(400),
        ]);
        resizeAndFitBounds();
      })();
    } else {
      resizeAndFitBounds();
    }
  }, [routes, mapRef, props.overlayRef, startCoords, endCoords]);

  // When viewing a specific step of a route, zoom to where it starts.
  React.useEffect(() => {
    if (
      !routes ||
      activePath == null ||
      !viewingDetails ||
      !viewingStep ||
      !mapRef.current
    )
      return;

    const [legIdx, stepIdx] = viewingStep;

    const leg = routes[activePath].legs[legIdx];
    let stepLngLat;
    if (leg.type === 'pt') {
      // Leg is a transit leg; zoom to a transit stop
      stepLngLat = leg.stops[stepIdx].geometry.coordinates;
    } else {
      // Leg is a bike leg (maybe we'll support walk in the future?);
      // zoom to the start point of the given instruction
      const stepStartPointIdx = leg.instructions[stepIdx].interval[0];
      stepLngLat = leg.geometry.coordinates[stepStartPointIdx];
    }

    const map = mapRef.current.getMap();
    map.easeTo({
      center: stepLngLat,
      zoom: 18,
    });
  }, [routes, activePath, viewingDetails, viewingStep, mapRef]);

  const features = routes ? routesToGeoJSON(routes) : EMPTY_GEOJSON;

  const navigationControlStyle = {
    visibility: mapRef.current?.getBearing() !== 0 ? 'visible' : 'hidden',
  };

  const viewState = useSelector(
    (state) => ({ ...state.viewport }),
    shallowEqual,
  );
  const viewStateOnFirstRender = React.useRef(viewState);

  return (
    <div className="BikehopperMap" ref={resizeRef}>
      <MapGL
        initialViewState={viewStateOnFirstRender.current}
        ref={mapRef}
        style={{
          // expand to fill parent container div
          // this is because MapGL does not have a className prop
          width: '100%',
          height: '100%',
        }}
        onLoad={handleMapLoad}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        interactiveLayerIds={[
          'inactiveLayer',
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
          {/* Order matters: lowest to highest */}
          <Layer beforeId="road-label" {...getInactiveStyle(activePath)} />
          <Layer
            beforeId="road-label"
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
            beforeId="road-label"
            {...getLegOutlineStyle(
              'routeOutline',
              activePath,
              'white',
              8,
              false,
              1,
            )}
          />
          <Layer beforeId="road-label" {...getTransitStyle(activePath)} />
          <Layer beforeId="road-label" {...getStandardBikeStyle(activePath)} />
          <Layer beforeId="road-label" {...getSharedLaneStyle(activePath)} />
          <Layer beforeId="road-label" {...getTransitionStyle(activePath)} />
          <Layer {...getTransitLabelStyle(activePath)} />
          <Layer {...getBikeLabelStyle(activePath)} />
        </Source>
        {startCoords && (
          <Marker
            id="startMarker"
            longitude={startCoords[0]}
            latitude={startCoords[1]}
            draggable={true}
            onDragEnd={handleStartMarkerDrag}
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
            onDragEnd={handleEndMarkerDrag}
            offsetLeft={-13}
            offsetTop={-39}
          >
            <MarkerSVG fillColor="#ea526f" />
          </Marker>
        )}
      </MapGL>
    </div>
  );
});

function getInactiveStyle(activePath) {
  return {
    id: 'inactiveLayer',
    type: 'line',
    filter: ['!', pathIndexIs(activePath)],
    layout: {
      'line-cap': 'round',
    },
    paint: {
      'line-width': 4,
      'line-color': ['to-color', DEFAULT_INACTIVE_COLOR],
    },
  };
}

function getTransitionStyle(activePath) {
  return {
    id: 'transitionLayer',
    type: 'line',
    filter: [
      'all',
      pathIndexIs(activePath),
      ['to-boolean', ['get', 'is_transition']],
    ],
    layout: {},
    paint: {
      'line-width': 3,
      'line-color': 'darkgray',
      'line-dasharray': [1, 1],
    },
  };
}

function getTransitStyle(activePath) {
  return {
    id: 'transitLayer',
    type: 'line',
    filter: ['all', pathIndexIs(activePath), ['==', ['get', 'type'], 'pt']],
    layout: {
      'line-cap': 'round',
    },
    paint: {
      'line-width': 5,
      'line-color': getTransitColorStyle(),
    },
  };
}

function getStandardBikeStyle(activePath) {
  return {
    id: 'standardBikeLayer',
    type: 'line',
    filter: [
      'all',
      pathIndexIs(activePath),
      ['==', ['get', 'type'], 'bike2'],
      [
        'any',
        ['!', propIs('cycleway', 'shared lane')],
        propIs('road_class', ...BIKEABLE_HIGHWAYS),
      ],
    ],
    layout: {
      'line-cap': 'round',
    },
    paint: {
      'line-width': 4,
      'line-color': bikeColorStyle,
    },
  };
}

function getSharedLaneStyle(activePath) {
  return {
    id: 'sharedLaneLayer',
    type: 'line',
    filter: [
      'all',
      pathIndexIs(activePath),
      [
        'all',
        propIs('cycleway', 'shared lane'),
        ['!', propIs('road_class', ...BIKEABLE_HIGHWAYS)],
      ],
    ],
    layout: {
      'line-cap': 'round',
    },
    paint: {
      'line-width': 4,
      'line-color': bikeColorStyle,
      'line-dasharray': [1, 2],
    },
  };
}

function getTransitLabelStyle(activePath) {
  return {
    id: 'transitLabelLayer',
    type: 'symbol',
    filter: ['all', pathIndexIs(activePath), ['==', ['get', 'type'], 'pt']],
    layout: {
      'symbol-placement': 'line-center',
      'text-size': 16,
      'text-field': getLabelTextField(),
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': ['get', 'text_color'],
      'text-halo-color': getTransitColorStyle('text_halo_color'),
      'text-halo-width': 2,
    },
  };
}

function getBikeLabelStyle(activePath) {
  return {
    id: 'bikeLabelLayer',
    type: 'symbol',
    filter: ['all', pathIndexIs(activePath), ['==', ['get', 'type'], 'bike2']],
    layout: {
      'symbol-placement': 'line-center',
      'text-size': 16,
      'text-field': getLabelTextField(),
    },
    paint: {
      'text-color': 'white',
      'text-halo-color': bikeColorStyle,
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
    filter: pathIndexIs(activePath),
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

function getTransitColorStyle(colorKey = 'route_color') {
  return ['to-color', ['get', colorKey]];
}

const bikeColorStyle = [
  'to-color',
  [
    'case',
    [
      'any',
      propIs('cycleway', 'track'),
      propIs('road_class', ...BIKEABLE_HIGHWAYS),
    ],
    '#006600',
    propIs('cycleway', 'lane', 'shared lane'),
    '#33cc33',
    DEFAULT_BIKE_COLOR,
  ],
];

function getLabelTextField() {
  const text = [
    'case',
    // Bikeable highways display the type with optional street name
    propIs('road_class', ...BIKEABLE_HIGHWAYS),
    ['get', 'road_class'],
    // Cycleways display the type with optional street name
    hasProp('cycleway', 'missing', 'no'),
    ['get', 'cycleway'],
    // Default to public transit route or street name
    ['coalesce', ['get', 'route_name'], ''],
  ];
  return ['format', text];
}

function hasProp(key, ...negativeValues) {
  return ['all', ['has', key], ['!', propIs(key, ...negativeValues)]];
}

function propIs(key, ...values) {
  if (values?.length === 1) {
    return ['==', ['get', key], values[0]];
  }

  return ['any', ...values.map((v) => ['==', ['get', key], v])];
}

function pathIndexIs(index) {
  return ['==', ['get', 'path_index'], index];
}

export default BikehopperMap;

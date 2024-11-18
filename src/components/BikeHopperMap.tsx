import type {
  ExpressionFilterSpecification,
  ExpressionSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import { Point as MapLibrePoint } from 'maplibre-gl';
import { forwardRef, useEffect, useRef, useState } from 'react';
import type { MouseEvent, Ref, RefObject } from 'react';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import MapGL, {
  Layer,
  Marker,
  Source,
  GeolocateControl,
  NavigationControl,
} from 'react-map-gl/maplibre';
import type {
  GeolocateResultEvent,
  LngLatLike,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  MapRef,
  MarkerDragEvent,
  ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  routesToGeoJSON,
  EMPTY_GEOJSON,
  BIKEABLE_HIGHWAYS,
} from '../lib/geometry';
import lngLatToCoords from '../lib/lngLatToCoords';
import { isTouchMoveSignificant } from '../lib/touch';
import usePrevious from '../hooks/usePrevious';
import { geolocated } from '../features/geolocation';
import { mapLoaded } from '../features/misc';
import {
  locationDragged,
  locationSelectedOnMap,
} from '../features/routeParams';
import { routeClicked } from '../features/routes';
import { mapMoved } from '../features/viewport';
import useResizeObserver from '../hooks/useResizeObserver';
import {
  BOTTOM_DRAWER_DEFAULT_SCROLL,
  BOTTOM_DRAWER_MIN_HEIGHT,
} from '../lib/layout';
import type { Dispatch, RootState } from '../store';

import './BikeHopperMap.css';
import {
  BIKE_LANE_COLOR,
  CYCLE_TRACK_COLOR,
  DEFAULT_BIKE_COLOR,
  DEFAULT_INACTIVE_COLOR,
} from '../lib/colors';
import { RouteResponsePath } from '../lib/BikeHopperClient';

const _isTouch = 'ontouchstart' in window;

type Props = {
  onMapLoad: () => void;
  overlayRef: RefObject<HTMLElement>;
  hidden: boolean;
};

type Bbox = [number, number, number, number];

const INTERACTIVE_LAYER_IDS = [
  'inactiveLayer',
  'transitLayer',
  'standardBikeLayer',
  'sharedLaneLayer',
  'transitionLayer',
  'transitLabelLayer',
  'bikeLabelLayer',
];
const MAP_CLICK_FUDGE_PX = 2; // Clickable padding around a route line.
const MAP_CLICK_FUDGE_VEC = new MapLibrePoint(
  MAP_CLICK_FUDGE_PX,
  MAP_CLICK_FUDGE_PX,
);

const BikeHopperMap = forwardRef(function _BikeHopperMap(
  props: Props,
  mapRef_: Ref<MapRef>,
) {
  const dispatch: Dispatch = useDispatch();
  const intl = useIntl();
  const mapRef = mapRef_ as RefObject<MapRef>;
  const mouseOverClickableLayerRef = useRef(false);
  const {
    routeStatus,
    startCoords,
    endCoords,
    routes,
    activePath,
    viewingDetails,
    viewingStep,
  } = useSelector(
    (state: RootState) => ({
      routes: state.routes.routes,
      routeStatus: state.routes.routeStatus,
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
  const prevRouteStatus = usePrevious(routeStatus);

  // If non-null, a [clientX, clientY, lng, lat] of where the context menu is
  // open from.
  const [contextMenuAt, setContextMenuAt] = useState<
    [number, number, number, number] | null
  >(null);

  // MapLibre doesn't natively support long press, so we use a timer to detect it,
  // along with the clientX and clientY of the initial touch.
  type LongPressState = {
    timer: number;
    clientX: number;
    clientY: number;
  };
  const longPressTimerIdAndPos = useRef<LongPressState | null>(null);

  const resetLongPressTimer = () => {
    if (longPressTimerIdAndPos.current) {
      clearTimeout(longPressTimerIdAndPos.current.timer);
      longPressTimerIdAndPos.current = null;
    }
  };

  const findFeaturesNear = useCallback(
    (point: MapLibrePoint) => {
      if (!routes || routes.length === 0) return [];
      const map = mapRef.current;
      if (!map) return [];
      const southwest = point.sub(MAP_CLICK_FUDGE_VEC);
      const northeast = point.add(MAP_CLICK_FUDGE_VEC);
      return map.queryRenderedFeatures([southwest, northeast], {
        layers: INTERACTIVE_LAYER_IDS,
      });
    },
    [mapRef, routes],
  );

  const handleMapClick = (evt: MapLayerMouseEvent) => {
    resetLongPressTimer();
    const features = evt.features?.length
      ? evt.features
      : findFeaturesNear(evt.point);
    if (features?.length) {
      const pathIndex = features[0].properties?.path_index;
      if (pathIndex != null) {
        dispatch(routeClicked(pathIndex, 'map'));
      }
    }
  };

  const handleMapRightClick = (evt: MapLayerMouseEvent) => {
    resetLongPressTimer();
    setContextMenuAt([
      evt.originalEvent.clientX,
      evt.originalEvent.clientY,
      evt.lngLat.lng,
      evt.lngLat.lat,
    ]);
  };

  const handleMapMouseMove = (evt: MapLayerMouseEvent) => {
    const map = mapRef.current;
    if (!map) return;
    const features = evt.features?.length
      ? evt.features
      : findFeaturesNear(evt.point);
    const wasOverClickable = mouseOverClickableLayerRef.current;
    const isOverClickable = (mouseOverClickableLayerRef.current =
      features.length > 0);
    if (isOverClickable && !wasOverClickable) {
      map.getCanvas().style.cursor = 'pointer';
    } else if (wasOverClickable && !isOverClickable) {
      map.getCanvas().style.cursor = '';
    }
  };

  const handleMapLongPress = (
    clientX: number,
    clientY: number,
    lng: number,
    lat: number,
  ) => {
    setContextMenuAt([clientX, clientY, lng, lat]);
    resetLongPressTimer();
  };

  const handleTouchStart = (evt: MapLayerTouchEvent) => {
    resetLongPressTimer();
    if (evt.originalEvent.touches.length !== 1) return;
    const { lng, lat } = evt.lngLat;
    const { clientX, clientY } = evt.originalEvent.touches[0];
    longPressTimerIdAndPos.current = {
      timer: setTimeout(
        () => handleMapLongPress(clientX, clientY, lng, lat),
        500,
      ),
      clientX,
      clientY,
    };
  };

  const handleTouchMove = (evt: MapLayerTouchEvent) => {
    if (!longPressTimerIdAndPos.current) return;

    // Reset long-press timer if finger moved more than a little.
    if (
      isTouchMoveSignificant(
        longPressTimerIdAndPos.current.clientX,
        longPressTimerIdAndPos.current.clientY,
        evt.originalEvent.touches[0].clientX,
        evt.originalEvent.touches[0].clientY,
      )
    ) {
      resetLongPressTimer();
    }
  };

  const handleContextMenuOpenChange = (isOpen: boolean) => {
    resetLongPressTimer();
    if (!isOpen) setContextMenuAt(null);
  };

  const handleMouseDown = (evt: MapLayerMouseEvent) => {
    setContextMenuAt(null);
  };

  const handleMoveEnd = (evt: ViewStateChangeEvent) => {
    resetLongPressTimer();
    setContextMenuAt(null);
    dispatch(mapMoved(evt.viewState));
  };

  const handleMoveStart = (evt: ViewStateChangeEvent) => {
    resetLongPressTimer();
    setContextMenuAt(null);
  };

  const handleDirectionsFromClick = (evt: MouseEvent) => {
    if (contextMenuAt)
      dispatch(
        locationSelectedOnMap('start', [contextMenuAt[2], contextMenuAt[3]]),
      );
  };

  const handleDirectionsToClick = (evt: MouseEvent) => {
    if (contextMenuAt)
      dispatch(
        locationSelectedOnMap('end', [contextMenuAt[2], contextMenuAt[3]]),
      );
  };

  const [isDragging, setIsDragging] = useState(false);
  const handleMarkerDragStart = (evt: MarkerDragEvent) => {
    resetLongPressTimer();
    setIsDragging(true);
  };

  const handleStartMarkerDragEnd = (evt: MarkerDragEvent) => {
    resetLongPressTimer();
    setIsDragging(false);
    dispatch(locationDragged('start', lngLatToCoords(evt.lngLat)));
  };

  const handleEndMarkerDragEnd = (evt: MarkerDragEvent) => {
    resetLongPressTimer();
    setIsDragging(false);
    dispatch(locationDragged('end', lngLatToCoords(evt.lngLat)));
  };

  const handleGeolocate = (geolocateResultEvent: GeolocateResultEvent) => {
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
      ?.getMap()
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
      ?.getMap()
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

  // Center viewport on points or routes
  useLayoutEffect(() => {
    const map = mapRef.current?.getMap();
    const overlayEl = props.overlayRef.current;
    if (!map || !overlayEl || !startCoords || !endCoords) return;
    if (isDragging) return;

    // We only want to center in specific situations
    const haveNewRoutes =
      routes && routeStatus === 'succeeded' && prevRouteStatus !== 'succeeded';
    const newlyFetching =
      routeStatus === 'fetching' && prevRouteStatus !== 'fetching';
    if (!(haveNewRoutes || newlyFetching)) return;

    // Start with the points themselves
    let bbox: Bbox = [
      Math.min(startCoords[0], endCoords[0]),
      Math.min(startCoords[1], endCoords[1]),
      Math.max(startCoords[0], endCoords[0]),
      Math.max(startCoords[1], endCoords[1]),
    ];

    // If we have routes, merge all route bounding boxes
    const routeBboxes = (routes || []).map(
      (path: RouteResponsePath) => path.bbox,
    );
    bbox = routeBboxes.reduce(
      (acc: Bbox, cur: Bbox) => [
        Math.min(acc[0], cur[0]), // minx
        Math.min(acc[1], cur[1]), // miny
        Math.max(acc[2], cur[2]), // maxx
        Math.max(acc[3], cur[3]), // maxy
      ],
      bbox,
    );

    const padding = {
      top: 40,
      left: 40,
      right: 40,
      bottom: 40,
    };
    const clientRect = overlayEl.getBoundingClientRect();
    padding.top += clientRect.top;
    // When the bottom drawer first appears, it should be adjusted to this
    // height. (That scroll can happen either before or after this code is
    // executed.) Note that this sometimes leaves more space than needed
    // because the bottom drawer's actual height may be less than the
    // default height if there are only 1 or 2 routes. We might ideally
    // prefer to make sure the scroll happened first, and then measure the
    // bottom drawer.
    padding.bottom += BOTTOM_DRAWER_DEFAULT_SCROLL + BOTTOM_DRAWER_MIN_HEIGHT;

    // If we only have points, no route yet, then don't zoom if the current
    // view already reasonably shows those points.
    if (!routes) {
      const { x: startX, y: startY } = map.project(
        startCoords as [number, number],
      );
      const { x: endX, y: endY } = map.project(endCoords as [number, number]);
      const w = window.innerWidth;
      const h = window.innerHeight;

      const startVisible =
        startX > padding.left &&
        startY > padding.top &&
        startX < w - padding.right &&
        startY < h - padding.bottom;

      const endVisible =
        endX > padding.left &&
        endY > padding.top &&
        endX < w - padding.right &&
        endY < h - padding.bottom;

      const pixelDistance = Math.sqrt(
        (startX - endX) * (startX - endX) + (startY - endY) * (startY - endY),
      );

      const reasonablyFarApart = pixelDistance > 45;

      if (startVisible && endVisible && reasonablyFarApart) return;
    }

    map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      {
        padding,
      },
    );
  }, [
    routes,
    mapRef,
    props.overlayRef,
    startCoords,
    endCoords,
    routeStatus,
    prevRouteStatus,
    isDragging,
  ]);

  // When viewing a specific step of a route, zoom to where it starts.
  useEffect(() => {
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
      center: stepLngLat as LngLatLike,
      zoom: 18,
    });
  }, [routes, activePath, viewingDetails, viewingStep, mapRef]);

  const features = useMemo(() => {
    return routes ? routesToGeoJSON(routes, intl) : EMPTY_GEOJSON;
  }, [routes, intl]);

  const navigationControlVisibility =
    mapRef.current?.getBearing() !== 0 ? 'visible' : 'hidden';

  const viewState = useSelector(
    (state: RootState) => ({ ...state.viewport }),
    shallowEqual,
  );
  const viewStateOnFirstRender = useRef(viewState);

  return (
    <div className="BikeHopperMap" ref={resizeRef} aria-hidden={props.hidden}>
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
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        interactiveLayerIds={INTERACTIVE_LAYER_IDS}
        onMouseMove={!_isTouch ? handleMapMouseMove : undefined}
        onMouseDown={handleMouseDown}
        onClick={handleMapClick}
        onContextMenu={handleMapRightClick}
        onMoveEnd={handleMoveEnd}
        onMoveStart={_isTouch ? handleMoveStart : undefined}
        onTouchStart={_isTouch ? handleTouchStart : undefined}
        onTouchMove={_isTouch ? handleTouchMove : undefined}
        onTouchEnd={_isTouch ? resetLongPressTimer : undefined}
        onTouchCancel={_isTouch ? resetLongPressTimer : undefined}
      >
        <GeolocateControl
          trackUserLocation={true}
          onGeolocate={handleGeolocate}
        />
        <NavigationControl
          showZoom={false}
          style={{ visibility: navigationControlVisibility }}
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
            longitude={startCoords[0]}
            latitude={startCoords[1]}
            draggable={true}
            onDragStart={handleMarkerDragStart}
            onDragEnd={handleStartMarkerDragEnd}
            color="#2fa7cc"
          />
        )}
        {endCoords && (
          <Marker
            longitude={endCoords[0]}
            latitude={endCoords[1]}
            draggable={true}
            onDragStart={handleMarkerDragStart}
            onDragEnd={handleEndMarkerDragEnd}
            color="#ea526f"
          />
        )}
        {contextMenuAt && (
          <Marker
            longitude={contextMenuAt[2]}
            latitude={contextMenuAt[3]}
            color={'#fcd34d' /* tailwind amber-300 */}
            style={{ opacity: '70%' }}
          />
        )}
      </MapGL>
      <DropdownMenu.Root
        open={Boolean(contextMenuAt)}
        onOpenChange={handleContextMenuOpenChange}
      >
        <DropdownMenu.Trigger asChild>
          <div
            className="pointer-events-none fixed"
            style={
              contextMenuAt
                ? {
                    left: contextMenuAt[0],
                    top: contextMenuAt[1],
                  }
                : undefined
            }
          >
            {/* not used, real trigger is the map itself */}
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="w-48 rounded-md px-1.5 py-1 mt-1 shadow-md md:w-56
              bg-white dark:bg-gray-800 z-10
              border-gray-300 dark:border-gray-600 border border-solid"
          >
            <DropdownMenu.Item
              key="route-from"
              className="flex select-none items-center rounded-md px-2 py-2
                text-sm outline-none
                text-gray-400 focus:bg-gray-50 dark:text-gray-500 dark:focus:bg-gray-900"
              onClick={handleDirectionsFromClick}
            >
              <span className="flex-grow text-gray-700 dark:text-gray-300">
                <FormattedMessage
                  defaultMessage="Directions from"
                  description={
                    'menu item. ' +
                    'Appears in context menu under a location you have selected on the map. ' +
                    'When clicked, computes directions from that location.'
                  }
                />
              </span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              key="route-to"
              className="flex select-none items-center rounded-md px-2 py-2
                text-sm outline-none
                text-gray-400 focus:bg-gray-50 dark:text-gray-500 dark:focus:bg-gray-900"
              onClick={handleDirectionsToClick}
            >
              <span className="flex-grow text-gray-700 dark:text-gray-300">
                <FormattedMessage
                  defaultMessage="Directions to"
                  description={
                    'menu item. ' +
                    'Appears in context menu under a location you have selected on the map. ' +
                    'When clicked, computes directions to that location.'
                  }
                />
              </span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
});

function getInactiveStyle(
  activePath: number | null,
): Omit<LineLayerSpecification, 'source'> {
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

function getTransitionStyle(
  activePath: number | null,
): Omit<LineLayerSpecification, 'source'> {
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

function getTransitStyle(
  activePath: number | null,
): Omit<LineLayerSpecification, 'source'> {
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

function getStandardBikeStyle(
  activePath: number | null,
): Omit<LineLayerSpecification, 'source'> {
  return {
    id: 'standardBikeLayer',
    type: 'line',
    filter: [
      'all',
      pathIndexIs(activePath),
      ['==', ['get', 'type'], 'bike2'],
      [
        'any',
        ['!', propIs('cycleway', 'shared_lane')],
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

function getSharedLaneStyle(
  activePath: number | null,
): Omit<LineLayerSpecification, 'source'> {
  return {
    id: 'sharedLaneLayer',
    type: 'line',
    filter: [
      'all',
      pathIndexIs(activePath),
      [
        'all',
        propIs('cycleway', 'shared_lane'),
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

function getTransitLabelStyle(
  activePath: number | null,
): Omit<SymbolLayerSpecification, 'source'> {
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

function getBikeLabelStyle(
  activePath: number | null,
): Omit<SymbolLayerSpecification, 'source'> {
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
  layerId: string,
  activePath: number | null,
  lineColor: string,
  lineWidth: number,
  blur: boolean,
  opacity: number,
): Omit<LineLayerSpecification, 'source'> {
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

function getTransitColorStyle(
  colorKey = 'route_color',
): ExpressionSpecification {
  return ['to-color', ['get', colorKey]];
}

const bikeColorStyle: ExpressionSpecification = [
  'to-color',
  [
    'case',
    [
      'any',
      propIs('cycleway', 'track'),
      propIs('road_class', ...BIKEABLE_HIGHWAYS),
    ],
    CYCLE_TRACK_COLOR,
    propIs('cycleway', 'lane', 'shared_lane'),
    BIKE_LANE_COLOR,
    DEFAULT_BIKE_COLOR,
  ],
];

function getLabelTextField(): ExpressionSpecification {
  const text: ExpressionSpecification = [
    'case',
    // If bike infra info, display it!
    hasProp('bike_infra', ''),
    ['get', 'bike_infra'],
    // Default to public transit route name if present
    ['coalesce', ['get', 'route_name'], ''],
  ];
  return ['format', text];
}

function hasProp(
  key: string,
  ...negativeValues: string[]
): ExpressionSpecification {
  return ['all', ['has', key], ['!', propIs(key, ...negativeValues)]];
}

function propIs(key: string, ...values: string[]): ExpressionSpecification {
  if (values?.length === 1) {
    return ['==', ['get', key], values[0]];
  }

  const matchers: ExpressionSpecification[] = values.map((v) => [
    '==',
    ['get', key],
    v,
  ]);

  return ['any', ...matchers];
}

function pathIndexIs(index: number | null): ExpressionFilterSpecification {
  return index == null ? false : ['==', ['get', 'path_index'], index];
}

export default BikeHopperMap;

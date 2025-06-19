import {
  CircleLayerSpecification,
  ExpressionSpecification,
  FilterSpecification,
  SymbolLayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import { ActiveStops, ActiveStopTypes } from '../../lib/activeIds';

const buildFilter = ({
  activeStops,
  stopTypes,
}: {
  activeStops: ActiveStops;
  stopTypes: ActiveStopTypes[];
}): FilterSpecification => [
  'any',
  ...stopTypes.map((stopType) =>
    getIsActiveStopExpression(activeStops, stopType),
  ),
];

const IS_BUS: ExpressionSpecification = ['to-boolean', ['get', 'bus']];

function getIsActiveStopExpression(
  activeStops: ActiveStops,
  stopType: ActiveStopTypes,
): ExpressionSpecification {
  return ['in', ['get', 'stop_id'], ['literal', activeStops[stopType]]];
}

const COMMON_STOP_NAME_LAYOUT = {
  'text-field': ['get', 'stop_name'],
  'text-anchor': 'top-left',
  'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
  'text-justify': 'left',
  'text-offset': [0.3, 0.3],
} as const satisfies SymbolLayerSpecification['layout'];

const COMMON_STOP_NAME_PAINT = {
  'text-halo-color': 'white',
  'text-halo-width': 2,
} as const satisfies SymbolLayerSpecification['paint'];

export const boardAlightStopNames = (activeStops: ActiveStops) =>
  ({
    id: 'boardAlightStopNames',
    'source-layer': 'stops',
    type: 'symbol',
    minzoom: 10,
    layout: {
      ...COMMON_STOP_NAME_LAYOUT,
      'text-size': ['case', IS_BUS, 12, 14],
    },
    paint: {
      ...COMMON_STOP_NAME_PAINT,
      'text-color': 'black',
    },
    filter: buildFilter({
      activeStops,
      stopTypes: [ActiveStopTypes.entry, ActiveStopTypes.exit],
    }),
  }) as const satisfies Omit<SymbolLayerSpecification, 'source'>;

export const intermediateStopNames = (activeStops: ActiveStops) =>
  ({
    id: 'intermediateStopNames',
    'source-layer': 'stops',
    type: 'symbol',
    minzoom: 12,
    layout: {
      ...COMMON_STOP_NAME_LAYOUT,
      'text-size': ['case', IS_BUS, 10, 12],
    },
    paint: {
      ...COMMON_STOP_NAME_PAINT,
      'text-color': 'black',
    },
    filter: buildFilter({
      activeStops,
      stopTypes: [ActiveStopTypes.intermediate],
    }),
  }) as const satisfies Omit<SymbolLayerSpecification, 'source'>;

export const offRouteStopNames = (activeStops: ActiveStops) =>
  ({
    id: 'offRouteStopNames',
    'source-layer': 'stops',
    type: 'symbol',
    minzoom: 14,
    layout: {
      ...COMMON_STOP_NAME_LAYOUT,
      'text-size': ['case', IS_BUS, 9, 10],
    },
    paint: {
      ...COMMON_STOP_NAME_PAINT,
      'text-color': 'grey',
    },
    filter: buildFilter({
      activeStops,
      stopTypes: [ActiveStopTypes.offRoute],
    }),
  }) as const satisfies Omit<SymbolLayerSpecification, 'source'>;

export const boardAlightStopOutlines = (activeStops: ActiveStops) =>
  ({
    id: 'boardAlightStopOutlines',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 8,
    paint: {
      'circle-radius': 7,
      'circle-color': [
        'case',
        getIsActiveStopExpression(activeStops, ActiveStopTypes.entry),
        'darkgreen',
        'darkred',
      ],
    },
    filter: buildFilter({
      activeStops,
      stopTypes: [ActiveStopTypes.entry, ActiveStopTypes.exit],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

export const intermediateStopOutlines = (activeStops: ActiveStops) =>
  ({
    id: 'intermediateStopOutlines',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 12,
    paint: {
      'circle-radius': 4,
      'circle-color': 'black',
    },
    filter: buildFilter({
      activeStops,
      stopTypes: [ActiveStopTypes.intermediate],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

export const offRouteStopOutlines = (activeStops: ActiveStops) =>
  ({
    id: 'offRouteStopOutlines',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 12,
    paint: {
      'circle-radius': 3,
      'circle-color': 'grey',
    },
    filter: buildFilter({
      activeStops,
      stopTypes: [ActiveStopTypes.offRoute],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

export const boardAlightStops = (activeStops: ActiveStops) =>
  ({
    id: 'boardAlightStops',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 8,
    paint: {
      'circle-radius': 4,
      'circle-color': 'white',
    },
    filter: buildFilter({
      activeStops,
      stopTypes: [ActiveStopTypes.entry, ActiveStopTypes.exit],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

export const intermediateStops = (activeStops: ActiveStops) =>
  ({
    id: 'intermediateStops',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 12,
    paint: {
      'circle-radius': 2,
      'circle-color': 'white',
    },
    filter: buildFilter({
      activeStops,
      stopTypes: [ActiveStopTypes.intermediate],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

export const offRouteStops = (activeStops: ActiveStops) =>
  ({
    id: 'offRouteStops',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 12,
    paint: {
      'circle-radius': 1,
      'circle-color': 'white',
    },
    filter: buildFilter({
      activeStops,
      stopTypes: [ActiveStopTypes.offRoute],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

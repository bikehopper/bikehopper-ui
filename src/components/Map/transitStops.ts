import {
  CircleLayerSpecification,
  DataDrivenPropertyValueSpecification,
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

const IS_BUS: ExpressionSpecification = ['to-boolean', ['get', 'bus']] as const;

const getIsActiveStopExpression = (
  activeStops: ActiveStops,
  stopType: ActiveStopTypes,
) =>
  [
    'in',
    ['get', 'stop_id'],
    ['literal', activeStops[stopType]],
  ] as const satisfies ExpressionSpecification;

const stepExpression = ({
  trainMin,
  busMin,
}: {
  trainMin: number;
  busMin: number;
}) =>
  [
    'step',
    ['zoom'],
    0,
    trainMin,
    ['case', IS_BUS, 0, 1],
    busMin,
    1,
  ] as const satisfies DataDrivenPropertyValueSpecification<number>;

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
    minzoom: 9,
    layout: {
      ...COMMON_STOP_NAME_LAYOUT,
      'text-size': ['case', IS_BUS, 12, 14],
    },
    paint: {
      ...COMMON_STOP_NAME_PAINT,
      'text-color': 'black',
      'text-opacity': stepExpression({ trainMin: 9, busMin: 10 }),
    },
    filter: buildFilter({
      activeStops,
      stopTypes: ['entry', 'exit'],
    }),
  }) as const satisfies Omit<SymbolLayerSpecification, 'source'>;

export const intermediateStopNames = (activeStops: ActiveStops) =>
  ({
    id: 'intermediateStopNames',
    'source-layer': 'stops',
    type: 'symbol',
    minzoom: 11,
    layout: {
      ...COMMON_STOP_NAME_LAYOUT,
      'text-size': ['case', IS_BUS, 10, 12],
    },
    paint: {
      ...COMMON_STOP_NAME_PAINT,
      'text-color': 'black',
      'text-opacity': stepExpression({ trainMin: 11, busMin: 13 }),
    },
    filter: buildFilter({
      activeStops,
      stopTypes: ['intermediate'],
    }),
  }) as const satisfies Omit<SymbolLayerSpecification, 'source'>;

export const offRouteStopNames = (activeStops: ActiveStops) =>
  ({
    id: 'offRouteStopNames',
    'source-layer': 'stops',
    type: 'symbol',
    minzoom: 12,
    layout: {
      ...COMMON_STOP_NAME_LAYOUT,
      'text-size': ['case', IS_BUS, 10, 12],
    },
    paint: {
      ...COMMON_STOP_NAME_PAINT,
      'text-color': 'grey',
      'text-opacity': stepExpression({ trainMin: 12, busMin: 14 }),
    },
    filter: buildFilter({
      activeStops,
      stopTypes: ['offRoute'],
    }),
  }) as const satisfies Omit<SymbolLayerSpecification, 'source'>;

export const boardAlightStopOutlines = (activeStops: ActiveStops) =>
  ({
    id: 'boardAlightStopOutlines',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 7,
    paint: {
      'circle-radius': 7,
      'circle-color': [
        'case',
        getIsActiveStopExpression(activeStops, 'entry'),
        'darkgreen',
        'darkred',
      ],
      'circle-opacity': stepExpression({ trainMin: 7, busMin: 8 }),
    },
    filter: buildFilter({
      activeStops,
      stopTypes: ['entry', 'exit'],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

export const intermediateStopOutlines = (activeStops: ActiveStops) =>
  ({
    id: 'intermediateStopOutlines',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 10,
    paint: {
      'circle-radius': 4,
      'circle-color': 'black',
      'circle-opacity': stepExpression({ trainMin: 10, busMin: 12 }),
    },
    filter: buildFilter({
      activeStops,
      stopTypes: ['intermediate'],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

export const offRouteStopOutlines = (activeStops: ActiveStops) =>
  ({
    id: 'offRouteStopOutlines',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 11,
    paint: {
      'circle-radius': 3,
      'circle-color': 'grey',
      'circle-opacity': stepExpression({ trainMin: 11, busMin: 13 }),
    },
    filter: buildFilter({
      activeStops,
      stopTypes: ['offRoute'],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

export const boardAlightStops = (activeStops: ActiveStops) =>
  ({
    id: 'boardAlightStops',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 7,
    paint: {
      'circle-radius': 4,
      'circle-color': 'white',
      'circle-opacity': stepExpression({ trainMin: 7, busMin: 8 }),
    },
    filter: buildFilter({
      activeStops,
      stopTypes: ['entry', 'exit'],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

export const intermediateStops = (activeStops: ActiveStops) =>
  ({
    id: 'intermediateStops',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 10,
    paint: {
      'circle-radius': 2,
      'circle-color': 'white',
      'circle-opacity': stepExpression({ trainMin: 10, busMin: 12 }),
    },
    filter: buildFilter({
      activeStops,
      stopTypes: ['intermediate'],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

export const offRouteStops = (activeStops: ActiveStops) =>
  ({
    id: 'offRouteStops',
    'source-layer': 'stops',
    type: 'circle',
    minzoom: 11,
    paint: {
      'circle-radius': 1,
      'circle-color': 'white',
      'circle-opacity': stepExpression({ trainMin: 11, busMin: 13 }),
    },
    filter: buildFilter({
      activeStops,
      stopTypes: ['offRoute'],
    }),
  }) as const satisfies Omit<CircleLayerSpecification, 'source'>;

import { parse as csvParse } from 'csv/browser/esm/sync';
import groupBy from 'lodash/groupBy';
import { z } from 'zod';

import elevatorsData from '../../data/bartelevators.csv?raw';
import elevatorsMappingData from '../../data/bartelevators_stopids.csv?raw';

// all measurements are assumed to be in inches
const numberInInchesRegex = /^(\d+(\.\d*)?)"$/;

const ElevatorSchema = z.array(
  z.object({
    Station: z.string(),
    'Elevator Stops': z.string(),
    Door: z.string().regex(numberInInchesRegex),
    Width: z.string().regex(numberInInchesRegex),
    Length: z.string().regex(numberInInchesRegex),
    Diagonal: z.string().regex(numberInInchesRegex),
  }),
);

const ElevatorToStopIdSchema = z.array(
  z.object({
    'Station Name in Elevator Data': z.string(),
    stop_id: z.string(),
  }),
);

const elevatorsRaw = ElevatorSchema.parse(
  csvParse(elevatorsData, { columns: true }),
);
const elevatorsToStopIdMapping = new Map<string, string>(
  ElevatorToStopIdSchema.parse(
    csvParse(elevatorsMappingData, { columns: true }),
  ).map((item) => [item['Station Name in Elevator Data'], item.stop_id]),
);

export type ElevatorInfo = {
  description: string;
  door: number;
  width: number;
  length: number;
  diagonal: number;
};

const elevatorsByStation = groupBy(elevatorsRaw, 'Station');

export const stationElevators = new Map<string, ElevatorInfo[]>(
  Object.entries(elevatorsByStation).map(([station, elevatorsThisStation]) => [
    elevatorsToStopIdMapping.get(station) || '(unknown stop)',
    elevatorsThisStation.map((item) => ({
      description: item['Elevator Stops'],
      door: Number(item.Door.match(numberInInchesRegex)?.[1]),
      width: Number(item.Width.match(numberInInchesRegex)?.[1]),
      length: Number(item.Length.match(numberInInchesRegex)?.[1]),
      diagonal: Number(item.Diagonal.match(numberInInchesRegex)?.[1]),
    })),
  ]),
);

console.log(stationElevators);

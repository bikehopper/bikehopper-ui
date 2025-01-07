import { useIntl } from 'react-intl';

import { BIKEHOPPER_THEME_COLOR, DEFAULT_PT_COLOR } from '../lib/colors';

import distance from '@turf/distance';
import * as turf from '@turf/helpers';
import { LineCanvas, Serie } from '@nivo/line';
import type { AxisProps } from '@nivo/axes';
import type { ScaleSpec } from '@nivo/scales';
import { RouteResponsePath } from '../lib/BikeHopperClient';
import useScreenDims from '../hooks/useScreenDims';

const METERS_PER_FOOT = 0.3048;

function formatBikeLeg(
  bikeLeg: BikeLegElevationData,
  i: number,
): BikeLegElevationData {
  return {
    id: `bike${i}`,
    color: BIKEHOPPER_THEME_COLOR,
    ...bikeLeg,
  };
}

function isBikeLeg(leg: LegElevationData): leg is BikeLegElevationData {
  return Boolean(leg.id?.startsWith('bike'));
}

function formatPTLeg(ptLeg: PTLegElevationData, i: number): PTLegElevationData {
  return {
    id: `pt${i}`,
    ...ptLeg,
  };
}

function range(start: number, stop: number, step: number) {
  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return [];
  }

  var result = [];
  for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i);
  }

  return result;
}

function calculateXTicks(
  startX: number,
  endX: number,
  bikePixelsPerDist: number,
) {
  let tickValues = [];
  const step = bikePixelsPerDist < 7 ? 5 : bikePixelsPerDist < 15 ? 2 : 1;
  tickValues = range(Math.ceil(startX), Math.ceil(endX), step);
  let firstTick = Math.ceil(startX * 10) / 10;
  let increment = 1;
  while ((firstTick - startX) * bikePixelsPerDist <= 9) {
    firstTick = Math.ceil(startX * 10 + increment) / 10;
    increment++;
  }
  if (!tickValues.length) {
    tickValues = [firstTick];
  }
  if ((tickValues[0] - firstTick) * bikePixelsPerDist > 17) {
    tickValues.unshift(firstTick);
  }
  let lastTick = Math.floor(endX * 10) / 10;
  let decrement = 1;
  while ((endX - lastTick) * bikePixelsPerDist <= 9) {
    lastTick = Math.floor(endX * 10 - decrement) / 10;
    decrement++;
  }
  if ((lastTick - tickValues[tickValues.length - 1]) * bikePixelsPerDist > 17) {
    tickValues.push(lastTick);
  }
  return tickValues;
}

type LegElevationData = {
  data: {
    x: number;
    y: number | null;
    type?: 'start' | 'end';
  }[];
  color?: string;
  id?: string;
};

type BikeLegElevationData = LegElevationData & {
  dist?: number;
};

type PTLegElevationData = LegElevationData & {
  label?: string;
  name?: string;
};

export default function ItineraryElevationProfile({
  route,
}: {
  route: RouteResponsePath;
}) {
  const intl = useIntl();

  const legs = [];
  const ptLegs = [];
  let ptLegIdxsWithoutHeight: number[] = [];
  let currentDist = 0;
  let currentPoint = route.legs[0].geometry.coordinates[0];
  let maxHeight = -Infinity;
  let minHeight = Infinity;
  let bikeDist = 0;
  let longestBikeDist = 0;
  let longestBikeIdx = -1;
  let currPTLeg: PTLegElevationData = { data: [] };
  let currBikeLeg: BikeLegElevationData = { data: [] };
  for (const [legIdx, leg] of route.legs.entries()) {
    for (const [pointIdx, point] of leg.geometry.coordinates.entries()) {
      const dist = distance(turf.point(currentPoint), turf.point(point), {
        units: 'miles',
      });
      currentDist += dist;
      currentPoint = point;

      // Handle point with elevation data (all bike legs)
      if (point.length === 3) {
        const pointHeight = currentPoint[2] / METERS_PER_FOOT;
        currBikeLeg.data.push({ x: currentDist, y: pointHeight });
        maxHeight = Math.max(pointHeight, maxHeight);
        minHeight = Math.min(pointHeight, minHeight);

        // Calculate start/end heights for public transit legs

        // Get start height for next PT leg
        if (
          pointIdx === leg.geometry.coordinates.length - 1 &&
          legIdx < route.legs.length - 1 &&
          route.legs[legIdx + 1].type === 'pt'
        ) {
          currPTLeg.data.push({
            x: currentDist,
            y: pointHeight,
            type: 'start',
          });
        }

        // Get end height for previous PT leg
        if (
          pointIdx === 0 &&
          legIdx > 0 &&
          route.legs[legIdx - 1].type === 'pt'
        ) {
          currPTLeg.data.push({ x: currentDist, y: pointHeight, type: 'end' });
          ptLegs.push(currPTLeg);
          legs.push(formatPTLeg(currPTLeg, legIdx - 1));
          currPTLeg = { data: [] };
          // Check if we have any transit legs without a start/end height
          if (ptLegIdxsWithoutHeight.length) {
            const startHeight =
              ptLegs[ptLegIdxsWithoutHeight[0]].data[0].y ?? 0;
            const heightDiff = pointHeight - startHeight;
            for (let k = 0; k < ptLegIdxsWithoutHeight.length; k++) {
              // Calculate share of height difference that should be assigned to this leg
              const frac = (k + 1) / (ptLegIdxsWithoutHeight.length + 1);
              ptLegs[ptLegIdxsWithoutHeight[k]].data[1].y =
                startHeight + frac * heightDiff;
              ptLegs[ptLegIdxsWithoutHeight[k] + 1].data[0].y =
                startHeight + frac * heightDiff;
            }
            ptLegIdxsWithoutHeight = [];
          }
        }
      } else {
        // Sometimes two transit legs are next to each other without a bike leg in between
        if (
          pointIdx === leg.geometry.coordinates.length - 1 &&
          legIdx < route.legs.length - 1 &&
          route.legs[legIdx + 1].type === 'pt'
        ) {
          currPTLeg.data.push({ x: currentDist, y: null, type: 'end' });
          ptLegs.push(currPTLeg);
          legs.push(formatPTLeg(currPTLeg, legIdx));
          currPTLeg = { data: [] };
          ptLegIdxsWithoutHeight.push(ptLegs.length - 1);
        }
        if (
          pointIdx === 0 &&
          legIdx > 0 &&
          route.legs[legIdx - 1].type === 'pt'
        ) {
          currPTLeg.data.push({ x: currentDist, y: null, type: 'start' });
        }
      }

      // Set params for the PT leg
      if (pointIdx === 0 && leg.type === 'pt') {
        const color = leg.route_color ?? DEFAULT_PT_COLOR;
        currPTLeg['color'] = color;
        currPTLeg['label'] = leg.route_name;
        currPTLeg['name'] = leg.trip_id;
      }
    }
    // Once we're done iterating through the points, push the bike leg to the list
    if (leg.type === 'bike2') {
      const endX = currBikeLeg.data[currBikeLeg.data.length - 1].x;
      const startX = currBikeLeg.data[0].x;
      const bikeLegDist = endX - startX;
      bikeDist += bikeLegDist;
      currBikeLeg['dist'] = bikeLegDist;
      if (bikeLegDist > longestBikeDist) {
        longestBikeIdx = legIdx;
        longestBikeDist = bikeLegDist;
      }
      legs.push(formatBikeLeg(currBikeLeg, legIdx));
      currBikeLeg = { data: [] };
    }
  }

  function round5(x: number) {
    return Math.ceil(x / 5) * 5;
  }

  const minYElev = round5(minHeight - 5);
  const maxYElev = round5(maxHeight + 5);
  const medYElev = round5((minYElev + maxYElev) / 2);

  // Chart params
  const yScale: ScaleSpec = {
    type: 'linear',
    min: minYElev,
    max: maxYElev,
  };

  const yTicks = [minYElev, medYElev, maxYElev];

  const axisLeft: AxisProps<number> = {
    legend: intl.formatMessage({
      defaultMessage: 'Feet',
      description: 'legend at the left (y-axis) of elevation graph',
    }),
    legendPosition: 'middle',
    legendOffset: -40,
    tickValues: yTicks,
  };

  type Margin = {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };

  const defaultMargin: Margin = {
    top: 30,
    bottom: 50,
  };

  const { isMobile, innerWidth } = useScreenDims();
  const totalWidth = isMobile ? innerWidth - 50 : 400 - 30;

  const chartHeight = 150;
  const ptWidthFrac = 0.15;
  const leftMargin = 50;
  const rightMargin = 30;

  const bikeWidth =
    (totalWidth - leftMargin - rightMargin) * (1 - ptLegs.length * ptWidthFrac);

  // Calculate how many pixels per mile (in this case) for bike legs
  const bikePixelsPerDist = bikeWidth / bikeDist;

  return (
    <div className="flex overflow-hidden">
      {legs.map((leg, legIdx) => {
        const startX = leg.data[0].x;
        const endX = leg.data[leg.data.length - 1].x;
        const xScale: ScaleSpec = {
          type: 'linear',
          min: startX,
          max: endX,
        };
        if (isBikeLeg(leg)) {
          const legWidth = (leg.dist ?? 0) * bikePixelsPerDist;
          const xTicks =
            legWidth < 25
              ? []
              : calculateXTicks(startX, endX, bikePixelsPerDist);
          const axisBottom: AxisProps<number> =
            legIdx === longestBikeIdx
              ? {
                  tickValues: xTicks,
                  legend: intl.formatMessage({
                    defaultMessage: 'Miles',
                    description:
                      'legend at the bottom (x-axis) of elevation graph',
                  }),
                  legendPosition: 'middle',
                  legendOffset: 30,
                }
              : { tickValues: xTicks };
          let margin = defaultMargin;
          let width = legWidth;
          if (legIdx === 0) {
            margin = {
              left: leftMargin,
              ...defaultMargin,
            };
            width += leftMargin;
          } else if (legIdx === legs.length - 1) {
            margin = {
              right: rightMargin,
              ...defaultMargin,
            };
            width += rightMargin;
          }
          return (
            <LineCanvas
              key={leg.id}
              data={[leg as Serie]}
              width={width}
              height={chartHeight}
              xScale={xScale}
              yScale={yScale}
              colors={(d) => d.color}
              pointSize={0}
              enableArea={true}
              areaBaselineValue={minYElev}
              axisLeft={legIdx === 0 ? axisLeft : null}
              axisBottom={axisBottom}
              gridXValues={xTicks}
              gridYValues={yTicks}
              margin={margin}
              isInteractive={false}
            />
          );
        } else {
          const axisTop = {
            legend: leg.label,
            legendPosition: 'middle',
            legendOffset: 5,
            tickValues: [],
          } satisfies AxisProps<number>;
          const roundedDist = Math.ceil((endX - startX) * 10) / 10;
          const axisBottom = {
            legend: `${roundedDist}mi`,
            legendPosition: 'middle',
            legendOffset: 10,
            tickValues: [],
          } satisfies AxisProps<number>;
          return (
            <LineCanvas
              key={leg.id}
              data={[leg as Serie]}
              width={totalWidth * ptWidthFrac}
              height={chartHeight}
              xScale={xScale}
              yScale={yScale}
              enableGridX={true}
              gridXValues={[startX + 0.01, endX - 0.01]}
              gridYValues={yTicks}
              colors={(d) => d.color}
              pointSize={0}
              axisLeft={null}
              axisTop={axisTop}
              axisBottom={axisBottom}
              enableArea={true}
              areaBaselineValue={minYElev}
              isInteractive={false}
              margin={defaultMargin}
            />
          );
        }
      })}
    </div>
  );
}

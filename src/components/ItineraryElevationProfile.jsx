import * as React from 'react';

import './ItineraryElevationProfile.css';

import { BIKEHOPPER_THEME_COLOR, DEFAULT_PT_COLOR } from '../lib/colors';
import { getAgencyDisplayName } from '../lib/region';

import distance from '@turf/distance';
import * as turf from '@turf/helpers';
import { LineCanvas } from '@nivo/line';

function formatBikeLeg(bikeLeg, i) {
  return {
    id: `bike${i}`,
    color: BIKEHOPPER_THEME_COLOR,
    ...bikeLeg,
  };
}

function formatPTLeg(ptLeg, i) {
  return {
    id: `pt${i}`,
    ...ptLeg,
  };
}

function range(start, stop, step) {
  if (typeof stop == 'undefined') {
    // one param defined
    stop = start;
    start = 0;
  }

  if (typeof step == 'undefined') {
    step = 1;
  }

  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return [];
  }

  var result = [];
  for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i);
  }

  return result;
}

export default function ItineraryElevationProfile(props) {
  const { route } = props;

  const legs = [];
  const ptLegs = [];
  let ptLegWithoutHeight = [];
  let currentDist = 0;
  let currentPoint = route.legs[0].geometry.coordinates[0];
  let maxHeight = 0;
  let minHeight = 0;
  let minHeightChanged = false;
  let bikeDist = 0;
  let longestBikeDist = 0;
  let longestBikeIdx = -1;
  let currPTLeg = { data: [] };
  let currBikeLeg = { data: [] };
  for (let i = 0; i < route.legs.length; i++) {
    const leg = route.legs[i];
    for (let j = 0; j < leg.geometry.coordinates.length; j++) {
      const point = leg.geometry.coordinates[j];
      const dist = distance(turf.point(currentPoint), turf.point(point), {
        units: 'miles',
      });
      currentDist += dist;
      currentPoint = point;
      if (point.length === 3) {
        const pointHeight = currentPoint[2] / 0.3048;
        currBikeLeg.data.push({ x: currentDist, y: pointHeight });
        if (pointHeight > maxHeight) {
          maxHeight = pointHeight;
        }
        if (pointHeight < minHeight) {
          minHeight = pointHeight;
          minHeightChanged = true;
        }
        if (
          j === leg.geometry.coordinates.length - 1 &&
          i < route.legs.length - 1 &&
          route.legs[i + 1].type === 'pt'
        ) {
          currPTLeg.data.push({
            x: currentDist,
            y: pointHeight,
            type: 'start',
          });
        }
        if (j === 0 && i > 0 && route.legs[i - 1].type === 'pt') {
          currPTLeg.data.push({ x: currentDist, y: pointHeight, type: 'end' });
          ptLegs.push(currPTLeg);
          legs.push(formatPTLeg(currPTLeg, i));
          currPTLeg = { data: [] };
          // Check if we have any transit legs without a start/end height
          if (ptLegWithoutHeight.length) {
            const startHeight = ptLegs[ptLegWithoutHeight[0]].data[0].y;
            const heightDiff = pointHeight - startHeight;
            for (let k = 0; k < ptLegWithoutHeight.length; k++) {
              const frac = (k + 1) / (ptLegWithoutHeight.length + 1);
              ptLegs[ptLegWithoutHeight[k]].data[1].y =
                startHeight + frac * heightDiff;
              ptLegs[ptLegWithoutHeight[k] + 1].data[0].y =
                startHeight + frac * heightDiff;
            }
            ptLegWithoutHeight = [];
          }
        }
      } else {
        // Sometimes two transit legs are next to each other without a bike leg in between
        if (
          j === leg.geometry.coordinates.length - 1 &&
          i < route.legs.length - 1 &&
          route.legs[i + 1].type === 'pt'
        ) {
          currPTLeg.data.push({ x: currentDist, y: null, type: 'end' });
          ptLegs.push(currPTLeg);
          legs.push(formatPTLeg(currPTLeg, i));
          currPTLeg = { data: [] };
          ptLegWithoutHeight.push(ptLegs.length - 1);
        }
        if (j === 0 && i > 0 && route.legs[i - 1].type === 'pt') {
          currPTLeg.data.push({ x: currentDist, y: null, type: 'start' });
        }
      }
      if (j === 0 && leg.type === 'pt') {
        const color = leg.route_color ?? DEFAULT_PT_COLOR;
        currPTLeg['color'] = color;
        currPTLeg['label'] = leg.route_name;
        currPTLeg['name'] = leg.trip_id;
      }
    }
    if (leg.type === 'bike2') {
      const endX = currBikeLeg.data[currBikeLeg.data.length - 1].x;
      const startX = currBikeLeg.data[0].x;
      const bikeLegDist = endX - startX;
      bikeDist += bikeLegDist;
      currBikeLeg['dist'] = bikeLegDist;
      if (bikeLegDist > longestBikeDist) {
        longestBikeIdx = i;
        longestBikeDist = bikeLegDist;
      }
      legs.push(formatBikeLeg(currBikeLeg, i));
      currBikeLeg = { data: [] };
    }
  }

  const yScale = {
    type: 'linear',
    min: minHeightChanged ? minHeight - 5 : 0,
    max: maxHeight + 5,
  };

  const axisLeft = {
    legend: 'Feet',
    legendPosition: 'middle',
    legendOffset: -40,
  };

  const defaultMargin = {
    top: 50,
    bottom: 50,
  };

  const chartHeight = 400;
  const totalWidth = 800;
  const ptWidthFrac = 0.1;
  const endMargin = 50;

  const bikeWidth =
    (totalWidth - 2 * endMargin) * (1 - ptLegs.length * ptWidthFrac);
  const bikePixelsPerDist = bikeWidth / bikeDist;

  return (
    <div style={{ display: 'flex' }}>
      {legs.map((leg, i) => {
        const startX = leg.data[0].x;
        const endX = leg.data[leg.data.length - 1].x;
        const xScale = {
          type: 'linear',
          min: startX,
          max: endX,
        };
        if (leg.id.startsWith('bike')) {
          let tickValues = [];
          if (leg.dist * bikePixelsPerDist > 25) {
            const step =
              bikePixelsPerDist < 7 ? 5 : bikePixelsPerDist < 15 ? 2 : 1;
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
            if (
              (lastTick - tickValues[tickValues.length - 1]) *
                bikePixelsPerDist >
              17
            ) {
              tickValues.push(lastTick);
            }
          }
          const legWidth = leg.dist * bikePixelsPerDist;
          const axisBottom =
            i === longestBikeIdx
              ? {
                  tickValues,
                  legend: 'Miles',
                  legendPosition: 'middle',
                  legendOffset: 30,
                }
              : { tickValues };
          let margin = defaultMargin;
          let width = legWidth;
          if (i === 0) {
            margin = {
              left: endMargin,
              ...defaultMargin,
            };
            width += endMargin;
          } else if (i === legs.length - 1) {
            margin = {
              right: endMargin,
              ...defaultMargin,
            };
            width += endMargin;
          }
          return (
            <LineCanvas
              data={[leg]}
              width={width}
              height={chartHeight}
              xScale={xScale}
              yScale={yScale}
              colors={(d) => d.color}
              pointSize={0}
              enableArea={true}
              axisLeft={i === 0 ? axisLeft : null}
              axisBottom={axisBottom}
              gridXValues={tickValues}
              margin={margin}
              isInteractive={false}
            />
          );
        } else {
          const axisTop = {
            legend: leg.label,
            legendPosition: 'middle',
            tickValues: [],
          };
          const roundedDist = Math.ceil((endX - startX) * 10) / 10;
          const axisBottom = {
            legend: `${roundedDist} mile${roundedDist === 1 ? '' : 's'}`,
            legendPosition: 'middle',
            legendOffset: 10,
            tickValues: [],
          };
          return (
            <LineCanvas
              data={[leg]}
              width={totalWidth * ptWidthFrac}
              height={chartHeight}
              xScale={xScale}
              yScale={yScale}
              enableGridX={false}
              colors={(d) => d.color}
              pointSize={0}
              axisLeft={null}
              axisTop={axisTop}
              axisBottom={axisBottom}
              enableArea={true}
              isInteractive={false}
              margin={defaultMargin}
            />
          );
        }
      })}
    </div>
  );
}

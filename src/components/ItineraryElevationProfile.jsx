import * as React from 'react';

import './ItineraryElevationProfile.css';

import { BIKEHOPPER_THEME_COLOR, DEFAULT_PT_COLOR } from '../lib/colors';

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

export default function ItineraryElevationProfile(props) {
  const { route } = props;

  const legs = [];
  const ptLegs = [];
  let ptLegWithoutHeight = [];
  let currentDist = 0;
  let currentPoint = route.legs[0].geometry.coordinates[0];
  let maxHeight = 0;
  let minHeight = 0;
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
          legs.push(formatPTLeg(currPTLeg));
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
          legs.push(formatPTLeg(currPTLeg));
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
      legs.push(formatBikeLeg(currBikeLeg, i));
      currBikeLeg = { data: [] };
    }
  }

  const yScale = {
    type: 'linear',
    min: minHeight - 5,
    max: maxHeight + 5,
  };

  const axisLeft = {
    legend: 'Feet',
    legendPosition: 'middle',
    legendOffset: -40,
    tickSize: 0,
    tickPadding: 4,
  };

  const axisBottom = {
    legend: 'Miles',
    legendPosition: 'middle',
    legendOffset: 20,
    tickSize: 0,
    tickPadding: 4,
  };

  const margin = {
    top: 50,
    bottom: 50,
  };

  return (
    <div style={{ display: 'flex' }}>
      {legs.map((leg, i) => {
        const xScale = {
          type: 'linear',
          min: leg.data[0].x,
          max: leg.data[leg.data.length - 1].x,
        };
        if (leg.id.startsWith('bike')) {
          return (
            <LineCanvas
              data={[leg]}
              width={300}
              height={400}
              xScale={xScale}
              yScale={yScale}
              colors={(d) => d.color}
              pointSize={0}
              enableArea={true}
              axisLeft={i === 0 ? axisLeft : null}
              axisBottom={axisBottom}
              margin={i === 0 ? { left: 50, ...margin } : margin}
              isInteractive={false}
            />
          );
        } else {
          return (
            <LineCanvas
              data={[leg]}
              width={100}
              height={400}
              xScale={xScale}
              yScale={yScale}
              enableGridX={false}
              colors={(d) => d.color}
              pointSize={0}
              axisLeft={null}
              axisBottom={null}
              enableArea={true}
              isInteractive={false}
              margin={margin}
            />
          );
        }
      })}
    </div>
  );
}

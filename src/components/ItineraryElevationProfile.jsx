import * as React from 'react';

import './ItineraryElevationProfile.css';

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import AnnotationPlugin from 'chartjs-plugin-annotation';
import { Scatter } from 'react-chartjs-2';

import distance from '@turf/distance';
import * as turf from '@turf/helpers';

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
  AnnotationPlugin,
);

export default function ItineraryElevationProfile(props) {
  const { route } = props;

  const points = [];
  const ptLegs = [];
  let ptLegWithoutHeight = [];
  let currentDist = 0;
  let currentPoint = route.legs[0].geometry.coordinates[0];
  let maxHeight = 0;
  let currPTLeg = { data: [] };
  console.log(route);
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
        points.push({ x: currentDist, y: pointHeight });
        if (pointHeight > maxHeight) {
          maxHeight = pointHeight;
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
          currPTLeg = { data: [] };
          ptLegWithoutHeight.push(ptLegs.length - 1);
        }
        if (j === 0 && i > 0 && route.legs[i - 1].type === 'pt') {
          currPTLeg.data.push({ x: currentDist, y: null, type: 'start' });
        }
        points.push({ x: currentDist, y: null });
      }
      if (j === 0 && leg.type === 'pt') {
        currPTLeg['backgroundColor'] = leg.route_color;
        currPTLeg['label'] = leg.route_name;
        currPTLeg['name'] = leg.trip_id;
        currPTLeg['showLine'] = true;
        currPTLeg['fill'] = true;
      }
    }
  }

  const annotations = {};
  const datasets = [
    {
      fill: true,
      label: 'Elevation',
      data: points,
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
      showLine: true,
    },
  ];
  for (const ptLeg of ptLegs) {
    annotations[ptLeg.name] = {
      type: 'label',
      content: ptLeg.label,
      xValue: (ptLeg.data[0].x + ptLeg.data[1].x) / 2,
      yValue: (ptLeg.data[0].y + ptLeg.data[1].y) / 2,
      backgroundColor: 'rgba(245,245,245)',
    };
    datasets.push(ptLeg);
  }

  const options = {
    elements: {
      point: {
        radius: 0,
      },
    },
    scales: {
      x: {
        min: 0,
        max: points[points.length - 1].x,
        ticks: {
          stepSize: 1,
        },
      },
      y: {
        min: 0,
        max: maxHeight + 5,
        ticks: {
          stepSize: 10,
        },
      },
    },
    plugins: {
      tooltip: {
        enabled: false,
      },
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Elevation',
      },
      annotation: { annotations },
    },
  };

  const data = {
    datasets,
  };

  return <Scatter options={options} data={data} />;
}

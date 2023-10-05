import * as React from 'react';

import './ItineraryElevationProfile.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

import distance from '@turf/distance';
import * as turf from '@turf/helpers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

export default function ItineraryElevationProfile(props) {
  const { route } = props;

  const points = [];
  let currentDist = 0;
  let currentPoint = route.legs[0].geometry.coordinates[0];
  let maxHeight = 0;
  for (const leg of route.legs) {
    for (const point of leg.geometry.coordinates) {
      const dist = distance(turf.point(currentPoint), turf.point(point));
      currentDist += dist;
      currentPoint = point;
      if (point.length === 3) {
        points.push({ x: currentDist, y: currentPoint[2] });
        if (currentPoint[2] > maxHeight) {
          maxHeight = currentPoint[2];
        }
      } else {
        points.push({ x: currentDist, y: null });
      }
    }
  }

  console.log(points);

  const options = {
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
        max: maxHeight + 2,
        ticks: {
          stepSize: 10,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Elevation',
      },
    },
  };

  const data = {
    datasets: [
      {
        fill: true,
        label: 'Elevation',
        data: points,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        showLine: true,
      },
    ],
  };

  return <Scatter options={options} data={data} />;
}

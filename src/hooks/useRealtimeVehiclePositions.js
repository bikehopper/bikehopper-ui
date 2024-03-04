import { useState, useEffect } from 'react';
import { transit_realtime } from '../lib/realtime-feed/FeedMessage';
import { featureCollection, point } from '@turf/helpers';
import { EMPTY_GEOJSON } from '../lib/geometry';

export function useRealtimeVehiclePositions() {
  const [features, setFeatures] = useState(EMPTY_GEOJSON);
  const fetchData = () => {
    return fetch(import.meta.env.VITE_GTFS_RT_URL).then((response) => {
      return response.arrayBuffer();
    }).then((buffer) => {
      const decoded = transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
      const points = decoded.entity.map((feedEntity) => {
        const pos = feedEntity.vehicle.position;
        return point([pos.longitude, pos.latitude]);
      });
      const collection = featureCollection(points);
      setFeatures(collection);

      return true;
    }).catch((err) => {
      console.warn('Fetching realtime routes failed', err);
    });
  };

  useEffect(() => {
    let interval = null;

    const startTimeout = () => {
      fetchData().then(() => {
        interval = setTimeout(startTimeout, 60000);
      });
    };

    startTimeout();
    return () => {if (interval != null) clearTimeout(interval)};
  });

  return features;
}
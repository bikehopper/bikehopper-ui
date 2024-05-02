import { useState, useEffect, useRef } from 'react';
import { transit_realtime } from '../lib/realtime-feed/FeedMessage';
import { featureCollection, point } from '@turf/helpers';
import { EMPTY_GEOJSON } from '../lib/geometry';
import { getApiPath } from '../lib/BikehopperClient';

function usePollingEffect(
  asyncCallback,
  dependencies = [],
  { 
    interval = 60000, // 10 seconds,
    onCleanUp = () => {}
  } = {},
) {
  const timeoutIdRef = useRef(null)
  useEffect(() => {
    let _stopped = false
    // Side note: preceding semicolon needed for IIFEs.
    ;(async function pollingCallback() {
      try {
        await asyncCallback()
      } finally {
        // Set timeout after it finished, unless stopped
        timeoutIdRef.current = !_stopped && setTimeout(
          pollingCallback,
          interval
        )
      }
    })()
    // Clean up if dependencies change
    return () => {
      _stopped = true // prevent racing conditions
      clearTimeout(timeoutIdRef.current)
      onCleanUp()
    }
  }, [...dependencies, interval])
}

export function useRealtimeVehiclePositions() {
  const [features, setFeatures] = useState(EMPTY_GEOJSON);
  const fetchData = () => {
    return fetch(`${getApiPath()}/api/v1/realtime/vehiclepositions`).then((response) => {
      return response.arrayBuffer();
    }).then((buffer) => {
      const decoded = transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
      const points = decoded.entity.map((feedEntity) => {
        const pos = feedEntity.vehicle.position;
        const routeId = feedEntity.vehicle?.trip?.routeId;
        const routeIdArr = routeId?.split(':') || [];

        const agencyId = routeIdArr[0];
        const routeName = routeIdArr[1];

        return point([pos.longitude, pos.latitude], {
          agencyId, routeName, routeId
        });
      });
      const collection = featureCollection(points);
      setFeatures(collection);

      return true;
    }).catch((err) => {
      console.warn('Fetching realtime routes failed', err);
    });
  };

  usePollingEffect(fetchData);

  return features;
}
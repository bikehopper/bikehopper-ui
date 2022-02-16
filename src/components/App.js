import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  useSearchParams,
} from 'react-router-dom';
import { geocode, getRoute } from '../lib/BikehopperClient';
import BikehopperMap from './BikehopperMap';
import SearchBar from './SearchBar';

function stringToCoordinate(s) {
  if (!s || !s.length) return;
  if (!s.match(/^\s*-?\d*\.\d*\s*,\s*-?\d*\.\d*\s*$/)) return;
  // Looks like we were given a lon-lat pair, e.g. -122.4, 37.8
  let point = s.split(',')?.slice(0, 2)?.map(part => part.trim());

  if (!point || !point.length) return;

  for (const i in point) {
    if (isNaN(Number(point[i]))) return;
    point[i] = Number(point[i]);
  }
  return point;
}

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [startPoint, setStartPoint] = useState(stringToCoordinate(searchParams.get('start')) || null);
  const [endPoint, setEndPoint] = useState(stringToCoordinate(searchParams.get('end')) || null);
  const [route, setRoute] = useState(null);

  const _handleGeocodeSearch = async (searchString) => {
    const maybePoint = stringToCoordinate(searchString);
    if (maybePoint) return maybePoint;
    const opts = {
      // XXX oops, I want to use the viewport of the map here, but I put that state in
      // a subcomponent...
      lon: -122.4,
      lat: 37.8,
    };
    return geocode(searchString, opts).then(result => {
      if (result.type !== 'FeatureCollection' || result.features[0].geometry.type !== 'Point') {
        // TODO: show error message (or maybe try to use results that are not points, somehow)
        console.error(`geocode returned something other than a Point or FeatureCollection`);
        return;
      }
      return result.features[0].geometry.coordinates;
    });
  }
  const handleSearch = async ({ start, end }) => {
    await _handleGeocodeSearch(start).then(p => p && setStartPoint(p));
    await _handleGeocodeSearch(end).then(p => p && setEndPoint(p));
  };

  const fetchRoute = () => {
    if (!startPoint || !endPoint) {
      if (route) setRoute(null);
    } else {
      // Don't fetch the same route again if we already have a route for this pair of points.
      if (route && route.startPoint === startPoint && route.endPoint === endPoint)
        return;

      // XXX confusing that getRoute and setRoute sound symmetrical but are instead
      // an API call and a component state setter respectively; improve names somehow
      getRoute({
        points: [startPoint, endPoint].map(crd => crd.slice(0, 2).reverse()),
        optimize: true,
        pointsEncoded: false,
      })
        .then(fetchedRoute => {
          if (!fetchedRoute) return;
          setRoute({
            paths: fetchedRoute.paths,
            startPoint,
            endPoint,
          });
        });
    }
  };

  useEffect(fetchRoute, [startPoint, endPoint, route]);
  useEffect(() => {
    setSearchParams({ start: startPoint && startPoint.join(','), end: endPoint && endPoint.join(',') }, { replace: true })
  }, [startPoint, endPoint]);

  return (
    <div>
      <SearchBar onSubmit={handleSearch} position='absolute' />
      <BikehopperMap
        startPoint={startPoint}
        endPoint={endPoint}
        route={route}
        onStartPointDrag={({ lngLat }) => setStartPoint(lngLat)}
        onEndPointDrag={({ lngLat }) => setEndPoint(lngLat)}
      />
    </div>
  );
}

export default App;

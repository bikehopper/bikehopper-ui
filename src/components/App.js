import * as React from 'react';
import { useState, useEffect } from 'react';
import * as BikehopperClient from '../lib/BikehopperClient';
import BikehopperMap from './BikehopperMap';
import SearchBar from './SearchBar';
import parseLngLatString from '../lib/parseLngLatString';

import './App.css';

function App() {
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [route, setRoute] = useState(null);

  const _handleGeocodeSearch = async (searchString) => {
    const maybePoint = parseLngLatString(searchString);
    if (maybePoint) return maybePoint;
    const opts = {
      // XXX oops, I want to use the viewport of the map here, but I put that state in
      // a subcomponent...
      lon: -122.4,
      lat: 37.8,
    };
    const result = await BikehopperClient.geocode(searchString, opts);
    if (
      result.type !== 'FeatureCollection' ||
      !result.features?.length ||
      result.features[0].geometry.type !== 'Point'
    ) {
      // TODO: show error message (or maybe try to use results that are not points, somehow)
      console.error(
        `geocode returned something other than a Point or FeatureCollection`,
      );
      return;
    }
    return result.features[0].geometry.coordinates;
  };
  const handleSearch = async ({ start, end }) => {
    const geocodeStartPromise = _handleGeocodeSearch(start);
    const geocodeEndPromise = _handleGeocodeSearch(end);

    const geocodeResultsRaw = await Promise.allSettled([
      geocodeStartPromise,
      geocodeEndPromise,
    ]);
    const results = geocodeResultsRaw
      .filter(({ status }) => status === 'fulfilled')
      .map(({ value }) => value);

    await Promise.all([setStartPoint(results[0]), setEndPoint(results[1])]);
  };

  const lngLatToCoords = (lngLat) => [lngLat.lng, lngLat.lat];
  const handleStartPointDrag = (evt) =>
    setStartPoint(lngLatToCoords(evt.lngLat));
  const handleEndPointDrag = (evt) => setEndPoint(lngLatToCoords(evt.lngLat));

  const updateRoute = () => {
    if (!startPoint || !endPoint) {
      if (route) setRoute(null);
    } else {
      // Don't fetch the same route again if we already have a route for this pair of points.
      if (
        route &&
        route.startPoint === startPoint &&
        route.endPoint === endPoint
      )
        return;

      BikehopperClient.fetchRoute({
        points: [startPoint, endPoint].map((crd) => crd.slice(0, 2).reverse()),
        optimize: true,
        pointsEncoded: false,
      }).then((fetchedRoute) => {
        const paths = fetchedRoute?.paths.length ? fetchedRoute.paths : null;
        setRoute({
          paths,
          startPoint,
          endPoint,
        });
      });
    }
  };

  useEffect(updateRoute, [startPoint, endPoint, route]);

  return (
    <div className="App">
      <SearchBar onSubmit={handleSearch} />
      <BikehopperMap
        startPoint={startPoint}
        endPoint={endPoint}
        route={route}
        onStartPointDrag={handleStartPointDrag}
        onEndPointDrag={handleEndPointDrag}
      />
    </div>
  );
}

export default App;

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import * as BikehopperClient from '../lib/BikehopperClient';
import BikehopperMap from './BikehopperMap';
import SearchBar from './SearchBar';

import './App.css';

function App() {
  const storeState = useSelector((state) => state);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [route, setRoute] = useState(null);

  const handleStartPointDrag = (evt) => {
    // TODO: Restore dragging support
    //setStartPoint(lngLatToCoords(evt.lngLat));
  };
  const handleEndPointDrag = (evt) => {
    // TODO: Restore dragging support
    //setEndPoint(lngLatToCoords(evt.lngLat));
  };

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
      <SearchBar />
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

import * as React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import BikehopperMap from './BikehopperMap';
import SearchBar from './SearchBar';

import './App.css';

function App() {
  const { startPoint, endPoint, routes } = useSelector(
    (state) => ({
      startPoint: state.locations.startPoint,
      endPoint: state.locations.endPoint,
      routes: state.routes.routes,
    }),
    shallowEqual,
  );

  const handleStartPointDrag = (evt) => {
    // TODO: Restore dragging support
    //setStartPoint(lngLatToCoords(evt.lngLat));
  };
  const handleEndPointDrag = (evt) => {
    // TODO: Restore dragging support
    //setEndPoint(lngLatToCoords(evt.lngLat));
  };

  // TODO improve the naming/structure of BikehopperMap props to avoid this
  // conversion layer. Doing this to prevent conflicts as others work in
  // BikehopperMap.
  const routeForBikehopperMap = { paths: routes };
  const startPointForBikehopperMap = startPoint?.geometry.coordinates;
  const endPointForBikehopperMap = endPoint?.geometry.coordinates;

  return (
    <div className="App">
      <SearchBar />
      <BikehopperMap
        startPoint={startPointForBikehopperMap}
        endPoint={endPointForBikehopperMap}
        route={routeForBikehopperMap}
        onStartPointDrag={handleStartPointDrag}
        onEndPointDrag={handleEndPointDrag}
      />
    </div>
  );
}

export default App;

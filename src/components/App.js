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

  return (
    <div className="App">
      <SearchBar />
      <BikehopperMap
        startCoords={startPoint?.geometry.coordinates}
        endCoords={endPoint?.geometry.coordinates}
        routes={routes}
        onStartPointDrag={handleStartPointDrag}
        onEndPointDrag={handleEndPointDrag}
      />
    </div>
  );
}

export default App;

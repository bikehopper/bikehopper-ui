import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import BikehopperMap from './BikehopperMap';
import BottomPane from './BottomPane';
import DirectionsNullState from './DirectionsNullState';
import RoutesOverview from './RoutesOverview';
import TopBar from './TopBar';
import { locationInputFocused } from '../features/locations';

import './App.css';

function App() {
  const { hasRoutes, hasLocations, isEditingLocations } = useSelector(
    (state) => ({
      hasLocations: !!(state.locations.start || state.locations.end),
      hasRoutes: !!state.routes.routes,
      isEditingLocations: state.locations.editingLocation != null,
    }),
    shallowEqual,
  );

  const dispatch = useDispatch();

  const handleBottomInputFocus = (evt) => {
    dispatch(locationInputFocused('end'));
  };

  let bottomContent;
  if (hasRoutes) {
    bottomContent = <RoutesOverview />;
  } else if (!hasLocations && !isEditingLocations) {
    bottomContent = (
      <DirectionsNullState onInputFocus={handleBottomInputFocus} />
    );
  }

  return (
    <div className="App">
      <TopBar
        showSearchBar={isEditingLocations || hasLocations || hasRoutes}
        showDirectionsLabel={isEditingLocations}
      />
      <BikehopperMap />
      {bottomContent && <BottomPane>{bottomContent}</BottomPane>}
    </div>
  );
}

export default App;

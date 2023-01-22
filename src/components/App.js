import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { IntlProvider } from 'react-intl';
import AlertBar from './AlertBar';
import DirectionsNullState from './DirectionsNullState';
import MapPlusOverlay from './MapPlusOverlay';
import Routes from './Routes';
import SearchAutocompleteDropdown from './SearchAutocompleteDropdown';
import TopBar from './TopBar';
import {
  LocationSourceType,
  enterDestinationFocused,
} from '../features/routeParams';

import './App.css';

function App(props) {
  const { hasRoutes, hasLocations, isEditingLocations } = useSelector(
    (state) => ({
      hasLocations: !!(
        state.routeParams.end ||
        (state.routeParams.start &&
          state.routeParams.start.source !== LocationSourceType.UserGeolocation)
      ),
      hasRoutes: !!state.routes.routes,
      isEditingLocations: state.routeParams.editingLocation != null,
    }),
    shallowEqual,
  );

  const dispatch = useDispatch();

  const handleBottomInputFocus = (evt) => {
    // Scroll up to counteract iOS Safari scrolling down towards the input.
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    evt.preventDefault();
    dispatch(enterDestinationFocused());
  };

  let bottomContent;
  if (isEditingLocations) {
    bottomContent = <SearchAutocompleteDropdown />;
  } else if (hasRoutes) {
    bottomContent = <Routes />;
  } else if (!hasLocations) {
    bottomContent = (
      <DirectionsNullState onInputFocus={handleBottomInputFocus} />
    );
  }

  const topBar = (
    <TopBar
      showSearchBar={isEditingLocations || hasLocations || hasRoutes}
      initiallyFocusDestination={isEditingLocations}
    />
  );

  return (
    <IntlProvider messages={props.messages} locale="en" defaultLocale="en">
      <div className="App">
        <AlertBar />
        <MapPlusOverlay
          topContent={topBar}
          hideMap={isEditingLocations}
          bottomContent={bottomContent}
        />
      </div>
    </IntlProvider>
  );
}

export default App;

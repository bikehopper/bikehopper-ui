import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { Transition } from '@headlessui/react';
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
  const { hasRoutes, hasLocations, isEditingLocations, viewingDetails } =
    useSelector(
      (state) => ({
        hasLocations: !!(
          state.routeParams.end ||
          (state.routeParams.start &&
            state.routeParams.start.source !==
              LocationSourceType.UserGeolocation)
        ),
        hasRoutes: !!state.routes.routes,
        isEditingLocations: state.routeParams.editingLocation != null,
        viewingDetails: state.routes.viewingDetails,
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
    <Transition
      show={!viewingDetails}
      enter="transition-opacity ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <TopBar
        showSearchBar={isEditingLocations || hasLocations || hasRoutes}
        initiallyFocusDestination={isEditingLocations}
      />
    </Transition>
  );

  return (
    <IntlProvider
      messages={props.messages}
      locale={props.locale}
      defaultLocale="en"
      onError={import.meta.env.DEV ? handleDebugIntlError : () => {}}
    >
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

function handleDebugIntlError(err) {
  // By default, react-intl spams the console with "Missing message" errors when you're
  // developing. Suppress these.
  if (err.code === 'MISSING_TRANSLATION') {
    return;
  }
  // Print other errors.
  console.error(err);
}

export default App;

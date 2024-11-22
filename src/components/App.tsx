import { useState } from 'react';
import type { FocusEvent } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { IntlProvider } from 'react-intl';
import type { MessageFormatElement } from 'react-intl';
import type { OnErrorFn } from '@formatjs/intl';
import { Transition } from '@headlessui/react';
import { Provider as ToastProvider } from '@radix-ui/react-toast';

import DirectionsNullState from './DirectionsNullState';
import MapPlusOverlay from './MapPlusOverlay';
import DesktopMap from './DesktopMap';
import Routes from './Routes';
import SearchDropdown from './SearchDropdown';
import Toasts from './Toasts';
import TopBar from './TopBar';
import {
  LocationSourceType,
  enterDestinationFocused,
} from '../features/routeParams';
import { RootState } from '../store';

import './App.css';

type Props = {
  locale: string;
  messages: Record<string, MessageFormatElement[]>;
};

function App(props: Props) {
  const { hasRoutes, hasLocations, editingLocation, viewingDetails } =
    useSelector(
      (state: RootState) => ({
        hasLocations: !!(
          state.routeParams.end ||
          (state.routeParams.start &&
            state.routeParams.start.source !==
              LocationSourceType.UserGeolocation)
        ),
        hasRoutes: !!state.routes.routes,
        editingLocation: state.routeParams.editingLocation,
        viewingDetails: state.routes.viewingDetails,
      }),
      shallowEqual,
    );
  const isEditingLocations = editingLocation != null;

  const dispatch = useDispatch();

  const handleBottomInputFocus = (evt: FocusEvent) => {
    // Scroll up to counteract iOS Safari scrolling down towards the input.
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    evt.preventDefault();
    dispatch(enterDestinationFocused());
  };

  const isMobile = window.innerWidth < 750;

  const bottomContent = isEditingLocations ? (
    <SearchDropdown startOrEnd={editingLocation} />
  ) : hasRoutes ? (
    <Routes />
  ) : hasLocations ? undefined : (
    <DirectionsNullState onInputFocus={handleBottomInputFocus} />
  );

  const shouldDisplayTopBar = !viewingDetails;
  const [haveTopBarIncludingFade, setHaveTopBarIncludingFade] =
    useState(shouldDisplayTopBar);

  const topBar = (
    <Transition
      as="div"
      show={shouldDisplayTopBar}
      enter="transition-opacity ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      beforeEnter={() => setHaveTopBarIncludingFade(true)}
      afterLeave={() => setHaveTopBarIncludingFade(false)}
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
      <ToastProvider>
        <div className="App">
          {isMobile ? (
            <MapPlusOverlay
              topContent={topBar}
              topBarEmpty={
                /* prop change forces controls to move */
                !haveTopBarIncludingFade
              }
              hideMap={isEditingLocations}
              bottomContent={bottomContent}
            />
          ) : (
            <DesktopMap sidebar={bottomContent} />
          )}

          <Toasts />
        </div>
      </ToastProvider>
    </IntlProvider>
  );
}

const handleDebugIntlError: OnErrorFn = (err) => {
  // By default, react-intl spams the console with "Missing message" errors when you're
  // developing. Suppress these.
  if (err.code === 'MISSING_TRANSLATION') {
    return;
  }
  // Print other errors.
  console.error(err);
};

export default App;

import * as React from 'react';
import { ReactComponent as MagnifyingGlass } from 'iconoir/icons/search.svg';
import Icon from './Icon';

import './DirectionsNullState.css';

export default function DirectionsNullState(props) {
  // The <input> rendered here is fake: its only function is to get focused and then
  // switch to a different UI that has the real input box.

  return (
    <div className="DirectionsNullState">
      <h2 className="DirectionsNullState_header">Get directions</h2>
      <span className="DirectionsNullState_inputContainer">
        <Icon className="DirectionsNullState_inputIcon">
          <MagnifyingGlass />
        </Icon>
        <input
          aria-label="Destination"
          className="DirectionsNullState_input"
          placeholder="Enter a destination"
          onFocus={props.onInputFocus}
        />
      </span>
      <p className="DirectionsNullState_para">
        <strong>Welcome to BikeHopper!</strong> This is a new bike navigation
        app that suggests ways to combine biking and transit, expanding your
        options for getting around without a car.
      </p>
      <p className="DirectionsNullState_para">
        Get started by entering a destination and starting point above, or tap
        the "find my location" button in the top right corner of the map to get
        directions from your current location.
      </p>
      <p className="DirectionsNullState_para DirectionsNullState_wideScreenOnly">
        In this early beta, BikeHopper is{' '}
        <strong>designed for phone screens</strong>, so it might look strange on
        your computer.
      </p>
      <p className="DirectionsNullState_para">
        Let us know what you think by reporting bugs, routes that could be
        better, and other feedback in{' '}
        <a href="https://forms.gle/ggVFjztFN6ivLEAu9" target="_blank">
          this form
        </a>
        !
      </p>
    </div>
  );
}

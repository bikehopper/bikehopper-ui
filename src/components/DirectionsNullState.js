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
    </div>
  );
}

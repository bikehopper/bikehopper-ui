import * as React from 'react';
import classnames from 'classnames';

import './Icon.css';

// Usage:
// import {ReactComponent as Blah} from 'iconoir/icons/blah.svg';
// <Icon><Blah /></Icon>
//
// For accessibility you should do one of:
//   1. Pass a label prop:
//     <Icon label="Bike"><Bicycle /></Icon>
//   2. Put an aria-label on the parent element:
//     <span aria-label="Bike"><Icon><Bicycle /></Icon></span>
//   3. If the icon is purely decorative because there's also
//      equivalent text next to it, do nothing.
//     <p><Icon><Bicycle /></Icon>Ride a bike for 2 minutes</p>

export default function Icon(props) {
  return (
    <span
      aria-hidden={!props.label}
      aria-label={props.label}
      className={classnames({
        Icon: true,
        Icon_flipHorizontally: props.flipHorizontally,
        [props.className]: !!props.className,
      })}
      onClick={props.onClick}
    >
      {props.children}
    </span>
  );
}

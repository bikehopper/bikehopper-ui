import * as React from 'react';
import classnames from 'classnames';

import './Icon.css';

// Usage:
// import {ReactComponent as Blah} from 'iconoir/icons/blah.svg';
// <Icon><Blah /></Icon>
// For accessibility put an aria-label="..." attribute on the parent element

export default function Icon(props) {
  return (
    <span
      aria-hidden="true"
      className={classnames({
        Icon: true,
        Icon_flipHorizontally: props.flipHorizontally,
        [props.className]: !!props.className,
      })}
    >
      {props.children}
    </span>
  );
}

import * as React from 'react';

import './Icon.css';

// Usage:
// import {ReactComponent as Blah} from 'iconoir/icons/blah.svg';
// <Icon><Blah /></Icon>
// For accessibility put an aria-label="..." attribute on the parent element

export default function Icon(props) {
  const classes = 'Icon' + (props.className ? ' ' + props.className : '');
  return (
    <span aria-hidden="true" className={classes}>
      {props.children}
    </span>
  );
}

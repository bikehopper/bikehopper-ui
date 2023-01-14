import * as React from 'react';
import classnames from 'classnames';

import './SelectionListItem.css';

// This is only for clickable stuff! Do not use without an onClick

export default function SelectionListItem(props) {
  return (
    <li
      className={classnames({
        SelectionListItem: true,
        SelectionListItem__active: props.active,
      })}
    >
      <button
        onClick={props.onClick}
        className={classnames({
          SelectionListItem_button: true,
          [props.className]: !!props.className,
        })}
      >
        {props.children}
      </button>
    </li>
  );
}

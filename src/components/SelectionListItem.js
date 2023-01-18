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
        [props.className]: true,
      })}
    >
      <button
        onClick={props.onClick}
        className={classnames(
          'SelectionListItem_button',
          props.buttonClassName,
        )}
      >
        {props.children}
      </button>
    </li>
  );
}

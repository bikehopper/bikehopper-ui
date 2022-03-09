import * as React from 'react';
import classnames from 'classnames';

import './SelectionListItem.css';

export default function SelectionListItem(props) {
  return (
    <li
      className={classnames({
        SelectionListItem: true,
        SelectionListItem_active: props.active,
        SelectionListItem_clickable: !!props.onClick,
        [props.className]: !!props.className,
      })}
      onClick={props.onClick}
    >
      {props.children}
    </li>
  );
}

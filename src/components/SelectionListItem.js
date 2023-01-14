import * as React from 'react';
import classnames from 'classnames';

import './SelectionListItem.css';

export default function SelectionListItem(props) {
  const handleClick = (evt) => {
    evt.preventDefault();
    props.onClick(evt);
  };

  return (
    <li
      className={classnames({
        SelectionListItem: true,
        SelectionListItem_active: props.active,
      })}
    >
      <a
        href="#"
        onClick={handleClick}
        className={classnames({
          SelectionListItem_link: true,
          [props.className]: !!props.className,
        })}
        tabIndex={0}
      >
        {props.children}
      </a>
    </li>
  );
}

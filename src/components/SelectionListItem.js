import * as React from 'react';
import classnames from 'classnames';
import Icon from './Icon';

import { ReactComponent as CancelIcon } from 'iconoir/icons/cancel.svg';

import './SelectionListItem.css';

// This is only for clickable stuff! Do not use without an onClick.
// Optionally it can have an onRemoveClick in which case there will be an X-out.

export default function SelectionListItem({
  active,
  className,
  buttonClassName,
  onClick,
  children,
  onRemoveClick,
}) {
  return (
    <li
      className={classnames({
        SelectionListItem: true,
        SelectionListItem__active: active,
        [className]: true,
      })}
    >
      <button
        onClick={onClick}
        className={classnames({
          SelectionListItem_button: true,
          SelectionListItem_button__removable: !!onRemoveClick,
          [buttonClassName]: true,
        })}
      >
        {children}
      </button>
      {onRemoveClick && (
        <button onClick={onRemoveClick} className="SelectionListItem_remove">
          <Icon label="Remove" className="SelectionListItem_removeIcon">
            <CancelIcon width="20" height="20" />
          </Icon>
        </button>
      )}
    </li>
  );
}

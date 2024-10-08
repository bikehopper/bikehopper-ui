import { useIntl } from 'react-intl';
import classnames from 'classnames';
import Icon from './primitives/Icon';

import CancelIcon from 'iconoir/icons/xmark.svg?react';

import './SelectionListItem.css';

// This is only for clickable stuff! Do not use without an onClick.
// Optionally it can have an onRemoveClick in which case there will be an X-out.

export default function SelectionListItem({
  active = false,
  className = '',
  buttonClassName = '',
  onClick,
  onMouseDown,
  children,
  onRemoveClick,
  tabIndex,
}: {
  active?: boolean;
  className?: string;
  buttonClassName?: string;
  onClick: React.MouseEventHandler;
  onMouseDown?: React.MouseEventHandler;
  children: React.ReactNode;
  onRemoveClick?: React.MouseEventHandler;
  tabIndex?: number | null;
}) {
  const intl = useIntl();

  return (
    <li
      className={classnames({
        SelectionListItem: true,
        SelectionListItem__active: active,
        [className]: !!className,
      })}
    >
      <button
        onClick={onClick}
        onMouseDown={onMouseDown}
        className={classnames({
          SelectionListItem_button: true,
          SelectionListItem_button__removable: !!onRemoveClick,
          [buttonClassName]: !!buttonClassName,
        })}
        tabIndex={tabIndex != null ? tabIndex : undefined}
      >
        {children}
      </button>
      {onRemoveClick && (
        <button
          onClick={onRemoveClick}
          onMouseDown={onMouseDown}
          className="SelectionListItem_remove"
        >
          <Icon
            label={intl.formatMessage({
              defaultMessage: 'Remove',
              description: 'button to remove something from a list',
            })}
            className="SelectionListItem_removeIcon"
          >
            <CancelIcon width="20" height="20" />
          </Icon>
        </button>
      )}
    </li>
  );
}

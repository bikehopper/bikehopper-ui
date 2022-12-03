import * as React from 'react';
import classnames from 'classnames';

import './SelectionListItem.css';

export default function SelectionListItem(props) {
  const clickable = !!props.onClick;

  const handleClick = (evt) => {
    evt.preventDefault();
    props.onClick(evt);
  };

  /* eslint-disable jsx-a11y/anchor-is-valid */
  // (The fix for this rule is to make this a <button>, but then it's a huge
  // pain to remove all the default CSS.)
  const contents = props.onClick ? (
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
  ) : (
    props.children
  );

  return (
    <li
      className={classnames({
        SelectionListItem: true,
        SelectionListItem_active: props.active,
        SelectionListItem_hasLinkChild: clickable,
        [props.className]: !clickable && !!props.className,
      })}
    >
      {contents}
    </li>
  );
}

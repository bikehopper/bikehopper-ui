import classnames from 'classnames';

import './SelectionList.css';

// a styled list - children should be <SelectionListItem />s
export default function SelectionList(props) {
  return (
    <ul
      className={classnames({
        SelectionList: true,
        [props.className]: !!props.className,
      })}
    >
      {props.children}
    </ul>
  );
}

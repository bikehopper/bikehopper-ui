import classnames from 'classnames';

import './SelectionList.css';

// a styled list - children should be <SelectionListItem />s
export default function SelectionList({
  className = '',
  children,
  id = '',
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <ul
      className={classnames({
        SelectionList: true,
        [className]: !!className,
      })}
      id={id}
    >
      {children}
    </ul>
  );
}

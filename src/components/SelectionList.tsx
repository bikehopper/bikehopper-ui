import classnames from 'classnames';

import './SelectionList.css';

// a styled list - children should be <SelectionListItem />s
export default function SelectionList({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ul
      className={classnames({
        SelectionList: true,
        [className]: !!className,
      })}
    >
      {children}
    </ul>
  );
}

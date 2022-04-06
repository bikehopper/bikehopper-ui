import * as React from 'react';
import classnames from 'classnames';

import './BottomPane.css';

export default function BottomPane(props) {
  return (
    <div
      className={classnames({
        BottomPane: true,
        BottomPane__withoutMap: props.withoutMap,
      })}
    >
      {props.children}
    </div>
  );
}

import * as React from 'react';
import { DateTime } from 'luxon';

export default function DepartArriveTime(props) {
  const depart = DateTime.fromISO(props.depart).toLocaleString(
    DateTime.TIME_SIMPLE,
  );
  const arrive = DateTime.fromISO(props.arrive).toLocaleString(
    DateTime.TIME_SIMPLE,
  );

  return (
    <p className={props.className}>
      {depart}&ndash;{arrive}
    </p>
  );
}

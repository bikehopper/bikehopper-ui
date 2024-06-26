import classnames from 'classnames';
import type { ReactNode } from 'react';

// Usage:
// import Blah from 'iconoir/icons/blah.svg?react';
// <Icon><Blah /></Icon>
//
// For accessibility you should do one of:
//   1. Pass a label prop:
//     <Icon label="Bike"><Bicycle /></Icon>
//   2. Put an aria-label on the parent element:
//     <span aria-label="Bike"><Icon><Bicycle /></Icon></span>
//   3. If the icon is purely decorative because there's also
//      equivalent text next to it, do nothing.
//     <p><Icon><Bicycle /></Icon>Ride a bike for 2 minutes</p>

type Props = {
  className?: string;
  children?: ReactNode;
  flipHorizontally?: boolean;
  label?: string;
};

export default function Icon(props: Props) {
  return (
    <span
      aria-hidden={!props.label}
      aria-label={props.label}
      className={classnames({
        '-scale-x-100': props.flipHorizontally,
        [props.className || '']: !!props.className,
      })}
    >
      {props.children}
    </span>
  );
}

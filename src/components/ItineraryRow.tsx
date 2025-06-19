import classnames from 'classnames';
import type { ScrollToRef } from '../hooks/useScrollToRef';

export default function ItineraryRow({
  children,
  hideLine,
  rootRef,
}: {
  children: React.ReactNode[];
  hideLine?: boolean;
  rootRef?: ScrollToRef<HTMLDivElement> | undefined;
}) {
  return (
    <div className="m-0 flex flex-row" ref={rootRef}>
      <div
        className={classnames({
          'w-9 box-border shrink-0': true,
          'bg-[linear-gradient(to_right,rgba(0,0,0,0)_17px,rgba(187,187,187,1)_17px_19px,rgba(0,0,0,0)_17px_100%)]':
            !hideLine,
        })}
      >
        {children[0]}
      </div>
      <div className="grow flex flex-col justify-evenly pb-1">
        {children.slice(1)}
      </div>
    </div>
  );
}

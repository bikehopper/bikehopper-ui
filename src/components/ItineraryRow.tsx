import classNames from 'classnames';
import type { ScrollToRef } from '../hooks/useScrollToRef';

import './ItineraryRow.css';

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
    <div className="ItineraryRow" ref={rootRef}>
      <div
        className={classNames({
          ItineraryRow_timeline: true,
          ItineraryRow_timeline__hasLine: !hideLine,
        })}
      >
        {children[0]}
      </div>
      <div className="ItineraryRow_content">{children.slice(1)}</div>
    </div>
  );
}

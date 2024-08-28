import type { ScrollToRef } from '../hooks/useScrollToRef';

import './ItineraryRow.css';

export default function ItineraryRow(props: {
  rootRef?: ScrollToRef<HTMLDivElement> | undefined;
  children: React.ReactNode[];
}) {
  return (
    <div className="ItineraryRow" ref={props.rootRef}>
      <div className="ItineraryRow_timeline">{props.children[0]}</div>
      <div className="ItineraryRow_content">{props.children.slice(1)}</div>
    </div>
  );
}

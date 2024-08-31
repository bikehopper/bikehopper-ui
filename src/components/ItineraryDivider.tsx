import ItineraryRow from './ItineraryRow';

import './ItineraryDivider.css';

type Props = {
  detail: React.ReactNode;
};

export default function ItineraryDivider(props: Props) {
  const { detail } = props;

  return (
    <ItineraryRow>
      {'' /* no content for timeline side of row */}
      <span className="ItineraryDivider_horizontalRule">
        {detail && <span className="ItineraryDivider_detail">{detail}</span>}
      </span>
    </ItineraryRow>
  );
}

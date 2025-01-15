import { FormattedMessage } from 'react-intl';
import {
  GeocodeFailureType,
  geocodeTypedLocation,
} from '../features/geocoding';
import type { Dispatch } from '../store';
import BorderlessButton from './BorderlessButton';
import { useDispatch } from 'react-redux';

export default function SearchDropdownGeocodeError({
  failureType,
  inputText,
  startOrEnd,
}: {
  failureType: GeocodeFailureType;
  inputText: string;
  startOrEnd: 'start' | 'end';
}) {
  const dispatch: Dispatch = useDispatch();

  const handleRetryClick = () => {
    dispatch(
      geocodeTypedLocation(inputText, startOrEnd, {
        fromTextAutocomplete: true,
        isRetry: true,
      }),
    );
  };

  const retryLink = (
    <BorderlessButton
      onClick={handleRetryClick}
      className="text-blue-500 underline inline pointer-events-auto"
    >
      <FormattedMessage
        defaultMessage="Retry"
        description="Button. Retries a failed action"
      />
    </BorderlessButton>
  );

  return (
    <span className="text-sm">
      {failureType === GeocodeFailureType.NO_POINTS_FOUND ? (
        <FormattedMessage
          defaultMessage="Nothing found for ''{inputText}''"
          description="Message when no search results are found"
          values={{ inputText }}
        />
      ) : failureType === GeocodeFailureType.NETWORK_ERROR ? (
        <FormattedMessage
          defaultMessage="Unable to connect to server. {retryLink}"
          description={
            'Error message with a link to retry. ' + 'The link text is "Retry".'
          }
          values={{ retryLink }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="Server error. {retryLink}"
          description={
            'Error message with a link to retry. ' +
            'The link text is "Retry". The error means there is probably ' +
            'a problem on the server.'
          }
          values={{ retryLink }}
        />
      )}
    </span>
  );
}

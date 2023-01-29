import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ReactComponent as MagnifyingGlass } from 'iconoir/icons/search.svg';
import Icon from './Icon';
import { SUPPORTED_REGION_DISPLAY } from '../lib/region';

import './DirectionsNullState.css';

export default function DirectionsNullState(props) {
  const intl = useIntl();

  // The <input> rendered here is fake: its only function is to get focused and then
  // switch to a different UI that has the real input box.

  return (
    <div className="DirectionsNullState">
      <h2 className="DirectionsNullState_header">
        <FormattedMessage
          defaultMessage="Get directions"
          description="form header"
        />
      </h2>
      <span className="DirectionsNullState_inputContainer">
        <Icon className="DirectionsNullState_inputIcon">
          <MagnifyingGlass />
        </Icon>
        <input
          aria-label="Destination"
          className="DirectionsNullState_input"
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter a destination',
            description: 'input placeholder',
          })}
          onFocus={props.onInputFocus}
        />
      </span>
      <p className="DirectionsNullState_para">
        <FormattedMessage
          defaultMessage={
            '<strong>Welcome to BikeHopper!</strong> This is a new bike navigation' +
            ' app that suggests ways to combine biking and transit, expanding your' +
            ' options for getting around without a car.'
          }
          description="paragraph in welcome screen"
          values={{
            strong: (chunks) => <strong>{chunks}</strong>,
          }}
        />
      </p>
      <p className="DirectionsNullState_para">
        {SUPPORTED_REGION_DISPLAY && (
          <span>We support {SUPPORTED_REGION_DISPLAY}. </span>
        )}
        Get started by entering a destination above.
      </p>
      <p className="DirectionsNullState_para DirectionsNullState_wideScreenOnly">
        In this early beta, BikeHopper is{' '}
        <strong>designed for phone screens</strong>, so it might look strange on
        your computer.
      </p>
      <p className="DirectionsNullState_para">
        Let us know what you think by reporting bugs, routes that could be
        better, and other feedback in{' '}
        <a
          href="https://forms.gle/ggVFjztFN6ivLEAu9"
          target="_blank"
          rel="noreferrer"
        >
          this form
        </a>
        !
      </p>
      <p className="DirectionsNullState_para">
        BikeHopper is{' '}
        <a
          href="https://github.com/bikehopper/bikehopper-ui"
          target="_blank"
          rel="noreferrer"
        >
          open source
        </a>{' '}
        under the GNU Affero General Public License.
      </p>
    </div>
  );
}

import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ReactComponent as MagnifyingGlass } from 'iconoir/icons/search.svg';
import Icon from './Icon';
import { SupportedRegionText } from '../lib/region';

import './DirectionsNullState.css';

export default function DirectionsNullState(props) {
  const intl = useIntl();

  // The <input> rendered here is fake: its only function is to get focused and then
  // switch to a different UI that has the real input box.

  const strong = React.useCallback((jsx) => <strong>{jsx}</strong>, []);

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
          aria-label={intl.formatMessage({
            defaultMessage: 'Destination',
            description:
              'label for input box for the place you want directions to',
          })}
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
          values={{ strong }}
        />
      </p>
      <p className="DirectionsNullState_para">
        {SupportedRegionText && [<SupportedRegionText />, ' ']}
        <FormattedMessage
          defaultMessage="Get started by entering a destination above."
          description="text in welcome screen. appears below an input box for destination"
        />
      </p>
      <p className="DirectionsNullState_para DirectionsNullState_wideScreenOnly">
        <FormattedMessage
          defaultMessage={
            'In this early beta, BikeHopper is <strong>designed for phone screens</strong>,' +
            ' so it might look strange on your computer.'
          }
          description="paragraph in welcome screen"
          values={{ strong }}
        />
      </p>
      <p className="DirectionsNullState_para">
        <FormattedMessage
          defaultMessage={
            'Let us know what you think by reporting bugs, routes that could be' +
            ' better, and other feedback in <link>this form</link>.'
          }
          description="paragraph in welcome screen, with link to feedback form"
          values={{
            link: (chunks) => (
              <a
                href="https://forms.gle/ggVFjztFN6ivLEAu9"
                target="_blank"
                rel="noreferrer"
              >
                {chunks}
              </a>
            ),
          }}
        />
      </p>
      <p className="DirectionsNullState_para">
        <FormattedMessage
          defaultMessage={
            'BikeHopper is <link>open source</link> under the' +
            ' GNU Affero General Public License.'
          }
          description="paragraph in welcome screen, with link to project source code"
          values={{
            link: (chunks) => (
              <a
                href="https://github.com/bikehopper/bikehopper-ui"
                target="_blank"
                rel="noreferrer"
              >
                {chunks}
              </a>
            ),
          }}
        />
      </p>
    </div>
  );
}

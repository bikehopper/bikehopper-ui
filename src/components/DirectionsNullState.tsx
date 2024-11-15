import { useCallback } from 'react';
import type { FocusEvent, ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import MagnifyingGlass from 'iconoir/icons/search.svg?react';
import Icon from './primitives/Icon';
import { getSupportedRegionText } from '../lib/region';

import './DirectionsNullState.css';

type Props = {
  onInputFocus?: (evt: FocusEvent) => void;
};

export default function DirectionsNullState(props: Props) {
  const intl = useIntl();
  const supportedRegion = getSupportedRegionText();

  // The <input> rendered here is fake: its only function is to get focused and then
  // switch to a different UI that has the real input box.

  const strong = useCallback((jsx: ReactNode) => <strong>{jsx}</strong>, []);

  return (
    <article className="prose prose-sm md:prose-base lg:prose-lg max-w-none m-6">
      <h2>
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
      <p>
        <FormattedMessage
          defaultMessage={
            '<strong>Welcome to BikeHopper!</strong> This is a bike navigation' +
            ' app that suggests ways to combine biking and transit, expanding your' +
            ' options for getting around without a car.'
          }
          description="paragraph in welcome screen"
          values={{ strong }}
        />
      </p>
      {supportedRegion && (
        <p>
          <FormattedMessage
            defaultMessage={
              'Supported region: <strong>{region}</strong>. Get started' +
              ' by entering a destination above.'
            }
            description={
              'paragraph in welcome screen. region is a city or region name.' +
              ' Appears below an input box for destination'
            }
            values={{ strong, region: supportedRegion }}
          />
        </p>
      )}
      <p className="hidden lg:block">
        <FormattedMessage
          defaultMessage={
            'In this early beta, BikeHopper is <strong>designed for phone screens</strong>,' +
            ' so it might look strange on your computer.'
          }
          description="paragraph in welcome screen"
          values={{ strong }}
        />
      </p>
      <p>
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
      <p>
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
    </article>
  );
}

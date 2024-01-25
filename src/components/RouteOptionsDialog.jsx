import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import ModalDialog from './primitives/ModalDialog';
import DialogSubmitButton from './primitives/DialogSubmitButton';
import Icon from './Icon';
import usePrevious from '../hooks/usePrevious';

import { ReactComponent as BusIcon } from 'iconoir/icons/bus.svg';
import { ReactComponent as TrainIcon } from 'iconoir/icons/train.svg';
import { ReactComponent as FerryIcon } from 'iconoir/icons/sea-waves.svg';

export default function RouteOptionsDialog({
  isOpen,
  onCancel,
  onApply,
  globalConnectingModes,
}) {
  const intl = useIntl();

  const [connectingModes, setConnectingModes] = React.useState(
    globalConnectingModes,
  );

  const wasOpen = usePrevious(isOpen);

  React.useEffect(() => {
    // when dialog opens, initialize to match global state.
    if (isOpen && !wasOpen) {
      setConnectingModes(globalConnectingModes);
    }
  }, [isOpen, wasOpen, globalConnectingModes]);

  const handleApply = (evt) => {
    evt.preventDefault(); // don't submit a form
    onApply({ connectingModes });
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onCancel={onCancel}
      clickOutsideCancels={true}
      title={
        <FormattedMessage
          defaultMessage="Connecting modes"
          description={
            'dialog header. In this dialog you can toggle which ' +
            'modes of transit, such as bus, train, or ferry, ' +
            'can be used in giving directions.'
          }
        />
      }
    >
      <form>
        <ToggleGroup.Root
          type="multiple"
          value={connectingModes}
          onValueChange={setConnectingModes}
          className="my-3"
        >
          <ModeToggleGroupItem
            value="train"
            label={intl.formatMessage({
              defaultMessage: 'Trains',
              description:
                'toggle for whether to use trains ' +
                '(including trams, subway trains, commuter trains, etc) ' +
                'in directions.',
            })}
            icon={<TrainIcon />}
          />
          <ModeToggleGroupItem
            value="bus"
            label={intl.formatMessage({
              defaultMessage: 'Buses',
              description:
                'toggle for whether to use buses ' + 'in directions.',
            })}
            icon={<BusIcon />}
          />
          <ModeToggleGroupItem
            value="ferry"
            label={intl.formatMessage({
              defaultMessage: 'Ferries',
              description:
                'toggle for whether to use ferries ' + 'in directions.',
            })}
            icon={<FerryIcon />}
          />
        </ToggleGroup.Root>
        <DialogSubmitButton onClick={handleApply}>
          <FormattedMessage
            defaultMessage="Update"
            description="button. Saves changes made in a dialog box."
          />
        </DialogSubmitButton>
      </form>
    </ModalDialog>
  );
}

function ModeToggleGroupItem({ value, label, icon }) {
  return (
    <ToggleGroup.Item
      key={`group-item-${label}`}
      value={value}
      className="bg-white dark:bg-gray-800
        text-gray-950 dark:text-gray-50
        aria-pressed:bg-gray-200 dark:aria-pressed:bg-gray-600
        border-y border-solid px-2.5 py-2 border-x-0
        first:rounded-l-md first:border-x last:rounded-r-md last:border-x
        border-gray-300 aria-pressed:border-transparent
        dark:border-gray-500 dark:aria-pressed:border-transparent
        focus:relative focus:outline-none focus-visible:z-20 focus-visible:ring
        focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
    >
      <div className="flex flex-col">
        <Icon>{icon}</Icon>
        <span>{label}</span>
      </div>
    </ToggleGroup.Item>
  );
}

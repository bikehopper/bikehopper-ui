import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import ModalDialog from './primitives/ModalDialog';
import DialogSubmitButton from './primitives/DialogSubmitButton';
import Icon from './primitives/Icon';
import usePrevious from '../hooks/usePrevious';
import { CATEGORIES } from '../lib/TransitModes';
import type { ModeCategory } from '../lib/TransitModes';

import BusIcon from 'iconoir/icons/bus.svg?react';
import TrainIcon from 'iconoir/icons/train.svg?react';
import FerryIcon from 'iconoir/icons/sea-waves.svg?react';

export default function RouteOptionsDialog({
  isOpen,
  onCancel,
  onApply,
  globalConnectingModes,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onApply: (values: { connectingModes: ModeCategory[] }) => void;
  globalConnectingModes: ModeCategory[];
}) {
  const intl = useIntl();

  const [connectingModes, setConnectingModes] = useState(globalConnectingModes);

  const wasOpen = usePrevious(isOpen);

  useEffect(() => {
    // when dialog opens, initialize to match global state.
    if (isOpen && !wasOpen) {
      setConnectingModes(globalConnectingModes);
    }
  }, [isOpen, wasOpen, globalConnectingModes]);

  const handleApply = useCallback(
    (evt: React.MouseEvent) => {
      evt.preventDefault(); // don't submit a form
      onApply({ connectingModes });
    },
    [onApply, connectingModes],
  );

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
      <form className="text-[13px]">
        <ToggleGroup.Root
          type="multiple"
          value={connectingModes}
          onValueChange={setConnectingModes}
          className="my-3"
        >
          <ModeToggleGroupItem
            value={CATEGORIES.TRAINS}
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
            value={CATEGORIES.BUSES}
            label={intl.formatMessage({
              defaultMessage: 'Buses',
              description: 'toggle for whether to use buses in directions.',
            })}
            icon={<BusIcon />}
          />
          <ModeToggleGroupItem
            value={CATEGORIES.FERRIES}
            label={intl.formatMessage({
              defaultMessage: 'Ferries',
              description: 'toggle for whether to use ferries in directions.',
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

function ModeToggleGroupItem({
  value,
  label,
  icon,
}: {
  value: ModeCategory;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <ToggleGroup.Item
      key={`group-item-${label}`}
      value={value}
      className="bg-gray-200 dark:bg-gray-800
        text-gray-400 dark:text-gray-500
        aria-pressed:bg-white dark:aria-pressed:bg-gray-700
        aria-pressed:text-slate-950 dark:aria-pressed:text-slate-50
        border-y border-solid px-3 py-2 border-x-0
        first:rounded-l-md first:border-x last:rounded-r-md last:border-x
        border-gray-300
        dark:border-gray-500
        focus:relative focus:outline-hidden focus-visible:z-20 focus-visible:ring-3
        focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
    >
      <div className="flex flex-col items-center">
        <Icon className="mb-1">{icon}</Icon>
        <span className="inline">{label}</span>
      </div>
    </ToggleGroup.Item>
  );
}

import * as React from 'react';
import { useIntl } from 'react-intl';
import { Transition } from '@headlessui/react';
import * as Dialog from '@radix-ui/react-dialog';
import Icon from './Icon';

import { ReactComponent as CancelIcon } from 'iconoir/icons/xmark.svg';

export default function ModalDialog({
  isOpen,
  onCancel,
  title,
  children,
  clickOutsideCancels,
}) {
  const intl = useIntl();
  // If you want the modal to have a cancel X in the corner, pass an onCancel.

  return (
    <Dialog.Root isOpen={isOpen}>
      <Dialog.Portal forceMount>
        <Transition show={isOpen}>
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay
              className="fixed inset-0 bg-slate-900/50 z-10 transition-colors"
              onClick={clickOutsideCancels ? onCancel : undefined}
              forceMount
            />
          </Transition.Child>
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Content
              forceMount
              aria-describedby={undefined}
              className="fixed z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                w-[90vw] md:w-[95vw] max-w-md
                bg-white dark:bg-gray-800 p-6 rounded-md
                text-gray-800 dark:text-gray-300"
            >
              {title && (
                <Dialog.Title
                  className="m-0 mb-3 text-lg align-middle
                    flex flex-row justify-start items-center select-none"
                >
                  {title}
                </Dialog.Title>
              )}
              {children}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="absolute top-6 right-3 border-0 bg-transparent
                    cursor-pointer dark:text-gray-400"
                >
                  <Icon
                    label={intl.formatMessage({
                      defaultMessage: 'Cancel',
                      description:
                        'button to cancel making changes in a dialog',
                    })}
                  >
                    <CancelIcon className="w-5 h-5 text-gray-900" />
                  </Icon>
                </button>
              )}
            </Dialog.Content>
          </Transition.Child>
        </Transition>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

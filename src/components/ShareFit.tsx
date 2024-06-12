import classnames from 'classnames';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import Icon from './primitives/Icon';
import type { BikeLeg } from '../lib/BikeHopperClient';
import { fitFileGenerationFailed } from '../features/misc.js';
import ModalDialog from './primitives/ModalDialog';

import DownloadIcon from 'iconoir/icons/download.svg?react';

type Props = {
  leg: BikeLeg;
};

export default function ShareFit({ leg }: Props) {
  const intl = useIntl();
  const dispatch = useDispatch();

  // Data used to query for our fit file.
  const [fitURL, setFitURL] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Download the fit file.
  const downloadFit = useCallback(() => {
    const downloadFitAsync = async () => {
      setIsDownloading(true);
      try {
        const getFitBlob = (await import('../lib/getFitBlob.js')).default;
        setFitURL(URL.createObjectURL(getFitBlob(leg)));
      } catch (err) {
        console.error('fit file generation error:', err);
        dispatch(
          fitFileGenerationFailed(
            intl.formatMessage({
              defaultMessage: 'Unable to generate FIT file',
              description:
                "error when we can't generate a FIT file " +
                '(a file format used in a cycling computer).',
            }),
          ),
        );
      } finally {
        setIsDownloading(false);
      }
    };
    downloadFitAsync();
  }, [leg, dispatch, intl]);

  return (
    <>
      <button
        className={classnames({
          'bg-transparent h-8 block border-0 cursor-pointer text-black': true,
          'opacity-50': isDownloading,
        })}
        onClick={downloadFit}
        disabled={isDownloading}
      >
        <div className="flex items-center mr-8 text-[.80rem]">
          <Icon
            label={intl.formatMessage({
              defaultMessage: 'Download',
              description: 'Button used to download FIT file.',
            })}
          >
            <DownloadIcon className="align-middle" />
          </Icon>
          {intl.formatMessage({
            defaultMessage: 'FIT',
            description: 'Button used to download FIT file.',
          })}
        </div>
      </button>
      <ModalDialog
        isOpen={fitURL != null}
        onCancel={() => setFitURL(null)}
        clickOutsideCancels={true}
        title={
          <FormattedMessage
            defaultMessage="Download FIT file"
            description={
              'dialog header. In this dialog you can download' +
              'FIT file which you can import into your cycling' +
              'computer.'
            }
          />
        }
      >
        {fitURL && (
          <a
            download="route.fit"
            href={fitURL}
            className="text-blue-500 underline"
          >
            {intl.formatMessage({
              defaultMessage: 'Press here to download the FIT file.',
              description: 'Link to download the FIT file.',
            })}
          </a>
        )}
      </ModalDialog>
    </>
  );
}

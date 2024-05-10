import { useState } from 'react';

import Icon from './primitives/Icon';
import DownloadIcon from 'iconoir/icons/download.svg?react';
import getFitBlob from '../lib/getFitBlob.js';
import { FormattedMessage, useIntl } from 'react-intl';
import ModalDialog from './primitives/ModalDialog';

export default function ShareFit({ route }) {
  const intl = useIntl();

  // Data used to query for our fit file.
  const [fitURL, setFitURL] = useState(null);

  // Download the fit file.
  const downloadFit = () => {
    setFitURL(URL.createObjectURL(getFitBlob(route.legs[0])));
  };

  return (
    <>
      <button
        className="bg-transparent h-8 block border-0 cursor-pointer text-black"
        onClick={downloadFit}
      >
        <div className="flex items-center mr-8 text-[.80rem]">
          <Icon
            label={intl.formatMessage({
              defaultMessage: 'Download FIT',
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
        onClose={() => setFitURL(null)}
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
      </ModalDialog>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import Icon from './primitives/Icon';
import DownloadIcon from 'iconoir/icons/download.svg?react';
import FitFileEncoder from '../lib/FitFileEncoder';
import { FormattedMessage, useIntl } from 'react-intl';
import ModalDialog from './primitives/ModalDialog';

export default function ShareFit() {
  const intl = useIntl();

  // Data used to query for our fit file.
  const [fitURL, setFitURL] = useState(null);
  const routes = useSelector((state) => state.routes);
  const activeRoute = routes.routes[routes.activeRoute];

  // Download the fit file.
  const downloadFit = () => {
    const fitFileEncoder = new FitFileEncoder(activeRoute.legs[0]);
    fitFileEncoder.createFit();
    const fBlob = fitFileEncoder.getBlob();
    setFitURL(URL.createObjectURL(fBlob));
  };

  // Is our current route cycling only?
  const isCyclingOnly = () => {
    return (
      activeRoute.legs.length === 1 && activeRoute.legs[0].type === 'bike2'
    );
  };

  return (
    isCyclingOnly() && (
      <>
        <button
          className="bg-transparent h-8 block border-0 cursor-pointer text-black"
          disabled={!isCyclingOnly()}
          onClick={downloadFit}
          type="button"
          title="Download FIT"
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
    )
  );
}

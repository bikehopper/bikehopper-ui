// WORK IN PROGRESS
import { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import Icon from '../Icon';
import { ReactComponent as DownloadIcon } from 'iconoir/icons/download.svg';
import FitFileEncoder from '../../lib/FitFileEncoder';
import './ShareFit.css';

export function ShareFit() {
  const [fitURL, setFitURL] = useState(null);

  // Data used to query for our fit file.
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
          className="ShareFit_button"
          disabled={!isCyclingOnly()}
          onClick={downloadFit}
          type="button"
          title="Download FIT"
        >
          <Icon className="ShareBar_item" label="Download FIT">
            <DownloadIcon />
          </Icon>
        </button>
        {
          <DownloadPopup
            url={fitURL}
            open={fitURL}
            onClose={() => setFitURL(null)}
          />
        }
      </>
    )
  );
}

// In a more trusting world I could create an <a> and have it be
// clicked via software to trigger our download.  Alas, that world is not yet
// here.  So instead we must pop up a url that the user can click on after the
// download is triggered.

function DownloadPopup({ url, open, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (open) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [open]);

  return (
    <dialog className="ShareFit_popup" ref={ref}>
      <div className="ShareFit_popup_container">
        <a download="route.fit" href={url}>
          Download FIT File
        </a>
        <button onClick={onClose}>Close</button>
      </div>
    </dialog>
  );
}

export default ShareFit;

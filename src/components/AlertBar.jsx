import * as React from 'react';
import { useIntl } from 'react-intl';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import classnames from 'classnames';
import { AlertSeverity, dismissAlert } from '../features/alerts';
import Icon from './Icon';

import { ReactComponent as Cancel } from 'iconoir/icons/cancel.svg';
import { ReactComponent as WarningCircle } from 'iconoir/icons/warning-circle.svg';
import { ReactComponent as WarningTriangle } from 'iconoir/icons/warning-triangle.svg';
import './AlertBar.css';

export default function AlertBar(props) {
  // Only display newest alert if multiple, for now
  const { severity, message, id } = useSelector((state) => {
    return (
      state.alerts.alerts[0] || { severity: null, message: null, id: null }
    );
  }, shallowEqual);

  const dispatch = useDispatch();
  const intl = useIntl();

  if (!message) return null;

  const handleDismissClick = (evt) => {
    evt.preventDefault();
    dispatch(dismissAlert(id));
  };

  return (
    <div
      className={classnames({
        AlertBar: true,
        AlertBar__error: severity === AlertSeverity.ERROR,
        AlertBar__warning: severity === AlertSeverity.WARNING,
      })}
      role="alert"
      key={id}
      onTouchEnd={
        handleDismissClick /* on mobile tapping entire bar dismisses */
      }
    >
      <Icon className="AlertBar_icon">
        {severity === AlertSeverity.ERROR ? (
          <WarningCircle />
        ) : (
          <WarningTriangle />
        )}
      </Icon>
      <span className="AlertBar_msg">{message}</span>
      <button className="AlertBar_cancel" onClick={handleDismissClick}>
        <Icon
          label={intl.formatMessage({
            defaultMessage: 'Dismiss',
            description: 'button to dismiss alert',
          })}
          className="AlertBar_cancelIcon"
        >
          <Cancel />
        </Icon>
      </button>
    </div>
  );
}

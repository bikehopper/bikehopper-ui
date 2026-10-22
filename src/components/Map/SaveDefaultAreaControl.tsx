import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useControl } from 'react-map-gl/maplibre';
import type { IControl } from 'react-map-gl/maplibre';
import { defaultViewportSaved } from '../../features/viewport';
import type { Dispatch } from '../../store';

/*
 * A button on the map that saves the current view as the user's default area.
 *
 * It's a MapLibre control (rather than an element positioned over the map) so
 * it lives in the map's top-left control corner, which MobileMapLayout already
 * moves to stay below the top bar.
 */
export default function SaveDefaultAreaControl() {
  const dispatch: Dispatch = useDispatch();
  const intl = useIntl();
  const control = useControl(() => new _PortalControl(), {
    position: 'top-left',
  });

  return createPortal(
    <button
      type="button"
      className="rounded-full shadow-md px-3 py-2 text-sm cursor-pointer
        bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
        border border-solid border-gray-300 dark:border-gray-600"
      title={intl.formatMessage({
        defaultMessage:
          'Start here next time and show search results near this area first',
        description: 'tooltip for the Set as default area map button',
      })}
      onClick={() => dispatch(defaultViewportSaved())}
    >
      <FormattedMessage
        defaultMessage="Set as default area"
        description={
          'button overlaid on the map. Saves the current map view so the app' +
          ' starts there next time and prioritizes search results near it.'
        }
      />
    </button>,
    control.container,
  );
}

// A MapLibre control whose contents are rendered by React through a portal.
class _PortalControl implements IControl {
  container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    // MapLibre only re-enables pointer events on elements with this class.
    this.container.className = 'maplibregl-ctrl';
  }

  onAdd() {
    return this.container;
  }

  onRemove() {
    this.container.remove();
  }
}

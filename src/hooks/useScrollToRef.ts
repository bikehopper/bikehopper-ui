import { useRef, useEffect } from 'react';
import usePrevious from './usePrevious';

// A ref that will be scrolled to when the component mounts, if populated.
// The offsetParent must be the container in which to scroll.
//
// If a key is passed, changing the key also scrolls to the ref.

export type ScrollToRef<T extends HTMLElement> =
  React.MutableRefObject<T | null>;

export default function useScrollToRef<T extends HTMLElement, K>(
  key?: K,
): ScrollToRef<T> {
  const scrollToRef = useRef<T>(null);

  const prevKey = usePrevious(key);

  useEffect(() => {
    if (key !== undefined && key === prevKey) {
      return;
    }

    const el = scrollToRef.current;
    if (el) {
      const container = el.offsetParent;
      if (container) {
        container.scrollTop =
          el.offsetTop + el.clientHeight / 2 - container.clientHeight / 2;
      }
    }
  }, [key, prevKey]);

  return scrollToRef;
}

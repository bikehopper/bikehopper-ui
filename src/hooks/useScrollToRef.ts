import { useRef, useEffect } from 'react';
import usePrevious from './usePrevious';

// A ref that will be scrolled to when the component mounts, if populated.
// The container in which to scroll must be an offset parent.
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

    console.log('scrolling to. key=', key);
    const anchor = scrollToRef.current;
    if (anchor) {
      let offsetTop = 0;
      let el: Element = anchor;
      let container: Element | null = null;

      // Because anything positioned relative is an offset parent, we may have
      // to iterate over multiple generations of offset parents to find one that
      // is scrollable.

      while (el instanceof HTMLElement && el.offsetParent) {
        offsetTop += el.offsetTop;
        el = el.offsetParent;
        if (window.getComputedStyle(el).overflowY === 'scroll') {
          // Found scroll container. Note that we use CSS, rather than scrollTopMax,
          // to avoid skipping over a container that might be scrollable but just
          // happens to fit its content on-screen now.
          container = el;
          break;
        }
      }
      if (container) {
        container.scrollTop =
          offsetTop + el.clientHeight / 2 - container.clientHeight / 2;
      }
    }
  }, [key, prevKey]);

  return scrollToRef;
}

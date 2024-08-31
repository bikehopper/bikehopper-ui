import { useRef, useEffect } from 'react';

// A ref that will be scrolled to when the component mounts, if populated.
// The offsetParent must be the container in which to scroll.

export type ScrollToRef<T extends HTMLElement> =
  React.MutableRefObject<T | null>;

export default function useScrollToRef<
  T extends HTMLElement,
>(): ScrollToRef<T> {
  const scrollToRef = useRef<T>(null);

  useEffect(() => {
    const el = scrollToRef.current;
    if (el) {
      const container = el.offsetParent;
      if (container) {
        container.scrollTop =
          el.offsetTop + el.clientHeight / 2 - container.clientHeight / 2;
      }
    }
  }, []);

  return scrollToRef;
}

import { useRef, useEffect } from 'react';

// A ref that will be scrolled to when the component mounts, if populated.
// The offsetParent must be the container in which to scroll.

export default function useScrollToRef() {
  const scrollToRef = useRef();

  useEffect(() => {
    const el = scrollToRef.current;
    if (el) {
      const container = el.offsetParent;
      container.scrollTop =
        el.offsetTop + el.clientHeight / 2 - container.clientHeight / 2;
    }
  }, []);

  return scrollToRef;
}

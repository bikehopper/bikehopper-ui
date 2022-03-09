import { useCallback, useEffect, useRef, useState } from 'react';
import useThrottledValue from './useThrottledValue';

// Caution: this hook does not call the callback with the initial size when
// first attaching to a node.

export default function useResizeObserver(callback, throttleWait = 200) {
  const [dimensionString, setDimensionString] = useState(null);
  const observerRef = useRef(null);
  const nodeRef = useRef(null);

  const nodeCallbackRef = useCallback((newNode) => {
    if (observerRef.current) {
      if (nodeRef.current) observerRef.current.unobserve(nodeRef.current);
      if (newNode) observerRef.current.observe(newNode);
    }

    nodeRef.current = newNode;
  }, []);

  useEffect(() => {
    observerRef.current = new ResizeObserver((entries) => {
      if (entries.length !== 1) {
        console.error('expected only one resize entry');
        return;
      }

      const { inlineSize: width, blockSize: height } =
        entries[0].contentBoxSize[0];
      setDimensionString(width + 'x' + height);
    });

    if (nodeRef.current) {
      observerRef.current.observe(nodeRef.current);
    }

    return () => {
      observerRef.current.disconnect();
      observerRef.current = null;
    };
  }, [nodeRef]);

  const throttledDimensionString = useThrottledValue(
    dimensionString,
    throttleWait,
  );

  useEffect(() => {
    if (observerRef.current)
      callback(
        throttledDimensionString
          ? throttledDimensionString.split('x')
          : [null, null],
      );
  }, [callback, throttledDimensionString]);

  return nodeCallbackRef;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import useThrottledValue from './useThrottledValue';

// This hook helps you listen for changes in an element's size.
//
// Usage:
//
// const doStuffWithSize = useCallback(([width, height]) =>
//   { /* use width and height */ }
// );
// const resizeRef = useResizeObserver(doStuffWithSize);
// ...
//   <div ref={resizeRef}> ...

// Caution: this hook does not call the callback with the initial size when
// first attaching to a node.

export default function useResizeObserver(
  callback: (dimensions: [number, number]) => void,
  throttleWait = 200,
) {
  const [dimensionString, setDimensionString] = useState<string | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const nodeRef = useRef<Element | null>(null);

  const nodeCallbackRef = useCallback((newNode: Element) => {
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
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
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
          ? (throttledDimensionString.split('x') as any)
          : [null, null],
      );
  }, [callback, throttledDimensionString]);

  return nodeCallbackRef;
}

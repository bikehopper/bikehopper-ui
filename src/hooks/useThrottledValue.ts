import { useState, useEffect, useRef } from 'react';

export default function useThrottledValue<T>(value: T, wait: number) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastSetRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    const then = lastSetRef.current;
    const elapsed = now - then;

    if (elapsed >= wait) {
      lastSetRef.current = now;
      setThrottledValue(value);
      return;
    }

    const timeoutId = setTimeout(() => {
      setThrottledValue(value);
    }, wait - elapsed);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, wait]);

  return throttledValue;
}

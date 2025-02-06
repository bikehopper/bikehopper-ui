import { useEffect, useState } from 'react';

const DESKTOP_MIN_WIDTH_PX = 900;

export default function useScreenDims() {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  return {
    isMobile: width < DESKTOP_MIN_WIDTH_PX,
    innerWidth: width,
    innerHeight: height,
  };
}

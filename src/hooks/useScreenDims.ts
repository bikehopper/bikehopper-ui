import { useEffect, useState } from 'react';

const MAX_MOBILE_WIDTH_PX = 750;

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
    isMobile: width < MAX_MOBILE_WIDTH_PX,
    innerWidth: width,
    innerHeight: height,
  };
}

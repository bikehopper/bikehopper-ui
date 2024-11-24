import { useEffect, useState } from 'react';

const MAX_MOBILE_WIDTH_PX = 750;

export default function useIsMobile() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  return width < MAX_MOBILE_WIDTH_PX;
}

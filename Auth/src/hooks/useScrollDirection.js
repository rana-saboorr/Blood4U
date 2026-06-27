import { useEffect, useState } from 'react';

export function useScrollDirection(threshold = 10) {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);

      if (Math.abs(y - lastY) < threshold) return;

      setVisible(y < lastY || y < 80);
      lastY = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { navVisible: visible, scrolled };
}

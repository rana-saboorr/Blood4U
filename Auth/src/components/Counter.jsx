import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

export default function Counter({ from = 0, to, duration = 2 }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const controls = animate(from, to, {
      duration,
      onUpdate(value) {
        setCount(Math.floor(value));
      },
      ease: [0.16, 1, 0.3, 1], // Custom overshoot spring-like ease
    });

    return () => controls.stop();
  }, [from, to, duration]);

  return <span>{count.toLocaleString()}</span>;
}

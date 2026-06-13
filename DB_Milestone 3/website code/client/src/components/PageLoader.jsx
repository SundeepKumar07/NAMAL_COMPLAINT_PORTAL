import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Thin top progress bar that animates on every route change.
 */
export default function PageLoader() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(20);

    const t1 = setTimeout(() => setProgress(60), 100);
    const t2 = setTimeout(() => setProgress(85), 300);
    const t3 = setTimeout(() => {
      setProgress(100);
      const t4 = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(t4);
    }, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '400ms',
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}

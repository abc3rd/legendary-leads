import { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const PULL_THRESHOLD = 70;
const MAX_PULL = 110;

export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current === null) return;
    const el = containerRef.current;
    if (el && el.scrollTop > 0) { startYRef.current = null; return; }
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) return;
    e.preventDefault();
    setPullY(Math.min(delta * 0.5, MAX_PULL));
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(PULL_THRESHOLD);
      try { await onRefresh(); } finally {
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
    startYRef.current = null;
  }, [pullY, refreshing, onRefresh]);

  const progress = Math.min(pullY / PULL_THRESHOLD, 1);
  const isTriggered = pullY >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center items-center z-10 pointer-events-none transition-all duration-200"
        style={{
          top: -48 + pullY,
          opacity: progress,
          transform: `scale(${0.5 + progress * 0.5})`
        }}
      >
        <div className="rounded-full p-2 shadow-lg" style={{
          background: isTriggered ? '#4acbbf' : 'rgba(74,203,191,0.2)',
          border: `2px solid ${isTriggered ? '#4acbbf' : 'rgba(74,203,191,0.4)'}`
        }}>
          <Loader2
            className="h-5 w-5"
            style={{
              color: isTriggered ? '#0a1929' : '#4acbbf',
              animation: (refreshing || isTriggered) ? 'spin 0.8s linear infinite' : 'none',
              transform: `rotate(${progress * 360}deg)`,
              transition: refreshing ? 'none' : undefined
            }}
          />
        </div>
      </div>

      {/* Content pushed down during pull */}
      <div style={{ transform: `translateY(${pullY}px)`, transition: pullY === 0 ? 'transform 0.3s ease' : 'none' }}>
        {children}
      </div>
    </div>
  );
}
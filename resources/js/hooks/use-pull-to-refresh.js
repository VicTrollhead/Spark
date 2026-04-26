import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh, { threshold = 80, enabled = true } = {}) {
    const [pulling, setPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const startY = useRef(0);
    const isPulling = useRef(false);

    useEffect(() => {
        if (!enabled) return;

        const handleTouchStart = (e) => {
            if (window.scrollY === 0) {
                startY.current = e.touches[0].clientY;
                isPulling.current = true;
            }
        };

        const handleTouchMove = (e) => {
            if (!isPulling.current) return;
            const currentY = e.touches[0].clientY;
            const distance = Math.max(0, currentY - startY.current);

            if (distance > 0 && window.scrollY === 0) {
                const dampened = Math.min(distance * 0.5, threshold * 1.5);
                setPullDistance(dampened);
                setPulling(dampened >= threshold);
            }
        };

        const handleTouchEnd = () => {
            if (isPulling.current && pullDistance >= threshold) {
                onRefresh();
            }
            isPulling.current = false;
            setPullDistance(0);
            setPulling(false);
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, onRefresh, threshold, pullDistance]);

    return { pulling, pullDistance };
}

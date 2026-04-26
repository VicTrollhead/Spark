import { useEffect, useRef } from 'react';

export function useInfiniteScroll(callback, enabled = true) {
    const sentinelRef = useRef(null);

    useEffect(() => {
        if (!enabled || !sentinelRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    callback();
                }
            },
            { rootMargin: '200px' },
        );

        observer.observe(sentinelRef.current);

        return () => observer.disconnect();
    }, [callback, enabled]);

    return sentinelRef;
}

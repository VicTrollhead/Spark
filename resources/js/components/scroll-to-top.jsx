import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onClick={scrollToTop}
                    className="fixed bottom-20 right-4 z-40 rounded-full bg-gray-800/90 p-2.5 text-white shadow-md backdrop-blur-sm transition hover:bg-gray-700 dark:bg-neutral-700/90 dark:hover:bg-neutral-600 lg:bottom-6"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="h-4 w-4" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}

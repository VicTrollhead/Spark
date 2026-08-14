import { useEffect, useRef, useState } from 'react';

export function useDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggle = () => setIsOpen((prev) => !prev);
    const close = () => setIsOpen(false);

    return { isOpen, toggle, close, ref };
}

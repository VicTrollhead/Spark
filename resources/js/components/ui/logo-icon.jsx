import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils.js';
import sparkLight from '../../assets/images/spark-light.png';
import sparkDark from '../../assets/images/spark-dark.png';

export default function LogoIcon({ className = '', ...props }) {
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        // Функція, яка оновлює стан теми
        const updateDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        };

        // Слухаємо зміни класу 'dark' (через зміни теми)
        const observer = new MutationObserver(updateDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        // І одразу викликаємо для початкової теми
        updateDarkMode();

        return () => observer.disconnect();
    }, []);

    return (
        <img
            src={isDarkMode ? sparkLight : sparkDark}
            alt="Spark logo"
            className={cn('h-10', className)}
            {...props}
        />
    );
}

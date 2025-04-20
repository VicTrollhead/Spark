import { cn } from '../../lib/utils.js';
import { useAppearance } from '../../hooks/use-appearance';
import sparkLight from '../../assets/images/spark-light.png';
import sparkDark from '../../assets/images/spark-dark.png';

export default function LogoIcon({ className = '', ...props }) {
    const { appearance } = useAppearance();
    const isDarkMode = appearance === 'dark';

    return (
        <img
            src={isDarkMode ? sparkLight : sparkDark}
            alt="Spark logo"
            className={cn('h-10', className)}
            {...props}
        />
    );
}

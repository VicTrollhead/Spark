import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '../hooks/use-appearance';
import { cn } from '../lib/utils';

export default function AppearanceToggle({ className = '', ...props }) {
    const { appearance, updateAppearance } = useAppearance();

    const isDarkMode = appearance === 'dark';

    return (
        <button
            onClick={() => updateAppearance(isDarkMode ? 'light' : 'dark')}
            className={cn(
                'bg-neutral dark:bg-neutral ml-1 flex items-center gap-2 rounded-full transition',
                'bg-gray-100 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700',
                className,
            )}
            {...props}
        >
            {isDarkMode ? <Moon className="h-5 w-5 text-white" /> : <Sun className="text-black-500 h-5 w-5" />}
        </button>
    );
}

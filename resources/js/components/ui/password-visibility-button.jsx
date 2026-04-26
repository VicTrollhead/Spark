import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function PasswordVisibilityToggle({ visible, onToggle, className = '', ...props }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-input bg-transparent transition',
                'hover:bg-accent hover:text-accent-foreground',
                className
            )}
            {...props}
        >
            {visible ? (
                <EyeOff className="h-5 w-5 text-black dark:text-white" />
            ) : (
                <Eye className="h-5 w-5 text-black dark:text-white" />
            )}
        </button>
    );
}


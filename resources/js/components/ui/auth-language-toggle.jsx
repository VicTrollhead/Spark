import { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AuthLanguageToggle({ className = '', ...props }) {
    const { locale, translations } = usePage().props;
    const [currentLocale, setCurrentLocale] = useState(locale || 'en');

    const toggleLanguage = () => {
        const newLocale = currentLocale === 'en' ? 'ua' : 'en';

        setCurrentLocale(newLocale);

        router.post(`/settings/language/${newLocale}`, {}, {
            preserveState: false,
            preserveScroll: true,
            onFinish: () => {
                window.location.reload();
            }
        });
    };

    return (
        <button
            onClick={toggleLanguage}
            className={cn(
                'flex items-center gap-2 rounded-full bg-neutral ml-1 p-2.5 transition dark:bg-neutral',
                'hover:bg-neutral-300 dark:hover:bg-neutral-700',
                className
            )}
            {...props}
        >
            <Globe className="h-4 w-4" />
            {currentLocale.toUpperCase()}
        </button>
    );
}

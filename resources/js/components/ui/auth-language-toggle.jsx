import { router, usePage } from '@inertiajs/react';
import { Globe, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from './dropdown-menu';

const LANGUAGES = [
    { value: 'en', code: 'EN', nativeLabel: 'English' },
    { value: 'ua', code: 'УКР', nativeLabel: 'Українська' },
    { value: 'de', code: 'DE', nativeLabel: 'Deutsch' },
];

export default function AuthLanguageToggle({ className = '', ...props }) {
    const { locale } = usePage().props;
    const current = LANGUAGES.find((l) => l.value === locale) || LANGUAGES[0];

    const switchLanguage = (newLocale) => {
        if (newLocale === locale) return;
        router.post(`/settings/language/${newLocale}`, {}, {
            preserveState: false,
            preserveScroll: true,
            onFinish: () => window.location.reload(),
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'flex items-center gap-2 rounded-full bg-gray-100 px-3 text-sm font-medium transition hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700',
                        className
                    )}
                    {...props}
                >
                    <Globe className="h-5 w-5" />
                    {current.code}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
                {LANGUAGES.map((lang) => {
                    const isActive = lang.value === locale;
                    return (
                        <DropdownMenuItem
                            key={lang.value}
                            onClick={() => switchLanguage(lang.value)}
                            className="flex items-center justify-between gap-4"
                        >
                            <span className="flex flex-col">
                                <span className="text-sm font-medium">{lang.nativeLabel}</span>
                                <span className="text-xs text-muted-foreground">{lang.code}</span>
                            </span>
                            {isActive && <Check className="h-4 w-4 text-blue-500" />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

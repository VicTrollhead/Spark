import { cn } from '@/lib/utils';
import { Head, router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';

import HeadingSmall from '../../components/heading-small';

import { useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import SettingsLayout from '../../layouts/settings/layout';

const breadcrumbs = [
    {
        title: 'Language',
        href: '/settings/language',
    },
];

const languages = [
    { value: 'en', label: 'English', nativeLabel: 'English' },
    { value: 'ua', label: 'Ukrainian', nativeLabel: 'Українська' },
    { value: 'de', label: 'German', nativeLabel: 'Deutsch' },
];

export default function Language() {
    const { translations, locale } = usePage().props;
    const [localeOption, setLocaleOption] = useState(locale || 'en');
    const [switching, setSwitching] = useState(false);

    const handleLanguageChange = (newLocale) => {
        if (newLocale === localeOption || switching) return;
        setSwitching(true);
        setLocaleOption(newLocale);
        router.post(
            `/settings/language/${newLocale}`,
            {},
            {
                preserveState: false,
                preserveScroll: true,
                only: [],
                onFinish: () => {
                    window.location.reload();
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Language" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title={translations['Language']} description={translations["Update your account's language"]} />
                    <div className="grid gap-2">
                        {languages.map((lang) => {
                            const isActive = localeOption === lang.value;
                            return (
                                <button
                                    key={lang.value}
                                    type="button"
                                    disabled={switching}
                                    onClick={() => handleLanguageChange(lang.value)}
                                    className={cn(
                                        'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                                        isActive
                                            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/50',
                                        switching && 'cursor-wait opacity-60',
                                    )}
                                >
                                    <div>
                                        <p
                                            className={cn(
                                                'text-sm font-medium',
                                                isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white',
                                            )}
                                        >
                                            {translations[lang.label] || lang.label}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{lang.nativeLabel}</p>
                                    </div>
                                    {isActive && (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white dark:bg-blue-400">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

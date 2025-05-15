import { router, usePage } from '@inertiajs/react';
import { Globe } from 'lucide-react';

export default function AuthLanguageToggle() {
    const { locale, translations } = usePage().props;

    const toggleLanguage = () => {
        const newLocale = locale === 'en' ? 'ua' : 'en';

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
            className="bg-neutral dark:bg-neutral ml-1 flex items-center gap-2 rounded-full p-2.5 transition hover:bg-neutral-300 dark:hover:bg-neutral-700"
        >
            <Globe className="h-4 w-4" />
            {locale === 'en' ? 'EN' : 'УКР'}
        </button>
    );
}

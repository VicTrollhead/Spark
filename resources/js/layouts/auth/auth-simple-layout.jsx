import { Link, usePage } from '@inertiajs/react';
import AppearanceToggle from '../../components/appearance-toggle';
import AuthLanguageToggle from '../../components/ui/auth-language-toggle';
import LogoIcon from '../../components/ui/logo-icon.jsx';

export default function AuthSimpleLayout({ children, title, description }) {
    const { translations } = usePage().props;

    return (
        <div className="bg-background text-foreground relative flex min-h-dvh flex-col">
            <div aria-hidden className="bg-ambient" />

            <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
                <Link href={route('home')} className="flex items-center gap-2">
                    <LogoIcon className="h-9" />
                </Link>
                <div className="flex items-center gap-2">
                    <AppearanceToggle className="h-10 w-10 justify-center" />
                    <AuthLanguageToggle className="h-10 justify-center px-3" />
                </div>
            </header>

            <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-4">
                <div className="w-full max-w-md">
                    <div className="border-border bg-card text-card-foreground rounded-2xl border p-6 shadow-2xl shadow-black/10 sm:p-8 dark:shadow-black/40">
                        <div className="mb-6 space-y-1.5 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                            {description && <p className="text-muted-foreground text-sm">{description}</p>}
                        </div>
                        {children}
                    </div>
                </div>
            </main>

            <footer className="text-muted-foreground relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-1.5 px-6 py-3 text-center text-xs">
                <span>Spark &copy; {new Date().getFullYear()}</span>
            </footer>
        </div>
    );
}

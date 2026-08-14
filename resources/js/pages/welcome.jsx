import { Head, Link, usePage } from '@inertiajs/react';
import { Hash, MessageCircle, Users, Zap } from 'lucide-react';
import AppearanceToggle from '../components/appearance-toggle';
import AuthLanguageToggle from '../components/ui/auth-language-toggle';

export default function Welcome() {
    const { translations } = usePage().props;
    const t = (key, fallback) => (translations && translations[key]) || fallback;

    const features = [
        {
            icon: Zap,
            title: t('Real-time feed', 'Real-time feed'),
            description: t('Posts, likes and reposts update live without refreshing.', 'Posts, likes and reposts update live without refreshing.'),
        },
        {
            icon: MessageCircle,
            title: t('Direct & group chat', 'Direct & group chat'),
            description: t(
                'Message anyone or start a group conversation with typing indicators.',
                'Message anyone or start a group conversation with typing indicators.',
            ),
        },
        {
            icon: Hash,
            title: t('Hashtags & search', 'Hashtags & search'),
            description: t(
                'Follow trends and discover posts, users and topics instantly.',
                'Follow trends and discover posts, users and topics instantly.',
            ),
        },
        {
            icon: Users,
            title: t('Follow your people', 'Follow your people'),
            description: t(
                'Build a timeline around the voices you actually care about.',
                'Build a timeline around the voices you actually care about.',
            ),
        },
    ];

    return (
        <>
            <Head title={t('Welcome to Spark', 'Welcome to Spark')} />
            <div className="bg-background text-foreground relative flex min-h-dvh flex-col">
                <div aria-hidden className="bg-ambient" />
                <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-2xl font-bold tracking-tight">
                        Spark
                    </Link>
                    <nav className="flex items-center gap-2">
                        <Link href={route('login')} className="text-foreground hover:bg-accent rounded-full px-5 py-2 text-sm font-medium transition">
                            {t('Log In', 'Log in')}
                        </Link>
                        <Link
                            href={route('register')}
                            className="bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-medium transition hover:opacity-90"
                        >
                            {t('Sign up', 'Sign up')}
                        </Link>
                        <AppearanceToggle className="h-10 w-10 justify-center" />
                        <AuthLanguageToggle className="h-10 justify-center" />
                    </nav>
                </header>

                <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-8">
                    <section className="flex flex-col items-center text-center">
                        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                            {t('Share what sparks your mind.', 'Share what sparks your mind.')}
                        </h1>
                        <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
                            {t(
                                'Spark is a real-time social space for short posts, live conversations and the people you want to hear from.',
                                'Spark is a real-time social space for short posts, live conversations and the people you want to hear from.',
                            )}
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={route('register')}
                                className="bg-primary text-primary-foreground rounded-full px-8 py-3 text-base font-semibold transition hover:opacity-90"
                            >
                                {t('Create your account', 'Create your account')}
                            </Link>
                            <Link
                                href={route('login')}
                                className="border-border text-foreground hover:bg-accent rounded-full border px-8 py-3 text-base font-semibold transition"
                            >
                                {t('Log In', 'Log in')}
                            </Link>
                        </div>
                    </section>

                    <section className="mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map(({ icon: Icon, title, description }) => (
                            <div
                                key={title}
                                className="border-border bg-card text-card-foreground hover:border-ring rounded-2xl border p-6 transition"
                            >
                                <div className="bg-accent text-accent-foreground mb-4 inline-flex rounded-full p-3">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-semibold">{title}</h3>
                                <p className="text-muted-foreground mt-2 text-sm">{description}</p>
                            </div>
                        ))}
                    </section>
                </main>

                <footer className="text-muted-foreground relative mx-auto w-full max-w-6xl px-6 py-5 text-center text-sm">
                    {t('Built with Spark.', 'Built with Spark.')}
                </footer>
            </div>
        </>
    );
}

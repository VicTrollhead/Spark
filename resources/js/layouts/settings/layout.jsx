import Heading from '@/components/heading';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { User, Lock, Palette, Globe } from 'lucide-react';



export default function SettingsLayout({ children }) {
    const { translations } = usePage().props;
    const sidebarNavItems = [
        {
            title: translations["Profile"],
            url: '/settings/profile',
            icon: User,
        },
        {
            title: translations["Password"],
            url: '/settings/password',
            icon: Lock,
        },
        {
            title: translations["Appearance"],
            url: '/settings/appearance',
            icon: Palette,
        },
        {
            title: translations["Language"],
            url: '/settings/language',
            icon: Globe,
        },
    ];

    const currentPath = window.location.pathname;

    return (<div className="px-4 py-6">
        <Heading
            title={translations["Settings"]}
            description={translations["Manage your profile and account settings"]}
        />

        <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-12">
            <aside className="w-full max-w-xl lg:w-52">
                <nav className="flex flex-col gap-0.5">
                    {sidebarNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.url;
                        return (
                            <Link
                                key={item.url}
                                href={item.url}
                                prefetch
                                className={cn(
                                    'relative flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-accent text-accent-foreground shadow-sm font-semibold'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                )}
                            >
                                {isActive && (
                                    <span aria-hidden className="absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
                                )}
                                <Icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex-1 md:max-w-2xl">
                <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">{children}</section>
            </div>
        </div>
    </div>);
}


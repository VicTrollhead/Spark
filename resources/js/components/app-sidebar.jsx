import { NavFooter } from './nav-footer';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton } from './ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, Home, User, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage().props;
    const user = auth?.user;

    if (!user) return null;

    const mainNavItems = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: Home,
        },
        {
            title: 'Users',
            url: '/dashboard/users',
            icon: Users,
        },
        {
            title: 'Profile',
            url: user.username ? `/user/${user.username}` : '/user',
            icon: User,
        },
    ];

    const footerNavItems = [
        {
            title: 'Repository',
            url: 'https://github.com/VicTrollhead/Spark',
            icon: Folder,
        },
        {
            title: 'Documentation',
            url: 'https://laravel.com/docs/starter-kits',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuButton size="lg" asChild className="flex-3/4">
                        <Link href="/dashboard" prefetch>
                            <AppLogo />
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}



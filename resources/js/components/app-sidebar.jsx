import { NavFooter } from './nav-footer';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton } from './ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { Bookmark, BookOpen, Folder, Home, LogOut, Mail, Settings, User, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { useMobileNavigation } from '../hooks/use-mobile-navigation';

export function AppSidebar() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const cleanup = useMobileNavigation();

    if (!user) return null;

    const mainNavItems = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: Home,
        },
        {
            title: 'Friends',
            url: '/dashboard/users',
            icon: Users,
        },
        {
            title: 'Notifications',
            url: '#',
            icon: Mail,
        },
        {
            title: 'Favorites',
            url: '/user/favorites',
            icon: Bookmark,
        },
        {
            title: 'Profile',
            url: user.username ? `/user/${user.username}` : '/user',
            icon: User,
        },
        {
            title: 'Settings',
            url: '/settings/profile',
            icon: Settings,
        },
    ];

    const footerNavItems = [
        {
            title: 'Repository',
            url: 'https://github.com/VicTrollhead/Spark',
            icon: Folder,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuButton size="lg" asChild >
                        <Link href="/dashboard" prefetch>
                            <AppLogo />
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavUser />
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
            </SidebarFooter>
        </Sidebar>
    );
}



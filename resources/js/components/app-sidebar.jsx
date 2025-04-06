import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarSeparator
} from './ui/sidebar';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Bookmark, BookOpen, Folder, Home, LogOut, Mail, Settings, User, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { useMobileNavigation } from '../hooks/use-mobile-navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { useInitials } from '@/hooks/use-initials.jsx';

export function AppSidebar() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const { post } = useForm();
    const getInitials = useInitials();

    if (!user) return null;

    const mainNavItems = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: Home,
        },
        {
            title: 'Friends',
            url: `/user/${user.username}/friends`,
            icon: Users,
        },
        {
            title: 'All users',
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

    const handleLogout = () => {
        router.post(`/logout`);
        window.location.href = "/login";
    };

    return (
        <Sidebar
                 variant="inset"
                 collapsible="none"
                 className="bg-transparent fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] shadow-md hidden lg:flex">
            <SidebarHeader>
                <NavUser />
            </SidebarHeader>

            <SidebarContent className="-mt-2">

                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <SidebarSeparator/>
                <a className="flex cursor-pointer" href="https://github.com/VicTrollhead/Spark">
                    <SidebarMenuButton size="lg" className="text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group cursor-pointer">
                        <Folder/>
                        Repository
                    </SidebarMenuButton>
                </a>
                <SidebarMenuButton
                    onClick={() => post(route('logout'))}
                    size="lg"
                    className="text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group cursor-pointer">
                    <LogOut/>
                    Log out
                </SidebarMenuButton>
            </SidebarFooter>
        </Sidebar>
    );
}



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
import { Link, router, usePage } from '@inertiajs/react';
import { Bookmark, BookOpen, Folder, Home, LogOut, Mail, Settings, User, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { useMobileNavigation } from '../hooks/use-mobile-navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { useInitials } from '@/hooks/use-initials.jsx';

export function AppSidebar() {
    const { auth } = usePage().props;
    const user = auth?.user;
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
                <SidebarMenu>
                    <div className="flex items-center gap-1">
                        <Link href={user.username ? `/user/${user.username}` : '/user'} prefetch>
                            <Avatar className="ml-2 my-3 size-12">
                                <AvatarImage src={user.profile_image_url} alt={user.name}/>
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="ml-2">
                            <h1 className="text-2l ml-1 font-bold text-gray-900 dark:text-white">{user.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                        </div>
                    </div>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="mt-4">
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
                    onClick={handleLogout}
                    size="lg"
                    className="text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group cursor-pointer">
                    <LogOut/>
                    Log out
                </SidebarMenuButton>
            </SidebarFooter>
        </Sidebar>
    );
}



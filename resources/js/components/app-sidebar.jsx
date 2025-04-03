import { NavMain } from './nav-main';
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
import { Bookmark, Home, LogOut, Mail, Settings, User, Users, Folder } from 'lucide-react';
import { Avatar, AvatarImage } from '@/components/ui/avatar.jsx';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation.js';

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
            title: 'Favourites',
            url: '#',
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

    const handleLogout = () => {
        router.post(`logout`);
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
                                <AvatarImage src={user.profile_image_url} alt={user.username[0]}/>
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



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
import { Link, usePage } from '@inertiajs/react';
import { Bookmark, Home, LogOut, Mail, Settings, User, Users } from 'lucide-react';
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

    return (
        <Sidebar
                 variant="inset"
                 collapsible="none"
                 className="bg-transparent hidden lg:flex">
            <SidebarHeader>
                <SidebarMenu>
                    <Link href={user.username ? `/user/${user.username}` : '/user'} prefetch>
                        <Avatar className="ml-2 my-3 size-25">
                            <AvatarImage src={user.profile_image_url}/>
                        </Avatar>
                    </Link>
                    <div className="flex items-center gap-1">
                        <h1 className="text-2l font-bold text-gray-900 dark:text-white">{user.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                    </div>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="mt-10">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <SidebarSeparator/>
                <Link className="flex cursor-pointer" method="post" href={route('logout')} as="button" onClick={cleanup}>
                    <SidebarMenuButton size="lg" className="text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group cursor-pointer">
                            <LogOut/>
                            Log out
                    </SidebarMenuButton>
                </Link>
            </SidebarFooter>
        </Sidebar>
    );
}



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
import { Bookmark, Home, LogOut, Mail, Settings, User, Users, Folder } from 'lucide-react';
import { Avatar, AvatarImage } from '@/components/ui/avatar.jsx';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation.js';
import { NavFooter } from './nav-footer.jsx';
import { UserInfo } from './user-info.jsx';

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

    const footerNavItems = [
        {
            title: 'Repository',
            url: "https://github.com/VicTrollhead/Spark",
            icon: Folder,
        },
        {
            title: 'Logout',
            url: '/logout',
            icon: LogOut,
        },
    ];

    return (
        <Sidebar
                 variant="inset"
                 collapsible="none"
                 className="bg-transparent hidden lg:flex">
            <SidebarHeader>
                <SidebarMenu>
                    <UserInfo user={user}/>
                    {/*<div className="flex items-center gap-1">*/}
                    {/*    <Link href={user.username ? `/user/${user.username}` : '/user'} prefetch>*/}
                    {/*        <Avatar className="ml-2 my-3 size-12">*/}
                    {/*            <AvatarImage src={user.profile_image_url} alt={user.username[0]}/>*/}
                    {/*        </Avatar>*/}
                    {/*    </Link>*/}
                    {/*    <div className="ml-2">*/}
                    {/*        <h1 className="text-2l ml-1 font-bold text-gray-900 dark:text-white">{user.name}</h1>*/}
                    {/*        <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="mt-auto">
                <SidebarSeparator/>
                <NavFooter items={footerNavItems}/>

            </SidebarFooter>
        </Sidebar>
    );
}



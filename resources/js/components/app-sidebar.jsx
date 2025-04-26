import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuButton,
    SidebarSeparator
} from './ui/sidebar';
import { useForm, usePage } from '@inertiajs/react';
import { Bookmark, Folder, Home, LogOut, Mail, Settings, User, Users, Repeat, MessagesSquareIcon  } from 'lucide-react';
import {useEffect, useState} from "react";

export function AppSidebar() {
    const { auth, translations } = usePage().props;
    const user = auth?.user;
    const { post } = useForm();
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await fetch('/notifications/unread-count');
                const data = await response.json();
                setUnreadNotificationsCount(data.unread_count);
            } catch (error) {
                console.error(error);
            }
        };

        fetchUnreadCount();
    }, []);

    if (!user) return null;

    const mainNavItems = [
        {
            title: translations['Dashboard'],
            url: '/dashboard',
            icon: Home,
        },
        {
            title: translations['Everyone chat'],
            url: `/chat`,
            icon: MessagesSquareIcon,
        },
        {
            title: translations['Friends'],
            url: `/user/${user.username}/friends`,
            icon: Users,
        },
        {
            title: translations['All users'],
            url: '/dashboard/users',
            icon: Users,
        },
        {
            title: translations['Notifications'],
            url: '/user/notifications',
            icon: Mail,
            count: unreadNotificationsCount,
        },
        {
            title: translations['Favorites'],
            url: '/user/favorites',
            icon: Bookmark,
        },
        {
            title: translations['Reposts'],
            url: '/user/reposts',
            icon: Repeat,
        },
        {
            title: translations['Profile'],
            url: user.username ? `/user/${user.username}` : '/user',
            icon: User,
        },
        {
            title: translations['Settings'],
            url: '/settings/profile',
            icon: Settings,
        },
    ];

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
                        {translations['Repository']}
                    </SidebarMenuButton>
                </a>
                <SidebarMenuButton
                    onClick={() => post(route('logout'))}
                    size="lg"
                    className="text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group cursor-pointer">
                    <LogOut/>
                    {translations['Log out']}
                </SidebarMenuButton>
            </SidebarFooter>
        </Sidebar>
    );
}



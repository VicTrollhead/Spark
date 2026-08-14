import { useForm, usePage } from '@inertiajs/react';
import { Bookmark, Folder, Hash, Home, LogOut, Mail, MessagesSquareIcon, Repeat, Settings, User, Users } from 'lucide-react';
import { useUnreadCounts } from '../contexts/unread-counts-context';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenuButton, SidebarSeparator } from './ui/sidebar';

export function AppSidebar() {
    const { auth, translations } = usePage().props;
    const user = auth?.user;
    const { post } = useForm();
    const { unreadNotifications, unreadMessages } = useUnreadCounts();

    if (!user) return null;

    const mainNavItems = [
        {
            title: translations['Dashboard'],
            url: '/dashboard',
            icon: Home,
        },
        {
            title: translations['Everyone chat'],
            url: `/chat/everyone`,
            icon: MessagesSquareIcon,
        },
        {
            title: translations['User chats'],
            url: `/chat/user-chats`,
            icon: MessagesSquareIcon,
            count: unreadMessages,
        },
        {
            title: translations['Friends'],
            url: `/user/friends`,
            icon: Users,
        },
        {
            title: translations['Notifications'],
            url: '/user/notifications',
            icon: Mail,
            count: unreadNotifications,
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
            title: translations['Popular hashtags'],
            url: '/show-popular-hashtags',
            icon: Hash,
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
            className="fixed top-16 left-0 hidden h-[calc(100vh-4rem)] w-[17rem] bg-transparent shadow-lg lg:flex"
        >
            <SidebarHeader>
                <NavUser />
            </SidebarHeader>

            <SidebarContent className="-mt-2">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <SidebarSeparator />
                <a className="flex cursor-pointer" href="https://gitlab.com/shapovalovtimur16/Spark">
                    <SidebarMenuButton size="lg" className="text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group cursor-pointer">
                        <Folder />
                        {translations['Repository']}
                    </SidebarMenuButton>
                </a>
                <SidebarMenuButton
                    onClick={() => post(route('logout'))}
                    size="lg"
                    className="text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group cursor-pointer"
                >
                    <LogOut />
                    {translations['Log out']}
                </SidebarMenuButton>
            </SidebarFooter>
        </Sidebar>
    );
}

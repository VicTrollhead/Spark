import { NavFooter } from './nav-footer';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton } from './ui/sidebar';
import { usePage } from '@inertiajs/react';
import { BookOpen, Folder, Home, User } from 'lucide-react';
import { Input } from './ui/input';

export function AppExtraSidebar() {
    const { auth } = usePage().props;
    const user = auth?.user;


    const mainNavItems = [
        {
            title: 'Test1',
            url: '/dashboard',
            icon: Home,
        },
        {
            title: 'Test2',
            url: user.username ? `/user/${user.username}` : '/user',
            icon: User,
        },
    ];

    return (
        <Sidebar
            side="right"
            variant="inset"
            className="hidden lg:block pr-2.5"
        >
            <SidebarHeader>
                <SidebarMenu className="pt-3">
                    <SidebarMenuButton size="lg" asChild className="flex-3/4">
                        <Input placeholder="Search..." className="w-full" />
                    </SidebarMenuButton>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>
        </Sidebar>
    );
}

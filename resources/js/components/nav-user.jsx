import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar';
import { UserInfo } from './user-info';
import { usePage, Link } from '@inertiajs/react';

export function NavUser() {
    const { auth } = usePage().props;

    return (<SidebarMenu>
        <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="text-sidebar-accent-foreground hover:bg-sidebar-accent py-9">
                <Link href="/user" className="w-full flex items-center">
                    <UserInfo user={auth.user} />
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
        </SidebarMenu>);
}


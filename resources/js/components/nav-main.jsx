import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar.jsx';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }) {
    const page = usePage();
    return (<SidebarGroup className="px-2 py-2">
            <SidebarMenu>
                {items.map((item) => (<SidebarMenuItem key={item.title}>
                        <SidebarMenuButton size="lg" asChild isActive={item.url === page.url} className="text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 ">
                            <Link href={item.url} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>))}
            </SidebarMenu>
        </SidebarGroup>);
}


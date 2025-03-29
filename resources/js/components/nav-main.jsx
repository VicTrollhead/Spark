import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar.jsx';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }) {
    const page = usePage();
    return (<SidebarGroup className="px-2 py-2">
            {/*<SidebarGroupLabel></SidebarGroupLabel>*/}
            <SidebarMenu>
                {items.map((item) => (<SidebarMenuItem key={item.title}>
                        <SidebarMenuButton size="lg" className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100" asChild isActive={item.url === page.url}>
                            <Link href={item.url} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>))}
            </SidebarMenu>
        </SidebarGroup>);
}


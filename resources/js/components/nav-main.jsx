import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar.jsx';
import { Link, usePage } from '@inertiajs/react';
import {Badge} from "../components/ui/badge.jsx";

export function NavMain({ items = [] }) {
    const page = usePage();
    return (<SidebarGroup className="px-2 py-2">
            <SidebarMenu>
                {items.map((item) => {
                    const isActive = item.url === page.url;
                    return (
                        <SidebarMenuItem key={item.title + item.url}>
                            {isActive && (
                                <span
                                    aria-hidden
                                    className="absolute left-0 top-1/2 z-10 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand"
                                />
                            )}
                            <SidebarMenuButton size="lg" asChild isActive={isActive} className="text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 text-[16px]">
                                <Link href={item.url} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                    {item.count && item.count !== 0 ? (<Badge className="bg-brand text-brand-foreground">{item.count}</Badge>) : ''}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>);
}


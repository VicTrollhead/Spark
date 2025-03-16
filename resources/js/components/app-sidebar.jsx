import { NavFooter } from './nav-footer';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Home, User } from 'lucide-react';
import AppLogo from './app-logo';
import AppearanceToggle from "./appearance-toggle";
// import { useState } from 'react';
// import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

const mainNavItems = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Home,
    },
    ///////////////////////////////////////////
    {
        title: 'Profile',
        url: '/user',
        icon: User,
    }
];

const footerNavItems = [
    {
        title: 'Repository',
        url: 'https://github.com/VicTrollhead/Spark',
        icon: Folder,
    },
    {
        title: 'Documentation',
        url: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    // const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    //
    // const toggleSidebar = () => {
    //     setIsSidebarOpen((prev) => !prev);
    // };
    return (<Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuButton size="lg" asChild className="flex-3/4">
                        <Link href="/dashboard" prefetch>
                            <AppLogo />
                        </Link>
                    </SidebarMenuButton>
                    {/*<SidebarMenuItem className="flex">*/}
                    {/*    <SidebarMenuButton size="lg" asChild className="flex-3/4">*/}
                    {/*        <Link href="/dashboard" prefetch>*/}
                    {/*            <AppLogo />*/}
                    {/*        </Link>*/}
                    {/*    </SidebarMenuButton>*/}
                    {/*    <AppearanceToggle className="flex-2/12 justify-center"/>*/}
                    {/*</SidebarMenuItem>*/}
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems}/>
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto"/>
                <NavUser />
            </SidebarFooter>
        </Sidebar>);
}


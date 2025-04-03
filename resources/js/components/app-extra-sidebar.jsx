import { NavMain } from './nav-main';
import { Sidebar, SidebarContent } from './ui/sidebar';
import { usePage } from '@inertiajs/react';
import { Input } from './ui/input';
import { useEffect, useState } from 'react';
import { Home, User } from 'lucide-react';

export function AppExtraSidebar() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const isLargeScreen = useMediaQuery("(min-width: 1024px)");

    function useMediaQuery(query) {
        const [matches, setMatches] = useState(window.matchMedia(query).matches);

        useEffect(() => {
            const mediaQuery = window.matchMedia(query);
            const handleChange = () => setMatches(mediaQuery.matches);

            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        }, [query]);

        return matches;
    }


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
            collapsible={isLargeScreen ? "offcanvas" : "none"}
            className="bg-transparent fixed top-16 right-0 w-64 h-[calc(100vh-4rem)] shadow-md hidden lg:block pr-2.5"
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

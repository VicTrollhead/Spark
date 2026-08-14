import AppearanceToggle from './appearance-toggle';
import { Breadcrumbs } from './breadcrumbs';
import { SidebarTrigger } from './ui/sidebar';

//top line hint

const topNavItems = [
    {
        title: 'News',
        url: '/dashboard',
    },
    {
        title: 'Following',
        // url: `/user/${user.username}/following`,
    },
    {
        title: 'Liked posts',
        url: '#',
    },
];

export function AppSidebarHeader({ breadcrumbs = [] }) {
    return (
        <header className="border-sidebar-border/50 bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-3 md:hidden lg:hidden" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div>
                <AppearanceToggle className="justify-center p-2.5" />
            </div>
        </header>
    );
}

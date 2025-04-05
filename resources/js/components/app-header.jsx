import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Bookmark, Folder, FolderHeart,
    Home, List,
    LogOut,
    Mail,
    Menu, Search,
    Settings,
    User,
    Users
} from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';
import { Input } from '@/components/ui/input.jsx';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx';

const activeItemStyles = 'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

export function AppHeader({ breadcrumbs = [] }) {
    const page = usePage();
    const { auth } = page.props;
    const user = auth?.user;
    if (!user) return null;

    const mainNavItems = [
        {
            title: 'News',
            url: '/dashboard',
        },
        {
            title: 'Following',
            url: `/user/${user.username}/following`,
        },
        {
            title: 'Liked posts',
            url: '/user/liked',
        },
    ];

    const sideBarNavItems = [
        {
            title: 'News',
            url: '/dashboard',
            icon: Home,
        },
        {
            title: 'Following',
            url: `/user/${user.username}/following`,
            icon: List,
        },
        {
            title: 'Liked posts',
            url: '/user/liked',
            icon: FolderHeart,
        },
        {
            title: 'Friends',
            url: `/user/${user.username}/friends`,
            icon: Users,
        },
        {
            title: 'All users',
            url: '/dashboard/users',
            icon: Users,
        },
        {
            title: 'Notifications',
            url: '#',
            icon: Mail,
        },
        {
            title: 'Favourites',
            url: '/user/favorites',
            icon: Bookmark,
        },
        {
            title: 'Profile',
            url: user.username ? `/user/${user.username}` : '/user',
            icon: User,
        },
        {
            title: 'Settings',
            url: '/settings/profile',
            icon: Settings,
        },
    ];
    const handleLogout = () => {
        router.post(`/logout`);
        window.location.href = "/login";
    };

    return (<>
            <div className="border-sidebar-border/80 border-b fixed top-0 left-0 w-full z-50 bg-white dark:bg-neutral-950">
                <div className="mx-4 flex h-16 ">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2 my-4 h-[34px] w-[34px]">
                                    <Menu className="h-5 w-5"/>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-sidebar flex h-full w-64 flex-col items-stretch justify-between pl-5">
                                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white"/>
                                </SheetHeader>
                                <div className="mt-6 flex h-full flex-1 flex-col space-y-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {sideBarNavItems.map((item) => (
                                                <Link key={item.title} href={item.url} className="flex items-center space-x-2 font-medium">
                                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5"/>}
                                                    <span>{item.title}</span>
                                                </Link>))}
                                           <DropdownMenuSeparator className="mb-5"/>
                                            <a className="flex items-center space-x-2 font-medium" href="https://github.com/VicTrollhead/Spark">
                                                <Folder className="h-5 w-5"/>
                                                <span>Repository</span>
                                            </a>
                                            <Button
                                                onClick={handleLogout}
                                                size="lg"
                                                className="data-[state=open]:bg-sidebar-accent group cursor-pointer mr-auto mt-3">
                                                <LogOut/>
                                                Log out
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link href="/dashboard" prefetch className="flex items-center space-x-2 w-1/6">
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden w-full h-full items-center justify-around lg:flex">
                        <NavigationMenu className="flex h-full w-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-70 w-full">
                                {mainNavItems.map((item, index) => (<NavigationMenuItem key={index} className="relative flex h-full w-full items-center">
                                        <Link href={item.url} className={cn(navigationMenuTriggerStyle(), page.url === item.url && activeItemStyles, 'h-9 cursor-pointer px-3')}>
                                            {item.title}
                                        </Link>
                                        {page.url === item.url && (<div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>)}
                                    </NavigationMenuItem>))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto items-center justify-end space-x-2 w-1/4 hidden xl:flex">
                        <div className="relative flex items-center space-x-1">
                            <div className="flex items-center space-x-3">
                                <Search className="size-1/8 opacity-80 group-hover:opacity-100"/>
                                <Input placeholder="Search" className="w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (<div className="border-sidebar-border/70 flex w-full border-b">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs}/>
                    </div>
                </div>)}
        </>);
}


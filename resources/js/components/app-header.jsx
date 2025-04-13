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
import { Input } from '@/components/ui/input.jsx';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { useInitials } from '@/hooks/use-initials.jsx';
import AppearanceToggle from '@/components/appearance-toggle.jsx';

const activeItemStyles = 'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

export function AppHeader({ breadcrumbs = [] }) {
    const page = usePage();
    const { translations } = usePage().props;
    const { auth } = page.props;
    const user = auth?.user;
    const getInitials = useInitials();
    if (!user) return null;

    const mainNavItems = [
        {
            title: translations['News'],
            url: '/dashboard',
        },
        {
            title: translations['Following'],
            url: `/user/following-posts`,
        },
        {
            title: translations['Liked'],
            url: '/user/liked',
        },
    ];

    const sideBarNavItems = [
        {
            title: translations['Dashboard'],
            url: '/dashboard',
            icon: Home,
        },
        {
            title: translations['Following'],
            url: `/user/following-posts`,
            icon: List,
        },
        {
            title: translations['Liked'],
            url: '/user/liked',
            icon: FolderHeart,
        },
        {
            title: translations['Friends'],
            url: `/user/${user.username}/friends`,
            icon: Users,
        },
        {
            title: translations['All users'],
            url: '/dashboard/users',
            icon: Users,
        },
        {
            title: translations['Notifications'],
            url: '#',
            icon: Mail,
        },
        {
            title: translations['Favourites'],
            url: '/user/favorites',
            icon: Bookmark,
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

    const onKeyDownSearch = async (e) => {
        if (e.code === 'Enter') {
            const searchText = e.currentTarget.value;
            router.get(`/user/search/${searchText}`, { sort: 'newest' }, { preserveScroll: true });
        }
    };

    const handleLogout = () => {
        router.post(`/logout`);
        window.location.href = "/login";
    };

    return (<>
            <div className="border-sidebar-border/80 border-b fixed top-0 left-0 w-full z-50 bg-white dark:bg-neutral-950">
                <div className="mx-4 flex h-16">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2 my-4 h-9 w-9 hover:bg-neutral-300 dark:hover:bg-neutral-800">
                                    <Menu className="h-6 w-6"/>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-sidebar flex h-full w-64 flex-col items-stretch justify-between pl-5 gap-0">
                                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                <SheetHeader className="flex justify-start text-left p-0 pt-3">
                                    <div className="flex items-center gap-1">
                                        <Link href={user.username ? `/user/${user.username}` : '/user'} prefetch>
                                            <Avatar className="my-3 size-10">
                                                <AvatarImage src={user.profile_image_url} alt={user.name}/>
                                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <Link href={user.username ? `/user/${user.username}` : '/user'} prefetch className="ml-2">
                                            <h1 className="text-1l ml-1 font-bold text-gray-900 dark:text-white">{user.name}</h1>
                                            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                                        </Link>
                                    </div>
                                </SheetHeader>
                                <div className="mt-4 flex h-full flex-1 flex-col ">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {sideBarNavItems.map((item) => (
                                                <Link key={item.title} href={item.url} className="flex items-center space-x-2 ">
                                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5"/>}
                                                    <span>{item.title}</span>
                                                </Link>))}
                                           <DropdownMenuSeparator className="mb-5"/>
                                            <a className="flex items-center space-x-2 " href="https://github.com/VicTrollhead/Spark">
                                                <Folder className="h-5 w-5"/>
                                                <span>{translations['Repository']}</span>
                                            </a>
                                            <p onClick={handleLogout}
                                                className="flex items-center space-x-2 cursor-pointer">
                                                <LogOut className="h-5 w-5 mr-2"/>
                                                {translations['Log out']}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="flex items-center space-x-2 w-1/6">
                        <Link href="/dashboard" prefetch>
                            <AppLogo />
                        </Link>
                        <AppearanceToggle className="justify-center ml-4 p-2.5"/>
                    </div>

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
                                <Input placeholder={translations['Search users']} className="w-full" onKeyDown={onKeyDownSearch}  />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/*{breadcrumbs.length > 1 && (<div className="border-sidebar-border/70 flex w-full border-b">*/}
            {/*        <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">*/}
            {/*            <Breadcrumbs breadcrumbs={breadcrumbs}/>*/}
            {/*        </div>*/}
            {/*    </div>)}*/}
        </>);
}


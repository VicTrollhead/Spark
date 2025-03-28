import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, Menu, Search } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';
import { Input } from '@/components/ui/input.jsx';
import AppearanceToggle from '@/components/appearance-toggle.jsx';

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
            title: 'Liked',
            url: '#',
        },
    ];

    // const rightNavItems = [
    //     {
    //         title: 'Repository',
    //         url: 'https://github.com/laravel/react-starter-kit',
    //         icon: Folder,
    //     },
    //     {
    //         title: 'Documentation',
    //         url: 'https://laravel.com/docs/starter-kits',
    //         icon: BookOpen,
    //     },
    // ];

    return (<>
            <div className="border-sidebar-border/80 border-b">
                <div className="mx-4 flex h-16  px-4 ">
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
                                            {mainNavItems.map((item) => (<Link key={item.title} href={item.url} className="flex items-center space-x-2 font-medium">
                                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5"/>}
                                                    <span>{item.title}</span>
                                                </Link>))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link href="/dashboard" prefetch className="flex items-center space-x-2 w-1/4">
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
                            <div>
                                <AppearanceToggle className="justify-center p-2.5"/>
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


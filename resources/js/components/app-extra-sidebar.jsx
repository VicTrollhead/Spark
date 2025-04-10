import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarSeparator } from './ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { UserInfo } from '@/components/user-info.jsx';
import TextLink from '@/components/text-link.jsx';

export function AppExtraSidebar() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [users, setUsers] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const isLargeScreen = useMediaQuery("(min-width: 1024px)");

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/users-list');
                const users = await response.json();
                setUsers(users);
            } catch (error) {
                console.error('Ошибка при загрузке пользователей:', error);
            }

            try {
                const response = await fetch('/popular-hashtags');
                const hashtags = await response.json();
                setHashtags(hashtags);
            } catch (error) {
                console.error('Ошибка при загрузке хэштегов:', error);
            }
        }
        fetchData();
    }, [user]);

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

    return (
        <Sidebar
            side="right"
            variant="inset"
            // collapsible={isLargeScreen ? "offcanvas" : "none"}
            collapsible="none"
            className="bg-transparent fixed top-16 right-0 w-65 h-[calc(100vh-4rem)] shadow-md hidden lg:block pr-2.5"
        >
            <SidebarHeader>

            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu className="pt-1 px-2">
                    <h2 className="my-1 font-bold">Let's get acquainted</h2>
                    {users.length === 0 ? (
                        <p className="text-gray-500">Not users anyone yet.</p>
                    ) : (
                        <ul>
                            {users.map((user) => (
                                <SidebarMenuButton asChild key={user.id} className="flex items-center gap-1 border-b py-9 dark:border-gray-700">
                                    <Link href={`/user/${user.username}`} className="w-full flex items-center">
                                        <UserInfo user={user} />
                                    </Link>
                                </SidebarMenuButton>
                            ))}
                        </ul>
                    )}
                    <TextLink href={'/dashboard/users'} className='my-2 mx-5 hover:text-neutral-700 font-serif'>All users</TextLink>
                    <SidebarSeparator/>
                    <h2 className="my-1 font-bold">Popular hashtags</h2>
                    {hashtags.length === 0 ? (
                        <p className="text-gray-500">Not hashtags anyone yet.</p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {hashtags.map((hashtag) => (
                                <TextLink href={`/posts-by-hashtag/${hashtag.id}`} className='mx-5 no-underline hover:text-neutral-700 font-serif'>#{hashtag.name}</TextLink>
                            ))}
                        </div>
                    )}
                    <SidebarSeparator/>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}

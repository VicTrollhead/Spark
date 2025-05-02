import { usePage, Link, Head, router } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
import {useEffect, useState} from 'react';
import {RefreshCw, SendIcon} from 'lucide-react';
import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription, DialogHeader,
    DialogTitle,
    DialogTrigger
} from "../../components/ui/dialog.jsx";
import {Input} from "../../components/ui/input.jsx";
import {Badge} from "../../components/ui/badge.jsx";

export default function UserChats() {
    const { auth, chats, users, translations } = usePage().props;
    const user = auth?.user;
    const getInitials = useInitials();
    const [isLoading, setIsLoading] = useState(false);
    const [usersSearch, setUsersSearch] = useState(users || []);
    const onSearchChange = async (e) => {
        const searchTerm = e.target.value.toLowerCase();

        const filteredUsers = users.filter(user =>
            user.name.toLowerCase().includes(searchTerm) ||
            user.username.toLowerCase().includes(searchTerm)
        );

        setUsersSearch(filteredUsers);
    };

    useEffect(() => {

        window.Echo.private(`user-chats.${user.id}`)
            .listen('UserMessageCreated', handleReload)
            .listen('UserMessageIsReadChange', handleReload);

        setTimeout(handleReload, 0);
        return () => {
            window.Echo.leave(`user-chats.${user.id}`);
        };
    }, []);

    const handleReload = () => {
        setIsLoading(true);
        router.reload({
            only: ['chats'],
            preserveState: true,
            preserveScroll: true,
        });
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);

        date.setHours(date.getHours() + 3);

        const shiftedNow = new Date();
        shiftedNow.setHours(shiftedNow.getHours() + 3);

        const isToday =
            date.getFullYear() === shiftedNow.getFullYear() &&
            date.getMonth() === shiftedNow.getMonth() &&
            date.getDate() === shiftedNow.getDate();

        return isToday
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleString([], {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
    };

    return (
        <AppLayout>
            <Head title={translations['User chats']} />
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{translations['User chats']}</h1>
                    <div className="flex items-center flex-row gap-2">
                        <Dialog>
                            <DialogTrigger >
                                <div className="flex gap-1 items-center p-2 font-semibold dark:text-white text-gray-800 border rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 transition cursor-pointer">
                                    <SendIcon className="w-5 h-5" /><span className="hidden md:flex">{translations['Start new chat']}</span>
                                </div>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {translations['Select user to start new chat']}
                                    </DialogTitle>
                                    <DialogDescription className="h-[50vh] overflow-y-auto flex flex-col gap-3">
                                        <span className="flex items-center space-x-3">
                                            <Input placeholder={translations['Search users']} className="w-full" onChange={onSearchChange} />
                                        </span>
                                        {usersSearch.length === 0 ? (
                                            <DialogClose className="text-gray-500 text-center text-lg mt-4">{translations['Not friends for chat anyone yet.']}</DialogClose>
                                        ) : (usersSearch.map((user) => (
                                            <DialogClose key={user.id}
                                                         onClick={() => router.post(`/chat/user-chat/new/${user.id}`)}
                                                         className="flex flex-row gap-3 border dark:border-gray-600 rounded-md px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                                <Avatar className="my-auto h-12 w-12 md:h-15 md:w-15 border-2 border-neutral-800 dark:border-gray-400">
                                                    <AvatarImage src={user.profile_image_url} alt={user.name} />
                                                    <AvatarFallback className="rounded-full bg-gray-300 text-4xl text-black dark:bg-gray-700 dark:text-white">
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col w-full gap-2 text-sm md:text-lg">
                                                    <div className="flex flex-row gap-1 flex-wrap">
                                                        <span className="ml-1 font-bold">{user.name}</span>
                                                        <span className="text-gray-500 dark:text-gray-400 hidden sm:flex">@{user.username}</span>
                                                    </div>
                                                </div>
                                            </DialogClose>
                                        )))}
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                        <button
                            onClick={handleReload}
                            className="p-2 font-semibold dark:text-white text-gray-800 border rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                            <RefreshCw
                                className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                            />
                        </button>
                    </div>
                </div>
                {chats.length === 0 ? (
                    <p className="text-gray-500 mt-1">{translations['Not chats anyone yet.']}</p>
                ) : (
                    <ul className="overflow-y-auto">
                        {chats.map((chat) => (
                            <li key={chat.id} className="border dark:border-gray-600 rounded-md px-4 py-2 mt-2 hover:bg-gray-200 dark:hover:bg-gray-700">
                                <Link href={`/chat/user-chat/${chat.user.username}`} className="flex flex-row gap-3">
                                    <Avatar className="my-auto h-12 w-12 md:h-15 md:w-15 border-2 border-neutral-800 dark:border-gray-400">
                                        <AvatarImage src={chat.user.profile_image_url} alt={chat.user.name} />
                                        <AvatarFallback className="rounded-full bg-gray-300 text-4xl text-black dark:bg-gray-700 dark:text-white">
                                            {getInitials(chat.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col w-full gap-2 text-sm md:text-lg">
                                        <div className="flex flex-row gap-1 flex-wrap">
                                            <span className="ml-1 font-bold">{chat.user.name}</span>
                                            <span className="text-gray-500 dark:text-gray-400 hidden sm:flex">@{chat.user.username}</span>
                                        </div>
                                        <div className="ml-1 text-sm flex flex-row gap-2">
                                            <p>
                                                {chat.last_message
                                                ? chat.last_message.text
                                                : translations['No messages anyone yet.']}
                                            </p>
                                            {chat.unread_count && chat.unread_count !== 0 ? (<Badge className="bg-neutral-500 dark:bg-neutral-300">{chat.unread_count}</Badge>) : ''}
                                        </div>
                                    </div>
                                    <div>
                                        {chat.last_message
                                            ? (
                                                <p className="text-gray-500 text-sm">{formatMessageTime(chat.last_message.time)}</p>
                                            )
                                            : ''}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}

import React from "react";
import {Link} from "@inertiajs/react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.jsx";
import {useInitials} from "@/hooks/use-initials.jsx";

export default function Message({ userId, message }) {
    const getInitials = useInitials();
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
        <>
            {userId === message.user.id ? (
                // Сообщение от текущего пользователя
                <div className="flex justify-end mb-2">
                    <div className="w-full sm:max-w-md">
                        <div className="flex justify-end">
                            <div className="rounded-md px-4 py-2 flex flex-col gap-1 text-lg bg-blue-500 text-white dark:bg-blue-900 break-words w-fit max-w-full">
                                <span className="whitespace-pre-wrap break-words">
                                    {message.text}
                                </span>
                                <span className="text-xs text-blue-100 dark:text-white text-right">
                                    {formatMessageTime(message.time)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            ) : (
                // Сообщение от другого пользователя
                <div className="flex mb-2">
                    <div className="w-full sm:max-w-md">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <Link href={`/user/${message.user.username}`} className="w-full flex items-center">
                                <div className="flex items-center gap-2">
                                    <div className="grid flex-1 text-left leading-tight">
                                        <div>
                                            <span className="truncate text-lg text-black dark:text-white">
                                                {message.user.name}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-neutral-700 dark:text-white">
                                        {formatMessageTime(message.time)}
                                    </span>
                                </div>
                            </Link>
                        </div>
                        <div className="flex flex-row gap-2">
                            <Link href={`/user/${message.user.username}`} className="hidden md:flex">
                                <Avatar className="h-10 w-10 overflow-hidden rounded-full">
                                    <AvatarImage
                                        src={message.user.profile_image_url}
                                        alt={message.user.name}
                                    />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(message.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="rounded-md w-fit max-w-full px-4 py-2 text-lg bg-gray-200 text-gray-800 dark:bg-neutral-900 dark:text-white break-words">
                                <span className="whitespace-pre-wrap break-words">
                                    {message.text}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

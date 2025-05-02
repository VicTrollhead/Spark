import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Link, router, usePage } from '@inertiajs/react';
import { EllipsisVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useInitials } from '../hooks/use-initials.jsx';

export default function Message({ userId, message }) {
    const { translations } = usePage().props;
    const getInitials = useInitials();
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef(null);
    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);

        date.setHours(date.getHours() + 3);

        const shiftedNow = new Date();
        shiftedNow.setHours(shiftedNow.getHours() + 3);

        const isToday =
            date.getFullYear() === shiftedNow.getFullYear() && date.getMonth() === shiftedNow.getMonth() && date.getDate() === shiftedNow.getDate();

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

    useEffect(() => {
        function handleClickOutside(event) {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        }

        if (showOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showOptions]);

    const toggleOptions = () => setShowOptions((prev) => !prev);

    return (
        <>
            {userId === message.user.id ? (
                <div className="mb-2 flex justify-end">
                    <div className="w-full sm:max-w-md">
                        <div className="flex justify-end">
                            <div className="relative my-auto mr-2" ref={optionsRef}>
                                <EllipsisVertical
                                    className="h-5 w-5 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                                    onClick={toggleOptions}
                                />
                                {showOptions && (
                                    <div className="absolute right-0 z-50 mt-2 min-w-[140px] rounded-md border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-neutral-800">
                                        <button
                                            onClick={() => router.delete(`/chat/message/${message.id}`)}
                                            className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        >
                                            {translations['Delete']}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex w-fit max-w-full flex-col gap-1 rounded-md bg-blue-500 px-4 py-2 text-lg break-words text-white dark:bg-blue-900">
                                <span className="break-words whitespace-pre-wrap">{message.text}</span>
                                <span className="text-right text-xs text-blue-100 dark:text-white">{formatMessageTime(message.time)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-2 flex">
                    <div className="w-full sm:max-w-md">
                        <div className="mb-1 flex justify-between text-xs text-gray-500">
                            <Link href={`/user/${message.user.username}`} className="flex w-fit items-center">
                                <div className="flex items-center gap-2">
                                    <div className="grid flex-1 text-left leading-tight">
                                        <div>
                                            <span className="truncate text-lg text-black hover:underline dark:text-white">{message.user.name}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-neutral-700 dark:text-white">{formatMessageTime(message.time)}</span>
                                </div>
                            </Link>
                        </div>
                        <div className="flex flex-row gap-2">
                            <Link href={`/user/${message.user.username}`} className="hidden md:flex">
                                <Avatar className="h-10 w-10 overflow-hidden rounded-full">
                                    <AvatarImage src={message.user.profile_image_url} alt={message.user.name} />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(message.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="w-fit max-w-full rounded-md bg-gray-200 px-4 py-2 text-lg break-words text-gray-800 dark:bg-neutral-900 dark:text-white">
                                <span className="break-words whitespace-pre-wrap">{message.text}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

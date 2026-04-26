import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Link, router, usePage } from '@inertiajs/react';
import { Check, CheckCheck, EllipsisVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useInitials } from '../hooks/use-initials.jsx';
import { getProfileImageUrl } from '../lib/utils';

export default function Message({ userId, message }) {
    const { translations } = usePage().props;
    const getInitials = useInitials();
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef(null);
    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();

        const isToday =
            date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

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

    const mediaItems = message.media && message.media.length > 0 ? message.media : [];

    const renderMedia = () => {
        if (mediaItems.length === 0) return null;
        return (
            <div className={`flex flex-wrap gap-1 ${mediaItems.length === 1 ? '' : 'max-w-xs'}`}>
                {mediaItems.map((media, i) => (
                    media.file_type === 'video' ? (
                        <video key={i} src={media.url} controls className="max-h-48 max-w-full rounded-md" />
                    ) : (
                        <a key={i} href={media.url} target="_blank" rel="noopener noreferrer">
                            <img src={media.url} alt="" className="max-h-48 max-w-full rounded-md object-cover" />
                        </a>
                    )
                ))}
            </div>
        );
    };

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

                            <div className="flex w-fit max-w-full flex-col gap-1 rounded-2xl bg-brand-gradient px-4 py-2 text-lg break-words text-white shadow-sm">
                                {renderMedia()}
                                {message.text && <span className="break-words whitespace-pre-wrap">{message.text}</span>}
                                <span className="flex items-center justify-end gap-1 text-xs text-blue-100 dark:text-white">
                                    {formatMessageTime(message.time)}
                                    {message.chat_id && (
                                        message.read_at
                                            ? <CheckCheck className="h-3.5 w-3.5 text-blue-200" />
                                            : <Check className="h-3.5 w-3.5 text-blue-200/60" />
                                    )}
                                </span>
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
                                    <div className="grid min-w-0 flex-1 text-left leading-tight">
                                        <div className="flex items-center gap-1">
                                            <span className="truncate text-lg text-black hover:underline dark:text-white">{message.user.name}</span>
                                            {message.user.is_verified && (
                                                <div className="group relative">
                                                    <span className="top absolute -top-7 left-1/2 -translate-x-1/2 scale-0 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                                                        Verified
                                                    </span>
                                                    <span className="flex items-center rounded-full bg-blue-500 p-0.5 text-xs font-medium text-white">
                                                        <Check className="h-3 w-3" />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs text-neutral-700 dark:text-white">{formatMessageTime(message.time)}</span>
                                </div>
                            </Link>
                        </div>
                        <div className="flex flex-row gap-2">
                            <Link href={`/user/${message.user.username}`} className="hidden sm:flex">
                                <Avatar className="h-10 w-10 overflow-hidden rounded-full">
                                    <AvatarImage src={getProfileImageUrl(message.user)} alt={message.user.name} />
                                    <AvatarFallback className="rounded-lg bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
                                        {getInitials(message.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="w-fit max-w-full rounded-2xl bg-muted px-4 py-2 text-lg break-words text-foreground shadow-sm">
                                {renderMedia()}
                                {message.text && <span className="break-words whitespace-pre-wrap">{message.text}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

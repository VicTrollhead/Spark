import React, { useEffect, useRef, useState } from "react";
import Message from "../../components/message.jsx";
import MessageInput from "../../components/message-input.jsx";
import {Head, Link, router, usePage} from "@inertiajs/react";
import AppLayout from "../../layouts/app-layout.jsx";
import {Avatar, AvatarFallback, AvatarImage} from "../../components/ui/avatar.jsx";
import {useInitials} from "../../hooks/use-initials.jsx";

export default function UserChat () {
    const { user, chat_id, init_messages, other_user, translations } = usePage().props;
    const [messages, setMessages] = useState(init_messages || []);
    const scroll = useRef();
    const getInitials = useInitials();
    const scrollToBottom = () => {
        if (scroll && scroll.current)
            scroll.current.scrollIntoView({ behavior: "smooth" });
    };

    const webSocketChannel = `chat.${chat_id}`;
    const connectWebSocket = () => {
        window.Echo.private(webSocketChannel)
            .listen('GotPersonalMessage', async (e) => {
                await getMessages();
            });
    }

    const isUserAtBottom = () => {
        const container = document.getElementById('chat-scroll-container');
        if (!container) return false;

        const threshold = 10;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        return distanceFromBottom < threshold;
    };

    const getMessages = async () => {
        try {
            router.reload({
                only: ['init_messages'],
                preserveState: true,
                preserveScroll: true,
                onSuccess: ({ props }) => {
                    setMessages(props.init_messages || []);
                }
            });

        } catch (err) {
            console.log(err.message);
        }
    };

    useEffect(() => {
        connectWebSocket();
        setTimeout(scrollToBottom, 0);

        const container = document.getElementById('chat-scroll-container');

        const handleScroll = async () => {
            const threshold = 10;
            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

            if (distanceFromBottom < threshold) {
                router.post(`/chat/user-chat/${chat_id}/mark-messages-as-read`);
            }
        };

        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            window.Echo.leave(webSocketChannel);
        }
    }, []);

    useEffect(() => {
        setMessages(init_messages);
        const shouldScroll = isUserAtBottom();
        if (shouldScroll) {
            setTimeout(scrollToBottom, 0);
        }
    }, [init_messages]);

    return (
        <AppLayout>
            <Head title={`${translations['Chat with']} ${other_user.name}`} />
            <div className="flex justify-center h-fit">

                <div className="w-full">
                    <div className="w-full flex flex-row items-center h-[8vh] bg-gray-200 dark:bg-neutral-700">
                        <Link href={`/user/${other_user.username}`} className="flex flex-row items-center cursor-pointer">
                            <Avatar className="h-10 w-10 md:h-12 md:w-12 mx-5 overflow-hidden rounded-full">
                                <AvatarImage
                                    src={other_user.profile_image_url}
                                    alt={other_user.name}
                                />
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(other_user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-lg">{`${translations['Chat with']} ${other_user.name}`}</span>
                        </Link>
                    </div>
                    <div className="bg-white dark:border-gray-800 dark:bg-neutral-950 shadow-md rounded-lg flex flex-col h-[82vh] max-h-[82vh]">
                        <div id={"chat-scroll-container"} className="flex-1 flex flex-col overflow-y-auto px-4 py-3">
                            {messages?.length > 0 ? (
                                <>
                                    <div className="mt-auto flex flex-col gap-2">
                                        {messages.map((message, index) => (
                                            <Message
                                                key={message.id || index}
                                                userId={user.id}
                                                message={message}
                                            />
                                        ))}
                                        <span ref={scroll}></span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-center">
                                    {translations['No messages anyone yet.']}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t">
                            <MessageInput chatId={chat_id} />
                        </div>
                    </div>
                </div>
            </div>

        </AppLayout>
    );
};

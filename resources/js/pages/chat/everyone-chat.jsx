import React, { useEffect, useRef, useState } from "react";
import Message from "../../components/message.jsx";
import MessageInput from "../../components/message-input.jsx";
import {Head, Link, usePage} from "@inertiajs/react";
import { Users } from "lucide-react";
import AppLayout from "@/layouts/app-layout.jsx";

export default function EveryoneChat () {
    const { user, init_messages, translations } = usePage().props;
    const [messages, setMessages] = useState(init_messages || []);
    const scroll = useRef();
    const scrollToBottom = () => {
        if (scroll && scroll.current)
            scroll.current.scrollIntoView({ behavior: "smooth" });
    };

    const webSocketChannel = `channel_for_everyone`;
    const connectWebSocket = () => {
        window.Echo.private(webSocketChannel)
            .listen('GotMessage', (e) => {
                const newMessage = e.message;
                setMessages((prev) => {
                    if (prev.some((m) => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
                setTimeout(scrollToBottom, 0);
            });
    };

    useEffect(() => {
        connectWebSocket();
        setTimeout(scrollToBottom, 0);
        return () => {
            window.Echo.leave(webSocketChannel);
        }
    }, []);

    useEffect(() => {
        setMessages(init_messages);
        setTimeout(scrollToBottom, 0);
    }, [init_messages]);

    return (
        <AppLayout>
            <Head title={translations['Everyone chat']} />
            <div className="flex w-full flex-col" style={{ height: 'calc(100dvh - var(--header-h) - var(--mobile-nav-h))' }}>
                <div className="flex h-12 shrink-0 w-full items-center justify-between bg-gray-200 px-5 dark:bg-neutral-800">
                    <span className="text-sm font-bold md:text-lg">{translations['Everyone chat']}</span>
                    <Link href="/dashboard/users" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-300 dark:text-gray-300 dark:hover:bg-neutral-700">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">{translations['All users'] || 'All users'}</span>
                    </Link>
                </div>
                <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-3">
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
                    <div className="shrink-0 border-t p-4">
                        <MessageInput />
                    </div>
                </div>
            </div>

        </AppLayout>
    );
};

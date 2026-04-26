import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import MessageInput from '../../components/message-input.jsx';
import Message from '../../components/message.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar.jsx';
import { useInitials } from '../../hooks/use-initials.jsx';
import AppLayout from '../../layouts/app-layout.jsx';
import { getProfileImageUrl } from '../../lib/utils';
import { useOnlineUsers } from '../../hooks/use-online-users';
import { OnlineIndicator } from '../../components/online-indicator';
import { useUnreadCounts } from '../../contexts/unread-counts-context';

export default function UserChat() {
    const { user, chat_id: initialChatId, init_messages, other_user, translations } = usePage().props;
    const [chatId, setChatId] = useState(initialChatId);
    const [messages, setMessages] = useState(init_messages || []);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const onlineUserIds = useOnlineUsers();
    const typingTimerRef = useRef(null);
    const markReadTimerRef = useRef(null);
    const scroll = useRef();
    const getInitials = useInitials();
    const { refreshMessageCount } = useUnreadCounts();

    const scrollToBottom = () => {
        if (scroll && scroll.current) scroll.current.scrollIntoView({ behavior: 'smooth' });
    };

    // Debounced mark-as-read using lightweight fetch instead of Inertia router
    const markMessagesAsRead = useCallback(() => {
        if (!chatId) return;
        clearTimeout(markReadTimerRef.current);
        markReadTimerRef.current = setTimeout(() => {
            fetch(`/chat/user-chat/${chatId}/mark-messages-as-read`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Accept': 'application/json',
                },
            }).then(() => {
                refreshMessageCount();
            }).catch(() => {});
        }, 300);
    }, [chatId, refreshMessageCount]);

    // Called by message-input after first message creates the chat
    const handleChatCreated = useCallback((newChatId) => {
        setChatId(newChatId);
    }, []);

    // WebSocket connection - only when chatId exists
    useEffect(() => {
        if (!chatId) return;

        const channel = window.Echo.private(`chat.${chatId}`);
        channel
            .listen('GotPersonalMessage', (e) => {
                const newMessage = {
                    id: e.id,
                    text: e.text,
                    time: e.time,
                    chat_id: e.chat_id,
                    read_at: null,
                    media: e.media || [],
                    user: e.user.id === user.id
                        ? { ...e.user, profile_image: user.profile_image, is_verified: user.is_verified }
                        : { ...e.user, profile_image: other_user.profile_image, is_verified: other_user.is_verified },
                };
                const shouldScroll = isUserAtBottom();
                setMessages((prev) => {
                    if (prev.some((m) => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
                setIsOtherUserTyping(false);
                clearTimeout(typingTimerRef.current);
                if (shouldScroll) {
                    setTimeout(scrollToBottom, 0);
                    markMessagesAsRead();
                }
            })
            .listen('UserTyping', (e) => {
                if (e.user_id !== user.id) {
                    setIsOtherUserTyping(true);
                    clearTimeout(typingTimerRef.current);
                    typingTimerRef.current = setTimeout(() => {
                        setIsOtherUserTyping(false);
                    }, 3000);
                }
            })
            .listen('MessagesRead', (e) => {
                if (e.read_by_user_id !== user.id) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.user.id === user.id && !msg.read_at
                                ? { ...msg, read_at: new Date().toISOString() }
                                : msg,
                        ),
                    );
                }
            });

        return () => {
            window.Echo.leave(`chat.${chatId}`);
        };
    }, [chatId]);

    const handleTyping = useCallback(() => {
        if (!chatId) return;
        fetch(`/chat/user-chat/${chatId}/typing`, { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content, 'Accept': 'application/json' } });
    }, [chatId]);

    const isUserAtBottom = () => {
        const container = document.getElementById('chat-scroll-container');
        if (!container) return false;
        return container.scrollHeight - container.scrollTop - container.clientHeight < 10;
    };

    // Scroll to bottom on mount and set up scroll-based mark-as-read
    useEffect(() => {
        setTimeout(scrollToBottom, 0);

        const container = document.getElementById('chat-scroll-container');
        if (!container) return;

        const handleScroll = () => {
            if (!chatId) return;
            if (container.scrollHeight - container.scrollTop - container.clientHeight < 10) {
                markMessagesAsRead();
            }
        };

        container.addEventListener('scroll', handleScroll);

        // Mark as read if content fits without scrolling
        if (chatId && container.scrollHeight <= container.clientHeight) {
            markMessagesAsRead();
        }

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [chatId, markMessagesAsRead]);

    useEffect(() => {
        setMessages(init_messages);
        if (isUserAtBottom()) {
            setTimeout(scrollToBottom, 0);
        }
    }, [init_messages]);

    return (
        <AppLayout>
            <Head title={`${translations['Chat with']} ${other_user.name}`} />
            <div className="flex w-full flex-col" style={{ height: 'calc(100dvh - var(--header-h) - var(--mobile-nav-h))' }}>
                <div className="flex h-14 shrink-0 w-full items-center border-b border-gray-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
                    <Link href={`/user/${other_user.username}`} className="flex items-center gap-3">
                        <OnlineIndicator isOnline={onlineUserIds.has(other_user.id)}>
                            <Avatar className="h-9 w-9 overflow-hidden rounded-full">
                                <AvatarImage src={getProfileImageUrl(other_user)} alt={other_user.name} />
                                <AvatarFallback className="rounded-full bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
                                    {getInitials(other_user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </OnlineIndicator>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1">
                                <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{other_user.name}</span>
                                {other_user.is_verified && (
                                    <span className="flex shrink-0 items-center rounded-full bg-blue-500 p-0.5 text-white">
                                        <Check className="h-2.5 w-2.5" />
                                    </span>
                                )}
                            </div>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">@{other_user.username}</p>
                        </div>
                    </Link>
                </div>
                <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-neutral-950">
                    <div id="chat-scroll-container" className="flex-1 overflow-y-auto px-4 py-3">
                        {messages?.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {messages.map((message, index) => (
                                    <Message key={message.id || index} userId={user.id} message={message} />
                                ))}
                                <span ref={scroll}></span>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                                {translations['Send a message to start the conversation'] || 'Send a message to start the conversation'}
                            </div>
                        )}
                    </div>
                    <div className="shrink-0 border-t border-gray-200 p-4 dark:border-neutral-800">
                        {isOtherUserTyping && (
                            <div className="mb-2 flex items-center gap-1.5 px-1 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex gap-0.5">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                                </span>
                                {other_user.name} {translations['is typing...']}
                            </div>
                        )}
                        <MessageInput
                            chatId={chatId}
                            otherUserId={!chatId ? other_user.id : null}
                            onTyping={handleTyping}
                            onChatCreated={handleChatCreated}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

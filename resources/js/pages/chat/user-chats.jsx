import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, MessageSquare, RefreshCw, SendIcon, Trash2, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '../../components/empty-state';
import { OnlineIndicator } from '../../components/online-indicator';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog.jsx';
import { Input } from '../../components/ui/input.jsx';
import { useUnreadCounts } from '../../contexts/unread-counts-context';
import { useInitials } from '../../hooks/use-initials';
import { useOnlineUsers } from '../../hooks/use-online-users';
import { usePullToRefresh } from '../../hooks/use-pull-to-refresh';
import AppLayout from '../../layouts/app-layout';
import { getProfileImageUrl } from '../../lib/utils';

export default function UserChats() {
    const { auth, chats = [], group_chats = [], users = [], translations = {} } = usePage().props;
    const user = auth?.user;
    const getInitials = useInitials();
    const onlineUserIds = useOnlineUsers();
    const { unreadMessages } = useUnreadCounts();
    const [isLoading, setIsLoading] = useState(false);
    const [usersSearch, setUsersSearch] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('direct');

    // Group chat creation state
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [showGroupDialog, setShowGroupDialog] = useState(false);

    // React to context unread count changes (driven by WebSocket in the context)
    // instead of duplicating WebSocket listeners here (which breaks stopListening for the context)
    const prevUnreadRef = useRef(unreadMessages);
    useEffect(() => {
        if (unreadMessages !== prevUnreadRef.current) {
            prevUnreadRef.current = unreadMessages;
            handleReload();
        }
    }, [unreadMessages]);

    const handleReload = () => {
        setIsLoading(true);
        router.reload({
            only: ['chats', 'group_chats'],
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false),
        });
    };

    const { pulling, pullDistance } = usePullToRefresh(handleReload);

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
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

    // For "Start new chat" dialog: only show users without an existing chat
    const usersWithoutChat = users
        .map((group) => ({
            label: group.label,
            users: group.users.filter((u) => !u.has_chat),
        }))
        .filter((group) => group.users.length > 0);

    const onSearchChange = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
        const filtered = usersWithoutChat
            .map((group) => ({
                label: group.label,
                users: group.users.filter((user) => user.name.toLowerCase().includes(value) || user.username.toLowerCase().includes(value)),
            }))
            .filter((group) => group.users.length > 0);
        setUsersSearch(filtered);
    };

    const allUsersFlat = users.flatMap((group) => group.users);

    const MAX_INITIAL_MEMBERS = 20;
    const filteredMemberUsers = allUsersFlat.filter(
        (u) =>
            !selectedMembers.includes(u.id) &&
            (u.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) || u.username.toLowerCase().includes(memberSearchTerm.toLowerCase())),
    );
    const visibleMemberUsers = memberSearchTerm.trim() ? filteredMemberUsers : filteredMemberUsers.slice(0, MAX_INITIAL_MEMBERS);
    const hiddenCount = memberSearchTerm.trim() ? 0 : Math.max(0, filteredMemberUsers.length - MAX_INITIAL_MEMBERS);

    const toggleMember = (userId) => {
        setSelectedMembers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
    };

    const createGroupChat = () => {
        if (!groupName.trim() || selectedMembers.length === 0) return;
        router.post('/chat/group/create', { name: groupName, member_ids: selectedMembers });
        setGroupName('');
        setSelectedMembers([]);
        setShowGroupDialog(false);
    };

    const handleDeleteChat = (e, chatId) => {
        e.preventDefault();
        e.stopPropagation();
        if (
            confirm(
                translations['Delete this chat? All messages will be permanently removed.'] ||
                    'Delete this chat? All messages will be permanently removed.',
            )
        ) {
            router.delete(`/chat/user-chat/${chatId}`, { preserveScroll: true });
        }
    };

    return (
        <AppLayout>
            <Head title={translations['User chats']} />

            {pullDistance > 0 && (
                <div className="flex justify-center overflow-hidden transition-all lg:hidden" style={{ height: pullDistance }}>
                    <RefreshCw className={`mt-2 h-5 w-5 text-gray-400 ${pulling ? 'animate-spin text-blue-500' : ''}`} />
                </div>
            )}

            <div className="border-b border-gray-200 dark:border-neutral-800">
                <div className="flex items-center justify-between p-6">
                    <h1 className="text-2xl font-bold">{translations['User chats']}</h1>
                    <div className="flex items-center gap-2">
                        <Dialog>
                            <DialogTrigger>
                                <div className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800">
                                    <SendIcon className="h-4 w-4" />
                                    <span className="hidden md:inline">{translations['Start new chat']}</span>
                                </div>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{translations['Select user to start new chat']}</DialogTitle>
                                    <DialogDescription className="flex h-[50vh] flex-col gap-3 overflow-y-auto">
                                        <span className="flex items-center space-x-5">
                                            <Input placeholder={translations['Search users']} className="w-full" onChange={onSearchChange} />
                                        </span>
                                        {(usersSearch || usersWithoutChat).length === 0 ? (
                                            <DialogClose className="mt-4 text-center text-lg text-gray-500">
                                                {translations['No friends to chat yet.']}
                                            </DialogClose>
                                        ) : (
                                            (usersSearch || usersWithoutChat)
                                                .filter((group) => group.users.length > 0)
                                                .map((group, idx) => (
                                                    <span key={idx} className="flex flex-col gap-2">
                                                        <span className="text-[16px] font-semibold text-neutral-700 dark:text-white">
                                                            {translations[group.label] || group.label}
                                                        </span>
                                                        {group.users.map((user) => (
                                                            <DialogClose
                                                                key={user.id}
                                                                onClick={() => router.visit(`/chat/user-chat/${user.username}`)}
                                                                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                            >
                                                                <Avatar className="h-10 w-10">
                                                                    <AvatarImage src={getProfileImageUrl(user)} alt={user.name} />
                                                                    <AvatarFallback className="rounded-full bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
                                                                        {getInitials(user.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="text-left">
                                                                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                                                                        {user.name}
                                                                    </span>
                                                                    <span className="block text-sm text-gray-500 dark:text-gray-400">
                                                                        @{user.username}
                                                                    </span>
                                                                </div>
                                                            </DialogClose>
                                                        ))}
                                                    </span>
                                                ))
                                        )}
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>

                        <Dialog
                            open={showGroupDialog}
                            onOpenChange={(open) => {
                                setShowGroupDialog(open);
                                if (!open) {
                                    setGroupName('');
                                    setSelectedMembers([]);
                                    setMemberSearchTerm('');
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <button
                                    onClick={() => setShowGroupDialog(true)}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800"
                                >
                                    <Users className="h-4 w-4" />
                                    <span className="hidden md:inline">{translations['Create group'] || 'Create group'}</span>
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{translations['Create group chat'] || 'Create group chat'}</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col gap-3">
                                    <Input
                                        placeholder={translations['Group name'] || 'Group name'}
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="w-full"
                                    />
                                    {selectedMembers.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedMembers.map((id) => {
                                                const u = allUsersFlat.find((u) => u.id === id);
                                                if (!u) return null;
                                                return (
                                                    <span
                                                        key={id}
                                                        onClick={() => toggleMember(id)}
                                                        className="flex cursor-pointer items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                                                    >
                                                        {u.name}
                                                        <X className="h-3 w-3" />
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <Input
                                        placeholder={translations['Search members...'] || 'Search members...'}
                                        value={memberSearchTerm}
                                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                                        className="w-full"
                                    />
                                    <div className="flex max-h-[40vh] flex-col gap-0.5 overflow-y-auto">
                                        {visibleMemberUsers.length === 0 ? (
                                            <p className="py-4 text-center text-sm text-gray-500">
                                                {translations['No users found'] || 'No users found'}
                                            </p>
                                        ) : (
                                            <>
                                                {visibleMemberUsers.map((u) => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => toggleMember(u.id)}
                                                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                    >
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={getProfileImageUrl(u)} alt={u.name} />
                                                            <AvatarFallback className="bg-gray-200 text-xs dark:bg-gray-700">
                                                                {getInitials(u.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <span className="text-sm font-medium text-gray-800 dark:text-white">{u.name}</span>
                                                            <span className="ml-1.5 text-xs text-gray-500">@{u.username}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                                {hiddenCount > 0 && (
                                                    <p className="py-2 text-center text-xs text-gray-400 dark:text-gray-500">
                                                        {translations['and_more_users'] || `and ${hiddenCount} more — search to find them`}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={createGroupChat}
                                        disabled={!groupName.trim() || selectedMembers.length === 0}
                                        className="w-full rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                                    >
                                        {translations['Create group'] || 'Create group'}{' '}
                                        {selectedMembers.length > 0 && `(${selectedMembers.length + 1} ${translations['members'] || 'members'})`}
                                    </button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <button
                            onClick={handleReload}
                            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex border-b border-gray-200 px-6 dark:border-neutral-800">
                    <button
                        onClick={() => setActiveTab('direct')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'direct'
                                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    >
                        {translations['Direct messages'] || 'Direct messages'}
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'groups'
                                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    >
                        {translations['Group chats'] || 'Group chats'}
                    </button>
                </div>

                {activeTab === 'direct' && (
                    <>
                        {chats.length === 0 ? (
                            <EmptyState
                                icon={MessageSquare}
                                title={translations['Not chats anyone yet.']}
                                description={translations['Start a conversation with someone!']}
                            />
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-neutral-800/50">
                                {chats.map((chat) => (
                                    <Link
                                        key={chat.id}
                                        href={`/chat/user-chat/${chat.user.username}`}
                                        className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-900"
                                    >
                                        <OnlineIndicator isOnline={onlineUserIds.has(chat.user.id)} className="shrink-0">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={getProfileImageUrl(chat.user)} alt={chat.user.name} />
                                                <AvatarFallback className="rounded-full bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
                                                    {getInitials(chat.user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </OnlineIndicator>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="truncate font-semibold text-gray-900 dark:text-white">{chat.user.name}</span>
                                                {chat.user.is_verified && (
                                                    <span className="inline-flex items-center rounded-full bg-blue-500 p-0.5 text-white">
                                                        <Check className="h-2.5 w-2.5" />
                                                    </span>
                                                )}
                                                <span className="hidden text-sm text-gray-500 sm:inline dark:text-gray-400">
                                                    @{chat.user.username}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                                                {chat.last_message ? chat.last_message.text : translations['No messages anyone yet.']}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <div className="flex flex-col items-end gap-1">
                                                {chat.last_message && (
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                                        {formatMessageTime(chat.last_message.time)}
                                                    </span>
                                                )}
                                                {chat.unread_count > 0 && (
                                                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-medium text-white">
                                                        {chat.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                                className="rounded-full p-1.5 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                                title={translations['Delete chat'] || 'Delete chat'}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'groups' && (
                    <>
                        {!group_chats || group_chats.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                title={translations['No group chats yet'] || 'No group chats yet'}
                                description={translations['Create a group chat to get started!'] || 'Create a group chat to get started!'}
                            />
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-neutral-800/50">
                                {group_chats.map((gc) => (
                                    <Link
                                        key={gc.id}
                                        href={`/chat/group/${gc.id}`}
                                        className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-900"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-950 dark:text-blue-400">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-semibold text-gray-900 dark:text-white">{gc.name}</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {gc.member_count} {translations['members'] || 'members'}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                                                {gc.last_message ? gc.last_message.text : translations['No messages anyone yet.']}
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            {gc.last_message && (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {formatMessageTime(gc.last_message.time)}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

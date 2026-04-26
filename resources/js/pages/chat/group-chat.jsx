import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, ChevronRight, Crown, LogOut, Pencil, Plus, Settings, Trash2, UserMinus, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import MessageInput from '../../components/message-input.jsx';
import Message from '../../components/message.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog.jsx';
import { Input } from '../../components/ui/input.jsx';
import { useInitials } from '../../hooks/use-initials.jsx';
import AppLayout from '../../layouts/app-layout.jsx';
import { getProfileImageUrl } from '../../lib/utils';
import { useOnlineUsers } from '../../hooks/use-online-users';
import { OnlineIndicator } from '../../components/online-indicator';

export default function GroupChatPage() {
    const { user, group_chat, members, init_messages, translations } = usePage().props;
    const [messages, setMessages] = useState(init_messages || []);
    const [showPanel, setShowPanel] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
    const [newGroupName, setNewGroupName] = useState(group_chat.name);
    const [addMemberSearch, setAddMemberSearch] = useState('');
    const scroll = useRef();
    const getInitials = useInitials();
    const onlineUserIds = useOnlineUsers();
    const isCreator = user.id === group_chat.creator_id;

    const scrollToBottom = () => {
        if (scroll?.current) scroll.current.scrollIntoView({ behavior: 'smooth' });
    };

    const isUserAtBottom = () => {
        const container = document.getElementById('group-chat-scroll');
        if (!container) return false;
        return container.scrollHeight - container.scrollTop - container.clientHeight < 10;
    };

    useEffect(() => {
        const channel = window.Echo.private(`group-chat.${group_chat.id}`);
        channel.listen('GotGroupMessage', (e) => {
            const newMessage = {
                id: e.id,
                text: e.text,
                time: e.time,
                group_chat_id: e.group_chat_id,
                user: e.user,
                media: e.media || [],
            };
            const shouldScroll = isUserAtBottom();
            setMessages((prev) => {
                if (prev.some((m) => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
            if (shouldScroll) {
                setTimeout(scrollToBottom, 0);
            }
        });

        setTimeout(scrollToBottom, 0);

        return () => {
            window.Echo.leave(`group-chat.${group_chat.id}`);
        };
    }, []);

    useEffect(() => {
        setMessages(init_messages);
        if (isUserAtBottom()) {
            setTimeout(scrollToBottom, 0);
        }
    }, [init_messages]);

    const handleLeave = () => {
        if (confirm(translations['Leave this group chat?'] || 'Leave this group chat?')) {
            router.post(`/chat/group/${group_chat.id}/leave`);
        }
    };

    const handleDelete = () => {
        if (confirm(translations['Delete this group chat? All messages will be permanently removed.'] || 'Delete this group chat? All messages will be permanently removed.')) {
            router.delete(`/chat/group/${group_chat.id}`);
        }
    };

    const handleRename = () => {
        if (!newGroupName.trim() || newGroupName === group_chat.name) {
            setShowRenameDialog(false);
            return;
        }
        router.put(`/chat/group/${group_chat.id}`, { name: newGroupName }, {
            preserveScroll: true,
            onSuccess: () => setShowRenameDialog(false),
        });
    };

    const handleRemoveMember = (memberId) => {
        const member = members.find((m) => m.id === memberId);
        if (confirm(`${translations['Remove'] || 'Remove'} ${member?.name}?`)) {
            router.post(`/chat/group/${group_chat.id}/remove-member`, { user_id: memberId }, { preserveScroll: true });
        }
    };

    const handleAddMembers = (memberIds) => {
        router.post(`/chat/group/${group_chat.id}/add-members`, { member_ids: memberIds }, {
            preserveScroll: true,
            onSuccess: () => setShowAddMembersDialog(false),
        });
    };

    const memberIds = members.map((m) => m.id);

    return (
        <AppLayout>
            <Head title={group_chat.name} />
            <div className="flex w-full flex-col" style={{ height: 'calc(100dvh - var(--header-h) - var(--mobile-nav-h))' }}>
                {/* Header */}
                <div className="flex h-14 shrink-0 w-full items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                            <Users className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{group_chat.name}</span>
                                {isCreator && (
                                    <button
                                        onClick={() => { setNewGroupName(group_chat.name); setShowRenameDialog(true); }}
                                        className="shrink-0 rounded-full p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {members.length} {translations['members'] || 'members'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowPanel(!showPanel)}
                            className={`rounded-full p-2 transition ${showPanel ? 'bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800'}`}
                        >
                            <Users className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1">
                    {/* Messages area */}
                    <div className="flex flex-1 flex-col bg-white dark:bg-neutral-950">
                        <div id="group-chat-scroll" className="flex-1 overflow-y-auto px-4 py-3">
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
                            <MessageInput groupChatId={group_chat.id} />
                        </div>
                    </div>

                    {/* Side panel */}
                    {showPanel && (
                        <div className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                            <div className="p-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    {translations['Members'] || 'Members'} ({members.length})
                                </h3>

                                {isCreator && (
                                    <button
                                        onClick={() => { setAddMemberSearch(''); setShowAddMembersDialog(true); }}
                                        className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {translations['Add members'] || 'Add members'}
                                    </button>
                                )}

                                <div className="mt-2 flex flex-col gap-0.5">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-gray-50 dark:hover:bg-neutral-900"
                                        >
                                            <Link href={`/user/${member.username}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <OnlineIndicator isOnline={onlineUserIds.has(member.id)}>
                                                    <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                                                        <AvatarImage src={getProfileImageUrl(member)} alt={member.name} />
                                                        <AvatarFallback className="bg-gray-200 text-xs text-black dark:bg-gray-700 dark:text-white">
                                                            {getInitials(member.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </OnlineIndicator>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1">
                                                        <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{member.name}</span>
                                                        {member.is_verified && (
                                                            <span className="flex shrink-0 items-center rounded-full bg-blue-500 p-0.5 text-white">
                                                                <Check className="h-2 w-2" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="truncate text-xs text-gray-500 dark:text-gray-400">@{member.username}</span>
                                                        {member.id === group_chat.creator_id && (
                                                            <span className="flex shrink-0 items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                                                                <Crown className="h-3 w-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                            {isCreator && member.id !== user.id && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="shrink-0 rounded-full p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30"
                                                    title={translations['Remove'] || 'Remove'}
                                                >
                                                    <UserMinus className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 p-4 dark:border-neutral-800">
                                <button
                                    onClick={handleLeave}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {translations['Leave group'] || 'Leave group'}
                                </button>
                                {isCreator && (
                                    <button
                                        onClick={handleDelete}
                                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {translations['Delete group'] || 'Delete group'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Rename dialog */}
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{translations['Rename group'] || 'Rename group'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                        <Input
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder={translations['Group name'] || 'Group name'}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowRenameDialog(false)}
                                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-800"
                            >
                                {translations['Cancel'] || 'Cancel'}
                            </button>
                            <button
                                onClick={handleRename}
                                disabled={!newGroupName.trim() || newGroupName === group_chat.name}
                                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                {translations['Save'] || 'Save'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add members dialog */}
            <AddMembersDialog
                open={showAddMembersDialog}
                onOpenChange={setShowAddMembersDialog}
                existingMemberIds={memberIds}
                onAdd={handleAddMembers}
                translations={translations}
            />
        </AppLayout>
    );
}

function AddMembersDialog({ open, onOpenChange, existingMemberIds, onAdd, translations }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const getInitials = useInitials();

    useEffect(() => {
        if (open) {
            setSearch('');
            setSelected([]);
            // Fetch available users via the chat users list
            setLoading(true);
            fetch('/chat/user-chats', {
                headers: { 'Accept': 'application/json', 'X-Inertia': 'true', 'X-Inertia-Version': document.querySelector('meta[name="inertia-version"]')?.content || '' },
            })
                .then((res) => res.json())
                .then((data) => {
                    const users = (data.props?.users || []).flatMap((g) => g.users);
                    setAvailableUsers(users.filter((u) => !existingMemberIds.includes(u.id)));
                })
                .catch(() => {})
                .finally(() => setLoading(false));
        }
    }, [open, existingMemberIds]);

    const filtered = availableUsers.filter(
        (u) =>
            !selected.includes(u.id) &&
            (u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())),
    );

    const toggle = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{translations['Add members'] || 'Add members'}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    {selected.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selected.map((id) => {
                                const u = availableUsers.find((u) => u.id === id);
                                if (!u) return null;
                                return (
                                    <span
                                        key={id}
                                        onClick={() => toggle(id)}
                                        className="flex cursor-pointer items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300"
                                    >
                                        {u.name} <X className="h-3 w-3" />
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    <Input
                        placeholder={translations['Search users...'] || 'Search users...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="flex max-h-[40vh] flex-col gap-0.5 overflow-y-auto">
                        {loading ? (
                            <p className="py-4 text-center text-sm text-gray-500">{translations['Loading...'] || 'Loading...'}</p>
                        ) : filtered.length === 0 ? (
                            <p className="py-4 text-center text-sm text-gray-500">{translations['No users found'] || 'No users found'}</p>
                        ) : (
                            filtered.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => toggle(u.id)}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100 dark:hover:bg-neutral-800"
                                >
                                    <Avatar className="h-8 w-8">
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
                            ))
                        )}
                    </div>
                    <button
                        onClick={() => onAdd(selected)}
                        disabled={selected.length === 0}
                        className="w-full rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {translations['Add'] || 'Add'} {selected.length > 0 && `(${selected.length})`}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

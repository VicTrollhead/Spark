import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    BarChart3,
    Bookmark,
    Check,
    EllipsisVertical,
    EyeOff,
    Heart,
    Link2,
    MessageCircle,
    MessagesSquare,
    Pencil,
    Pin,
    Quote,
    RefreshCw,
    Repeat,
    Reply,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Comment } from '../../components/comment.jsx';
import { EmptyState } from '../../components/empty-state';
import { LinkifiedContent } from '../../components/linkified-content';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useDropdown } from '../../hooks/use-dropdown';
import { useInitials } from '../../hooks/use-initials';
import { usePostActions } from '../../hooks/use-post-actions';
import AppLayout from '../../layouts/app-layout';
import { fullDate, timeAgo } from '../../lib/time';
import { getMediaUrl, getProfileImageUrl } from '../../lib/utils';
import PostComponent from './post-component';

const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -4 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -4 },
};

export default function Show() {
    const { post, auth, sort, translations = {}, thread_chain = [] } = usePage().props;
    const getInitials = useInitials();
    const { isLiked, likesCount, isFavorited, favoritesCount, isReposted, repostsCount, handleLike, handleFavorite, handleRepost } =
        usePostActions(post);
    const { data, setData, processing, reset, errors } = useForm({
        content: '',
        post_id: post.id,
        parent_comment_id: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [pollData, setPollData] = useState(post.poll || null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const commentInputRef = useRef(null);

    useEffect(() => {
        setPollData(post.poll || null);
    }, [post]);

    const handleVote = (optionId) => {
        if (!pollData || pollData.is_expired) return;
        const prevData = { ...pollData };
        const oldVoteOptionId = pollData.user_vote_option_id;
        const newOptions = pollData.options.map((o) => ({
            ...o,
            votes_count:
                o.id === optionId
                    ? o.votes_count + (oldVoteOptionId === optionId ? 0 : 1)
                    : o.id === oldVoteOptionId
                      ? o.votes_count - 1
                      : o.votes_count,
        }));
        setPollData({
            ...pollData,
            user_vote_option_id: optionId,
            total_votes: oldVoteOptionId ? pollData.total_votes : pollData.total_votes + 1,
            options: newOptions,
        });
        router.post(
            `/poll/${pollData.id}/vote`,
            { option_id: optionId },
            {
                preserveScroll: true,
                onError: () => setPollData(prevData),
            },
        );
    };
    const [sortOption, setSortOption] = useState(sort || 'latest');
    const isOwnPost = auth.user && auth.user.id === post.user.id;
    const { isOpen: showOptions, toggle: toggleOptions, close: closeOptions, ref: optionsRef } = useDropdown();

    useEffect(() => {
        window.Echo.private(`post.${post.id}`).listen('CommentCreated', (e) => {
            // Only reload if the comment is for this post
            if (!e.post_id || e.post_id === post.id) {
                router.reload({ only: ['post'], preserveScroll: true });
            }
        });
        return () => {
            window.Echo.leave(`post.${post.id}`);
        };
    }, [post.id]);

    const handleSortChange = (e) => {
        const selectedSort = e.target.value;
        setSortOption(selectedSort);
        router.get(`/post/${post.slug}`, { sort: selectedSort }, { preserveScroll: true });
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        router.post(
            `/post/${post.slug}/comment`,
            {
                content: data.content,
                post_id: post.id,
                parent_comment_id: data.parent_comment_id,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    reset('content');
                    setReplyingTo(null);
                    setData({ content: '', post_id: post.id, parent_comment_id: null });
                    router.reload({ only: ['post'] });
                    toast.success(translations['Comment posted!']);
                },
            },
        );
    };

    const handleReply = (comment) => {
        setReplyingTo(comment);
        setData({
            ...data,
            content: `@${comment.user.username} `,
            parent_comment_id: comment.id,
        });
        commentInputRef.current?.focus();
        commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setData({ content: '', post_id: post.id, parent_comment_id: null });
    };

    const handleReload = () => {
        setIsLoading(true);
        router.reload({
            onFinish: () => setIsLoading(false),
        });
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/post/${post.slug}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success(translations['Link copied!'] || 'Link copied!');
        });
    };

    const handleDelete = () => {
        router.delete(`/post/${post.slug}`, {
            onSuccess: () => {
                toast.success(translations['Post deleted'] || 'Post deleted');
                setShowDeleteDialog(false);
            },
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleCommentSubmit(e);
        }
    };

    const profileImageUrl = getProfileImageUrl(post.user);
    const displayTime = fullDate(post.raw_created_at || post.created_at);

    return (
        <AppLayout>
            <Head title={`${translations['Post by']} @${post.user.username}`} />

            {/* Back navigation bar */}
            <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-gray-200 bg-white/80 px-3 py-3 backdrop-blur-sm sm:px-4 dark:border-neutral-800 dark:bg-neutral-950/80">
                <button
                    onClick={() => {
                        const referrer = document.referrer;
                        // Avoid deadloop: if we came from the edit page, go to dashboard instead
                        if (referrer && referrer.includes(`/post/${post.slug}/edit`)) {
                            router.visit('/dashboard');
                        } else {
                            window.history.back();
                        }
                    }}
                    className="rounded-full p-1.5 transition hover:bg-gray-100 dark:hover:bg-neutral-800"
                    aria-label={translations['Go back'] || 'Go back'}
                >
                    <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{translations['Post'] || 'Post'}</h1>
            </div>

            {thread_chain && thread_chain.length > 0 && (
                <div className="border-b border-gray-200 dark:border-neutral-800">
                    <div className="px-4 pt-4 pb-2 text-sm font-medium text-gray-500 dark:text-gray-400">{translations['Thread']}</div>
                    {thread_chain.map((threadPost) => (
                        <div
                            key={threadPost.id}
                            onClick={(e) => {
                                if (e.target.closest('a, button, video, input, textarea, select, [role="button"]')) return;
                                router.visit(`/post/${threadPost.slug}`);
                            }}
                            className="relative block cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-900/50"
                        >
                            <div className="absolute top-[4.5rem] bottom-0 left-[2.35rem] w-0.5 bg-gray-300 dark:bg-neutral-600" />
                            <PostComponent post={threadPost} compact />
                        </div>
                    ))}
                </div>
            )}

            <div className="p-4 sm:p-6">
                <div className="flex justify-between">
                    <div className="-ml-2 flex items-center space-x-3">
                        <Avatar className="h-14 w-14 text-xl">
                            <AvatarImage src={profileImageUrl} alt={post.user.name} />
                            <AvatarFallback className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white">
                                {getInitials(post.user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex min-w-0 items-center gap-1">
                                <Link
                                    href={`/user/${post.user.username}`}
                                    className="truncate text-lg font-semibold text-gray-900 hover:underline dark:text-white"
                                >
                                    {post.user.name}
                                </Link>
                                {post.user.is_verified && (
                                    <div className="group relative">
                                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                                            Verified
                                        </span>
                                        <span className="flex items-center rounded-full bg-blue-500 p-0.5 text-xs font-medium text-white">
                                            <Check className="h-3 w-3" />
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p className="text-md truncate text-gray-500 dark:text-gray-400">@{post.user.username}</p>
                        </div>
                    </div>
                    {isOwnPost && (
                        <div className="relative" ref={optionsRef}>
                            <button
                                onClick={toggleOptions}
                                aria-label={translations['Options']}
                                className="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
                            >
                                <EllipsisVertical className="h-6 w-6" />
                            </button>
                            <AnimatePresence>
                                {showOptions && (
                                    <motion.div
                                        variants={dropdownVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 z-50 mt-2 min-w-[160px] origin-top-right rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                                    >
                                        <button
                                            onClick={() => router.get(`/post/${post.slug}/edit`)}
                                            className="flex w-full items-center gap-2 rounded-t-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-600"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            {translations['Edit']}
                                        </button>
                                        <button
                                            onClick={() => {
                                                router.post(`/post/${post.slug}/toggle-pin`, {}, { preserveScroll: true });
                                                closeOptions();
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-600"
                                        >
                                            <Pin className="h-4 w-4" />
                                            {post.is_pinned
                                                ? translations['Unpin from profile'] || 'Unpin from profile'
                                                : translations['Pin to profile'] || 'Pin to profile'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                closeOptions();
                                                handleCopyLink();
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-600"
                                        >
                                            <Link2 className="h-4 w-4" />
                                            {translations['Copy link'] || 'Copy link'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                closeOptions();
                                                setShowDeleteDialog(true);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-b-lg px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {translations['Delete']}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {(post.reposted_by_you || post.reposted_by_recent?.length > 0) && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Repeat className="h-3.5 w-3.5" />
                        <span>
                            {translations['Reposted by']}{' '}
                            {post.reposted_by_you && (
                                <>
                                    <Link href={`/user/${post.current_user.username}`} className="font-medium hover:underline">
                                        {translations['you'] || 'you'}
                                    </Link>
                                    {post.reposted_by_recent?.length > 0 && ', '}
                                </>
                            )}
                            {post.reposted_by_recent?.map((user, index) => (
                                <span key={user.id}>
                                    <Link href={`/user/${user.username}`} className="font-medium hover:underline">
                                        {user.name}
                                    </Link>
                                    {index < post.reposted_by_recent.length - 1 && ', '}
                                </span>
                            ))}
                        </span>
                    </div>
                )}

                <div className="mt-4">
                    <p className="max-w-7xl text-xl break-words text-gray-800 dark:text-gray-200">
                        <LinkifiedContent content={post.content} />
                    </p>
                    {post.media.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 gap-3 py-1 sm:grid-cols-2">
                            {post.media.map((file, index) => {
                                const uniqueKey = file.id ? `${post.id}-${file.id}` : `${post.id}-${file.file_path}-${index}`;
                                const mediaUrl = getMediaUrl(file);
                                return file.file_type === 'image' ? (
                                    <div
                                        key={uniqueKey}
                                        className="relative flex w-full items-center justify-center overflow-hidden rounded-lg border dark:border-gray-700"
                                    >
                                        <img
                                            src={mediaUrl}
                                            alt="Post Media"
                                            className="cursor-pointer object-contain transition-transform duration-300 hover:scale-102"
                                        />
                                    </div>
                                ) : (
                                    <div key={uniqueKey} className="relative w-full overflow-hidden rounded-lg border dark:border-gray-700">
                                        <video controls className="h-auto w-full rounded-lg object-contain">
                                            <source src={mediaUrl} type="video/mp4" />
                                        </video>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {post.hashtags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-x-1 text-sm break-words lg:text-[16px]">
                            {post.hashtags.map((hashtag) => (
                                <Link key={hashtag.id} href={`/posts-by-hashtag/${hashtag.hashtag}`} className="text-blue-500 hover:underline">
                                    #{hashtag.hashtag}
                                </Link>
                            ))}
                        </div>
                    )}

                    {post.quote_post && (
                        <Link
                            href={`/post/${post.quote_post.slug}`}
                            className="mt-3 block overflow-hidden rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={getProfileImageUrl(post.quote_post.user)} alt={post.quote_post.user.name} />
                                    <AvatarFallback className="bg-gray-200 text-[10px] text-black dark:bg-gray-700 dark:text-white">
                                        {getInitials(post.quote_post.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{post.quote_post.user.name}</span>
                                {post.quote_post.user.is_verified && (
                                    <span className="flex items-center rounded-full bg-blue-500 p-0.5 text-xs text-white">
                                        <Check className="h-2.5 w-2.5" />
                                    </span>
                                )}
                                <span className="truncate text-xs text-gray-500">@{post.quote_post.user.username}</span>
                                <span
                                    className="shrink-0 text-xs text-gray-400"
                                    title={fullDate(post.quote_post.raw_created_at || post.quote_post.created_at)}
                                >
                                    {timeAgo(post.quote_post.raw_created_at || post.quote_post.created_at)}
                                </span>
                            </div>
                            <p className="mt-1 line-clamp-3 text-sm break-words text-gray-700 dark:text-gray-300">{post.quote_post.content}</p>
                            {post.quote_post.media?.length > 0 && post.quote_post.media[0]?.file_type === 'image' && (
                                <img src={getMediaUrl(post.quote_post.media[0])} alt="" className="mt-2 h-32 w-full rounded-md object-cover" />
                            )}
                        </Link>
                    )}

                    {pollData && (
                        <div className="mt-3 rounded-xl border border-gray-100 p-3 dark:border-neutral-800">
                            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                                <BarChart3 className="h-4 w-4" />
                                {translations['Poll'] || 'Poll'}
                                {pollData.is_expired && <span className="ml-1 text-xs text-red-500">({translations['Expired'] || 'Expired'})</span>}
                            </div>
                            <div className="space-y-2">
                                {pollData.options.map((option) => {
                                    const hasVoted = pollData.user_vote_option_id != null;
                                    const isSelected = pollData.user_vote_option_id === option.id;
                                    const percentage = pollData.total_votes > 0 ? Math.round((option.votes_count / pollData.total_votes) * 100) : 0;
                                    const showResults = hasVoted || pollData.is_expired;

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => !pollData.is_expired && handleVote(option.id)}
                                            disabled={pollData.is_expired}
                                            className={`relative w-full overflow-hidden rounded-md border px-3 py-2 text-left text-sm transition ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                                                    : 'border-gray-200 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
                                            } ${pollData.is_expired ? 'cursor-default' : 'cursor-pointer'}`}
                                        >
                                            {showResults && (
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-blue-100 transition-all duration-300 dark:bg-blue-900/30"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            )}
                                            <div className="relative flex items-center justify-between">
                                                <span
                                                    className={`${isSelected ? 'font-medium text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                                                >
                                                    {option.text}
                                                </span>
                                                {showResults && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{percentage}%</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {pollData.total_votes}{' '}
                                {pollData.total_votes === 1 ? translations['vote'] || 'vote' : translations['votes'] || 'votes'}
                                {pollData.expires_at && !pollData.is_expired && (
                                    <span className="ml-1">
                                        &middot; {translations['Ends'] || 'Ends'} {new Date(pollData.expires_at).toLocaleDateString()}
                                    </span>
                                )}
                            </p>
                        </div>
                    )}

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{displayTime}</p>
                </div>

                <div className="text-md mt-3 flex flex-wrap items-center gap-3 text-gray-600 sm:gap-5 dark:text-gray-400">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLike}
                        aria-label={isLiked ? translations['Unlike'] : translations['Like']}
                        className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                    >
                        <Heart className="h-6 w-6" fill={isLiked ? 'currentColor' : 'none'} />
                        <strong>{likesCount}</strong>
                    </motion.button>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <MessageCircle className="h-6 w-6" />
                        <strong>{post.comments_count}</strong>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleFavorite}
                        aria-label={isFavorited ? translations['Remove from favorites'] : translations['Add to favorites']}
                        className={`flex items-center gap-1 transition-colors ${isFavorited ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
                    >
                        <Bookmark className="h-6 w-6" fill={isFavorited ? 'currentColor' : 'none'} />
                        <strong>{favoritesCount}</strong>
                    </motion.button>
                    {post.user.id !== auth.user.id && !post.is_private && !post.user.is_private && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleRepost}
                            disabled={processing}
                            aria-label={isReposted ? translations['Undo repost'] : translations['Repost']}
                            className={`flex items-center gap-1 transition-colors ${isReposted ? 'text-green-500' : 'hover:text-green-500'}`}
                        >
                            <Repeat className="h-5 w-5" />
                            <span>{repostsCount}</span>
                        </motion.button>
                    )}
                    {!post.is_private && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.visit(`/dashboard?quote=${post.slug}`)}
                            aria-label={translations['Quote']}
                            className="flex items-center gap-1 transition-colors hover:text-purple-500"
                        >
                            <Quote className="h-5 w-5" />
                            <span>{post.quotes_count || 0}</span>
                        </motion.button>
                    )}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => router.visit(`/dashboard?reply=${post.slug}`)}
                        aria-label={translations['Reply'] || 'Reply'}
                        className="flex items-center gap-1 transition-colors hover:text-blue-500"
                    >
                        <Reply className="h-5 w-5" />
                        <span>{post.replies_count || 0}</span>
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCopyLink}
                        aria-label={translations['Copy link'] || 'Copy link'}
                        className="ml-auto flex items-center gap-1 transition-colors hover:text-blue-500"
                    >
                        <Link2 className="h-5 w-5" />
                    </motion.button>
                    {post.is_private === 1 && <EyeOff className="h-5 w-5" aria-hidden="false" aria-label={translations['Private post']} />}
                </div>
            </div>

            <div className="border-y border-gray-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950">
                {replyingTo && (
                    <div className="mb-3 flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm dark:bg-blue-950/30">
                        <span className="text-blue-600 dark:text-blue-400">
                            {translations['Replying to'] || 'Replying to'} <strong>@{replyingTo.user.username}</strong>
                        </span>
                        <button onClick={cancelReply} className="ml-auto rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                            <X className="h-4 w-4 text-blue-500" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleCommentSubmit} className="flex flex-col space-y-4">
                    <textarea
                        ref={commentInputRef}
                        value={data.content}
                        onChange={(e) => setData('content', e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                        placeholder={
                            replyingTo
                                ? `${translations['Reply to'] || 'Reply to'} @${replyingTo.user.username}...`
                                : translations['Write a comment...'] || 'Write a comment...'
                        }
                        className="resize-none rounded-md bg-gray-100 p-3 text-neutral-950 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-neutral-900 dark:text-white dark:focus:ring-blue-600"
                    />
                    {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                    <div className="flex items-center justify-between">
                        <span className={`text-xs ${data.content.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>{data.content.length}/500</span>
                        <button
                            type="submit"
                            disabled={!data.content || processing}
                            className={`rounded-full px-5 py-2 text-sm font-medium text-white ${
                                data.content ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-400 dark:bg-neutral-700'
                            }`}
                        >
                            {replyingTo ? translations['Reply'] || 'Reply' : translations['Publish']}
                        </button>
                    </div>
                </form>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6 dark:border-neutral-800">
                <h2 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">
                    {translations['Comments']} ({post.comments_count})
                </h2>
                <div className="flex items-center gap-2">
                    <select
                        value={sortOption}
                        onChange={handleSortChange}
                        aria-label={translations['Sort comments']}
                        className="cursor-pointer rounded-full border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    >
                        <option value="latest">{translations['Latest']}</option>
                        <option value="oldest">{translations['Oldest']}</option>
                        <option value="likes">{translations['Most Liked']}</option>
                        <option value="less_likes">{translations['Least Liked']}</option>
                    </select>
                    <button
                        onClick={handleReload}
                        aria-label={translations['Refresh comments']}
                        className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="mt-2 px-4 sm:px-6">
                <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                    {post.comments.length > 0 ? (
                        (() => {
                            const topLevel = post.comments.filter((c) => !c.parent_comment_id);
                            const repliesByParent = {};
                            post.comments.forEach((c) => {
                                if (c.parent_comment_id) {
                                    if (!repliesByParent[c.parent_comment_id]) repliesByParent[c.parent_comment_id] = [];
                                    repliesByParent[c.parent_comment_id].push(c);
                                }
                            });
                            return topLevel.map((comment) => (
                                <div key={comment.id}>
                                    <Comment comment={comment} auth_user={auth.user} onReply={handleReply} />
                                    {repliesByParent[comment.id]?.length > 0 && (
                                        <div className="ml-6 border-l-2 border-blue-200 pl-4 md:ml-10 dark:border-blue-900/50">
                                            {repliesByParent[comment.id].map((reply) => (
                                                <div key={reply.id}>
                                                    <Comment comment={reply} auth_user={auth.user} onReply={handleReply} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ));
                        })()
                    ) : (
                        <EmptyState
                            icon={MessagesSquare}
                            title={translations['No comments yet.']}
                            description={translations['Start the conversation!']}
                        />
                    )}
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{translations['Delete post'] || 'Delete post'}</DialogTitle>
                        <DialogDescription>
                            {translations['Are you sure you want to delete this post? This action cannot be undone.'] ||
                                'Are you sure you want to delete this post? This action cannot be undone.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            {translations['Cancel'] || 'Cancel'}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                            {translations['Delete'] || 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

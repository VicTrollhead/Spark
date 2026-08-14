import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, EllipsisVertical, Heart, Reply, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useInitials } from '../hooks/use-initials';
import { fullDate, timeAgo } from '../lib/time';
import { getProfileImageUrl } from '../lib/utils';
import { LinkifiedContent } from './linkified-content';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -4 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -4 },
};

export function Comment({ comment, auth_user, onReply }) {
    const { translations } = usePage().props;
    const [isLiked, setIsLiked] = useState(comment.is_liked);
    const [likesCount, setLikesCount] = useState(comment.likes_count);
    const [showOptions, setShowOptions] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const optionsRef = useRef(null);
    const getInitials = useInitials();

    const handleLike = async () => {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
        const action = isLiked ? `/unlike` : `/like`;

        await router.post(
            action,
            {
                type: 'comment',
                id: comment.id,
            },
            {
                preserveScroll: true,
                onError: () => {
                    setIsLiked(comment.is_liked);
                    setLikesCount(comment.likes_count);
                },
            },
        );
    };

    const handleDeleteComment = async () => {
        await router.post(
            `/comment/${comment.id}/delete`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(translations['Comment deleted'] || 'Comment deleted');
                    setShowDeleteDialog(false);
                    router.reload({ only: ['post'] });
                },
            },
        );
    };
    const toggleOptions = () => setShowOptions(!showOptions);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const displayTime = timeAgo(comment.raw_created_at || comment.created_at);
    const tooltipTime = fullDate(comment.raw_created_at || comment.created_at);

    return (
        <>
            <div className="flex flex-col">
                <div className="flex items-center space-x-3 py-2">
                    <Avatar className={`${comment.parent_comment ? 'h-8 w-8' : 'h-10 w-10'}`}>
                        <AvatarImage src={getProfileImageUrl(comment.user)} alt={comment.user.name} />
                        <AvatarFallback className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white">
                            {getInitials(comment.user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <Link
                                    href={`/user/${comment.user.username}`}
                                    className="truncate font-semibold text-gray-900 hover:underline dark:text-white"
                                >
                                    {comment.user.name}
                                </Link>
                                {comment.user.is_verified && (
                                    <span className="flex shrink-0 items-center rounded-full bg-blue-500 p-0.5 text-xs font-medium text-white">
                                        <Check className="h-2.5 w-2.5" />
                                    </span>
                                )}
                                <Link
                                    href={`/user/${comment.user.username}`}
                                    className="hidden truncate text-sm text-gray-500 hover:underline sm:inline dark:text-gray-400"
                                >
                                    @{comment.user.username}
                                </Link>
                                <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400" title={tooltipTime}>
                                    {displayTime}
                                </span>
                            </div>
                        </div>
                        {comment.parent_comment && (
                            <Link
                                href={`/user/${comment.reply_to_username || comment.parent_comment.user?.username}`}
                                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline"
                            >
                                <Reply className="h-3 w-3" />
                                {translations['Replying to'] || 'Replying to'} @
                                {comment.reply_to_username || comment.parent_comment.user?.username || '...'}
                            </Link>
                        )}
                        <p className={`mt-1 break-words text-gray-800 dark:text-gray-200`}>
                            <LinkifiedContent content={comment.content} />
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-gray-600 dark:text-gray-400">
                            <button
                                onClick={handleLike}
                                aria-label={isLiked ? translations['Unlike'] : translations['Like']}
                                className="flex items-center space-x-1"
                            >
                                <motion.span
                                    key={isLiked ? 'liked' : 'unliked'}
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                >
                                    <Heart
                                        className={`h-5 w-5 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                                        fill={isLiked ? 'currentColor' : 'none'}
                                    />
                                </motion.span>
                                <strong>{likesCount}</strong>
                            </button>
                            {onReply && (
                                <button
                                    onClick={() => onReply(comment)}
                                    className="flex items-center gap-1 text-sm text-gray-500 transition hover:text-blue-500"
                                >
                                    <Reply className="h-4 w-4" />
                                    <span>{translations['Reply'] || 'Reply'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {auth_user?.id === comment.user.id && (
                        <div className="relative" ref={optionsRef}>
                            <button
                                onClick={toggleOptions}
                                aria-label={translations['Options']}
                                className="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                                <EllipsisVertical className="h-5 w-5" />
                            </button>
                            <AnimatePresence>
                                {showOptions && (
                                    <motion.div
                                        variants={dropdownVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 z-50 mt-1 min-w-[140px] origin-top-right rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                                    >
                                        <button
                                            onClick={() => {
                                                setShowOptions(false);
                                                setShowDeleteDialog(true);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-600"
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
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{translations['Delete comment'] || 'Delete comment'}</DialogTitle>
                        <DialogDescription>
                            {translations['Are you sure you want to delete this comment?'] || 'Are you sure you want to delete this comment?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            {translations['Cancel'] || 'Cancel'}
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteComment} className="bg-red-600 text-white hover:bg-red-700">
                            {translations['Delete'] || 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

import {Heart, Trash2} from 'lucide-react';
import { useInitials } from '../hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {Link, router, usePage} from "@inertiajs/react";
import {useState} from "react";
import { getProfileImageUrl } from '../lib/utils';

export function Comment({ comment, auth_user }) {
    const { translations } = usePage().props;
    const [isLiked, setIsLiked] = useState(comment.is_liked);
    const [likesCount, setLikesCount] = useState(comment.likes_count);
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

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm(translations['Are you sure you want to delete this comment?'])) return;
        await router.post(
            `/comment/${commentId}/delete`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['post'] });
                },
            },
        );
    };
    return (
        <div className="flex flex-col">
            <div className="flex items-center space-x-3 py-2">
                <Avatar className="h-12 w-12 border border-gray-300 dark:border-gray-700">
                    <AvatarImage src={getProfileImageUrl(comment.user)} alt={comment.user.name} />
                    <AvatarFallback className="bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-white">
                        {getInitials(comment.user.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Link
                                href={`/user/${comment.user.username}`}
                                className="font-semibold text-gray-900 hover:underline dark:text-white"
                            >
                                {comment.user.name}
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{comment.created_at}</p>
                        </div>
                    </div>
                    <p className={`mt-1 text-gray-800 dark:text-gray-200`}>{comment.content}</p>
                </div>
                {auth_user?.id === comment.user.id && (
                    <Trash2
                        className="h-5 w-5 cursor-pointer text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
                        onClick={() => handleDeleteComment(comment.id)}
                    />
                )}
            </div>
            <div className="text-md mt-1 mb-4 ml-2 flex items-center text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                    <Heart
                        className={`h-6 w-6 cursor-pointer ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                        onClick={handleLike}
                    />
                    <p>
                        <strong>{likesCount}</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}

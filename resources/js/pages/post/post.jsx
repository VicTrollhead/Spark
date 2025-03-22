import { Link, useForm } from '@inertiajs/react';
import { MessageCircle, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { useInitials } from "../../hooks/use-initials";
import LikeButton from "./like-button";
import { useState } from 'react';


export default function Post({ post }) {
    const { post: sendPost, processing } = useForm();
    const getInitials = useInitials();

    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);

    const handleLike = async () => {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

        await sendPost(
            isLiked ? `/post/${post.id}/unlike` : `/post/${post.id}/like`,
            {
                preserveScroll: true,
                onError: () => {
                    setIsLiked(post.is_liked);
                    setLikesCount(post.likes_count);
                },
            }
        );
    };

    return (
        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-start space-x-3">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={post.user.profile_image_url} alt={post.user.name} />
                    <AvatarFallback className="rounded-full bg-gray-300 text-black dark:bg-gray-700 dark:text-white">
                        {getInitials(post.user.name)}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <Link
                            href={`/user/${post.user.username}`}
                            className="font-semibold text-gray-900 hover:underline dark:text-white"
                        >
                            {post.user.name}
                        </Link>
                        <span className="text-sm text-gray-500">
                            {new Date(post.created_at).toLocaleDateString("en-US", {
                                month: "numeric",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">{post.content}</p>

                    <div className="mt-3 flex items-center gap-3 text-gray-500 dark:text-gray-400">
                        <button
                            onClick={handleLike}
                            disabled={processing}

                            className={`flex items-center gap-1 ${post.is_liked ? 'text-red-500' : 'hover:text-red-500'}`}
                        >
                            <Heart className="h-5 w-5" />
                            <span>{post.likes_count}</span>
                        </button>

                        <Link
                            href={`/post/${post.id}`}
                            className="flex items-center gap-1 hover:text-blue-500"
                        >
                            <MessageCircle className="h-5 w-5" />
                            <span>{post.comments_count}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

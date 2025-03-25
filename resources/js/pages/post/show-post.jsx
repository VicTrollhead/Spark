import { Head, usePage, Link, useForm } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
import { Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function Show() {
    const { post, auth } = usePage().props;
    const getInitials = useInitials();
    const { post: sendPost, processing } = useForm();

    const isOwnPost = auth.user && auth.user.id === post.user.id;

    const breadcrumbs = [
        { title: isOwnPost ? 'My Profile' : '@'+ post.user.username + "'s Profile", href: isOwnPost ? `/user/${auth.user.username}` : `/user/${post.user.username}` },
        { title: "Post by @"+ post.user.username, href: `/post/${post.id}` },
    ];

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Post by @${post.user.username}`} />

            <div className="p-6">
                <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 border border-gray-300 dark:border-gray-700">
                        <AvatarImage src={post.user.profile_image_url} alt={post.user.name} />
                        <AvatarFallback className="bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-white">
                            {getInitials(post.user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <Link href={`/user/${post.user.username}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
                            {post.user.name}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{post.user.username}</p>
                    </div>
                </div>

                <div className="mt-4">
                    <p className="text-gray-800 dark:text-gray-200">{post.content}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{post.created_at}</p>
                </div>

                <div className="mt-3 flex items-center space-x-6 text-md text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                        <Heart
                            className={`h-6 w-6 ${post.is_liked ? 'text-red-500' : 'text-gray-500'}`}
                            onClick={handleLike}
                        />
                        <p>
                            <strong>{post.likes_count}</strong>
                            {/*{post.likes_count === 1 ? 'Like' : 'Likes'}*/}
                        </p>
                    </div>
                    <div className="flex items-center space-x-1">
                        <MessageCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        <p>
                            <strong>{post.comments_count}</strong>
                            {/*{post.comments_count === 1 ? 'Comment' : 'Comments'}*/}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 px-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h2>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                            <div key={comment.id} className="py-4 flex space-x-3">
                                <Avatar className="h-10 w-10 border border-gray-300 dark:border-gray-700">
                                    <AvatarImage src={comment.user.profile_image_url} alt={comment.user.name} />
                                    <AvatarFallback className="bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-white">
                                        {getInitials(comment.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex gap-1.5 items-center">
                                        <Link href={`/user/${comment.user.username}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
                                            {comment.user.name}
                                        </Link>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{comment.created_at}</p>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">@{comment.user.username}</p>
                                    <p className="text-gray-800 dark:text-gray-200 mt-1">{comment.content}</p>

                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 py-4">No comments yet.</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

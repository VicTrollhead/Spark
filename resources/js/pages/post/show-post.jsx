import { Head, usePage, Link, useForm, router } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
import { Bookmark, EyeOff, Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';


export default function Show() {
    const { post, auth, sort } = usePage().props;
    const getInitials = useInitials();
    const { data, setData, post: sendPost, processing, reset, errors } = useForm({
        content: '', post_id: post.id, parent_comment_id: null
    });

    const [sortOption, setSortOption] = useState(sort || "latest");

    const handleSortChange = (e) => {
        const selectedSort = e.target.value;
        setSortOption(selectedSort);
        router.get(`/post/${post.id}`, { sort: selectedSort }, { preserveScroll: true });
    };

    const isOwnPost = auth.user && auth.user.id === post.user.id;

    const breadcrumbs = [
        { title: isOwnPost ? 'My Profile' : '@' + post.user.username + "'s Profile", href: `/user/${post.user.username}` },
        { title: "Post by @" + post.user.username, href: `/post/${post.id}` },
    ];

    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);

    const [isFavorited, setIsFavorited] = useState(post.is_favorited);
    const [favoritesCount, setFavoritesCount] = useState(post.favorites_count);

    const handleLike = async () => {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

        await router.post(
            isLiked ? `/post/${post.id}/unlike` : `/post/${post.id}/like`,
            {},
            {
                preserveScroll: true,
                onError: () => {
                    setIsLiked(post.is_liked);
                    setLikesCount(post.likes_count);
                },
            }
        );
    };

    const handleFavorite = async () => {
        setIsFavorited(!isFavorited);
        setFavoritesCount(isFavorited ? favoritesCount - 1 : favoritesCount + 1);

        await router.post(
            isFavorited ? `/post/${post.id}/remove-favorite` : `/post/${post.id}/add-favorite`,
            {},
            {
                preserveScroll: true,
                onError: () => {
                    setIsFavorited(post.is_favorited);
                    setFavoritesCount(post.favorites_count);
                },
            }
        );
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        router.post(`/post/${post.id}/comment`, {
            content: data.content,
            post_id: post.id,
            parent_comment_id: data.parent_comment_id,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                reset('content');
                router.reload({ only: ['post'] });
            }
        });

        setData({ content: '', post_id: post.id, parent_comment_id: null });
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        await router.post(`/comment/${commentId}/delete`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['post'] });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Post by @${post.user.username}`} />

            <div className="p-6">
                <div className="flex items-center space-x-3">
                    <Avatar className="h-20 w-20 border border-gray-300 dark:border-gray-700">
                        <AvatarImage src={post.user.profile_image_url} alt={post.user.name} />
                        <AvatarFallback className="bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-white">
                            {getInitials(post.user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <Link href={`/user/${post.user.username}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:underline">
                            {post.user.name}
                        </Link>
                        <p className="text-md text-gray-500 dark:text-gray-400">@{post.user.username}</p>
                    </div>
                </div>

                <div className="mt-4">
                    <p className="text-gray-800 dark:text-gray-200">{post.content}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{post.created_at}</p>
                </div>

                <div className="mt-3 flex items-center space-x-6 text-md text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                        <Heart
                            className={`h-6 w-6 cursor-pointer ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                            onClick={handleLike}
                        />
                        <p>
                            <strong>{likesCount}</strong>
                        </p>
                    </div>
                    <div className="flex items-center space-x-1">
                        <MessageCircle className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-500" />
                        <p>
                            <strong>{post.comments_count}</strong>
                        </p>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Bookmark
                            className={`h-6 w-6 cursor-pointer ${isFavorited ? 'text-yellow-500' : 'text-gray-500 hover:yellow-red-500'}`}
                            onClick={handleFavorite}
                        />
                        <p>
                            <strong>{favoritesCount}</strong>
                        </p>
                    </div>
                    {post.is_private === 1 && <EyeOff className="h-5 w-5" />}
                </div>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-950 border-y dark:border-gray-800">
                <form onSubmit={handleCommentSubmit} className="flex flex-col space-y-4">
                    <textarea
                        value={data.content}
                        onChange={(e) => setData('content', e.target.value)}
                        rows={3}
                        placeholder="What's on your mind?"
                        className="resize-none p-3 bg-gray-100 dark:bg-neutral-900 rounded-md text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    />
                    {errors.content && <p className="text-red-500 text-sm">{errors.content}</p>}

                    <button
                        type="submit"
                        disabled={!data.content || processing}
                        className={`self-end py-2 px-4 rounded-lg text-white ${
                            data.content ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 cursor-not-allowed'
                        }`}
                    >
                        Post
                    </button>
                </form>
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-950 border-b dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Comments</h2>
                <select
                    value={sortOption}
                    onChange={handleSortChange}
                    className="p-2 border rounded-md bg-gray-100 dark:bg-neutral-900 text-neutral-950 dark:text-white"
                >
                    <option value="latest">Latest</option>
                    <option value="oldest">Oldest</option>
                    {/*<option value="likes">Most Liked</option>*/}
                    {/*<option value="friends">Friends' Posts</option>*/}
                </select>
            </div>
            <div className="mt-2 px-6">
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                            <div key={comment.id} className="py-4 flex items-center space-x-3">
                                <Avatar className="h-12 w-12 border border-gray-300 dark:border-gray-700">
                                    <AvatarImage src={comment.user.profile_image_url} alt={comment.user.name} />
                                    <AvatarFallback className="bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-white">
                                        {getInitials(comment.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-1.5 items-center">
                                            <Link href={`/user/${comment.user.username}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
                                                {comment.user.name}
                                            </Link>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{comment.created_at}</p>
                                        </div>
                                    </div>

                                    <p className={`text-gray-800 dark:text-gray-200 mt-1 `}>
                                        {comment.content}
                                    </p>
                                </div>

                                {auth.user?.id === comment.user.id && (
                                    <Trash2
                                        className="h-5 w-5 text-gray-500 dark:text-gray-400 hover:text-red-600 cursor-pointer"
                                        onClick={() => handleDeleteComment(comment.id)}
                                    />
                                )}
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

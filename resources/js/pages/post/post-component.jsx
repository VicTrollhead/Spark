import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Bookmark, EllipsisVertical, EyeOff, Heart, MessageCircle, Repeat } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';

export default function PostComponent({ post }) {
    const { post: sendPost, processing } = useForm();
    const { auth, translations } = usePage().props;
    const getInitials = useInitials();

    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);

    const [isFavorited, setIsFavorited] = useState(post.is_favorited);
    const [favoritesCount, setFavoritesCount] = useState(post.favorites_count);

    const [isReposted, setIsReposted] = useState(post.is_reposted);
    const [repostsCount, setRepostsCount] = useState(post.reposts_count);

    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        }

        if (showOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showOptions]);

    const toggleOptions = () => setShowOptions(prev => !prev);

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
            },
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
            },
        );
    };

    const handleRepost = async () => {
        if (post.is_private || post.user.is_private) {
            alert(translations['You cannot repost private posts.']);
            return;
        }
        setIsReposted(!isReposted);
        setRepostsCount(isReposted ? repostsCount - 1 : repostsCount + 1);

        await router.post(
            isReposted ? `/post/${post.id}/undo` : `/post/${post.id}/repost`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRepostsCount(isReposted ? repostsCount - 1 : repostsCount + 1);
                    setIsReposted(!isReposted);
                },
                onError: (error) => {
                    console.error("Repost error:", error);
                    setIsReposted(post.is_reposted);
                    setRepostsCount(post.reposts_count);
                },
            }
        );
    };


    return (
        <div className="relative border-b border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-start space-x-3">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={post.user.profile_image_url} alt={post.user.name} />
                    <AvatarFallback className="rounded-full bg-gray-300 text-black dark:bg-gray-700 dark:text-white">
                        {getInitials(post.user.name)}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href={`/user/${post.user.username}`} className="font-semibold text-gray-900 hover:underline dark:text-white">
                                {post.user.name}
                            </Link>
                            <span className="text-sm text-gray-500">{post.created_at}</span>
                        </div>

                        {post.user.id === auth.user.id && (
                            <div className="relative" ref={optionsRef}>
                                <EllipsisVertical
                                    className="h-6 w-6 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
                                    onClick={toggleOptions}
                                />

                                {showOptions && (
                                    <div className="absolute right-0 z-50 mt-1 min-w-[160px] rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-neutral-800">
                                        <button
                                            onClick={() => router.get(`/post/${post.id}/edit`)}
                                            className="block w-full rounded-t-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-600">
                                           router.delete(`/posts/${post.id}`);
                                        </button>
                                        <button
                                            onClick={() => router.delete(`/post/${post.id}`)}
                                            className="block w-full rounded-b-lg px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-600"
                                        >
                                            {translations['Delete']}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">@{post.user.username}</p>
                    <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">{post.content}</p>

                    {post.media.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 gap-3 py-1 sm:grid-cols-2">
                            {post.media.map((file, index) => {
                                const uniqueKey = `${post.id}-${file.id ?? file.file_path ?? index}`;
                                return file.file_type === 'image' ? (
                                    <div key={uniqueKey} className="relative w-full overflow-hidden rounded-lg border dark:border-gray-700">
                                        <img
                                            src={`/storage/${file.file_path}`}
                                            alt="Post Media"
                                            className="h-auto w-full rounded-lg object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div key={uniqueKey} className="relative w-full overflow-hidden rounded-lg border dark:border-gray-700">
                                        <video controls className="h-auto w-full rounded-lg object-contain">
                                            <source src={`/storage/${file.file_path}`} type="video/mp4" />
                                        </video>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {post.hashtags?.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-x-1 text-[16px] break-all">
                            {post.hashtags.map((hashtag) => (
                                <Link key={hashtag.id} href={`/posts-by-hashtag/${hashtag.hashtag}`} className="text-blue-500 hover:underline">
                                    #{hashtag.hashtag}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="mt-3 flex items-center gap-3 text-gray-500 dark:text-gray-400">
                        <button
                            onClick={handleLike}
                            disabled={processing}
                            className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                        >
                            <Heart className="h-5 w-5" />
                            <span>{likesCount}</span>
                        </button>

                        <Link href={`/post/${post.id}`} className="flex items-center gap-1 hover:text-blue-500">
                            <MessageCircle className="h-5 w-5" />
                            <span>{post.comments_count}</span>
                        </Link>

                        <button
                            onClick={handleFavorite}
                            disabled={processing}
                            className={`flex items-center gap-1 ${isFavorited ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
                        >
                            <Bookmark className="h-5 w-5" />
                            <span>{favoritesCount}</span>
                        </button>

                        {post.user.id !== auth.user.id && !post.is_private && !post.user.is_private && (
                            <button
                                onClick={handleRepost}
                                disabled={processing}
                                className={`flex items-center gap-1 ${isReposted ? 'text-green-500' : 'hover:text-green-500'}`}
                            >
                                <Repeat className="h-5 w-5" />
                                <span>{repostsCount}</span>
                            </button>
                        )}

                        {post.is_private === 1 && <EyeOff className="h-5 w-5" />}
                    </div>
                </div>
            </div>
        </div>
    );
}

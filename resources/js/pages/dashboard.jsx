import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { BarChart3, Check, FileText, Hash, Image, Pen, Plus, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '../components/empty-state';
import { HashtagInput } from '../components/hashtag-input';
import { PostSkeleton } from '../components/post-skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input.jsx';
import { Switch } from '../components/ui/switch.jsx';
import '../echo';
import { useInfiniteScroll } from '../hooks/use-infinite-scroll';
import { useInitials } from '../hooks/use-initials';
import { usePullToRefresh } from '../hooks/use-pull-to-refresh';
import AppLayout from '../layouts/app-layout';
import { getProfileImageUrl } from '../lib/utils';
import PostComponent from './post/post-component';

const FEED_CACHE_KEY = 'dashboard_feed_cache';

function getRestoredFeed() {
    try {
        const raw = sessionStorage.getItem(FEED_CACHE_KEY);
        if (!raw) return null;
        sessionStorage.removeItem(FEED_CACHE_KEY);
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export default function Dashboard() {
    const {
        auth,
        users = [],
        posts: initialPosts = { data: [], next_page_url: null },
        sort,
        translations = {},
        quote_post,
        reply_post,
    } = usePage().props;

    // Restore feed from sessionStorage on mount (handles back-navigation in Inertia SPA)
    const [restored] = useState(() => getRestoredFeed());

    const [posts, setPosts] = useState(restored?.posts ?? initialPosts.data);
    const [nextPageUrl, setNextPageUrl] = useState(restored?.nextPageUrl ?? initialPosts.next_page_url);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortOption, setSortOption] = useState(sort || 'latest');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const hashtagRef = useRef();
    const fileInputRef = useRef();
    const textareaRef = useRef();

    const [quotingPost, setQuotingPost] = useState(quote_post || null);
    const [replyingToPost, setReplyingToPost] = useState(reply_post || null);
    const [showPollForm, setShowPollForm] = useState(false);
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pollExpiresIn, setPollExpiresIn] = useState('');

    const [newPostsQueue, setNewPostsQueue] = useState([]);

    const [data, setData] = useState({
        content: '',
        parent_post_id: reply_post?.id || null,
        quote_post_id: quote_post?.id || null,
        is_private: false,
        media: [],
        hashtags: [],
    });

    const [errors, setErrors] = useState({});
    const [showAttachments, setShowAttachments] = useState(false);
    const [showHashtags, setShowHashtags] = useState(false);
    const getInitials = useInitials();

    // Parse localized variants once
    const headingVariants = useRef((translations['compose_placeholders'] || "What's on your mind?").split('|').filter(Boolean)).current;
    const inputVariants = useRef((translations['compose_input_placeholders'] || "What's on your mind?").split('|').filter(Boolean)).current;

    const pickRandom = (arr, exclude) => {
        if (arr.length <= 1) return arr[0];
        let next;
        do {
            next = arr[Math.floor(Math.random() * arr.length)];
        } while (next === exclude);
        return next;
    };

    const [composePlaceholder, setComposePlaceholder] = useState(() => pickRandom(headingVariants));
    const [inputPlaceholder, setInputPlaceholder] = useState(() => pickRandom(inputVariants));

    const shufflePlaceholders = () => {
        setComposePlaceholder((prev) => pickRandom(headingVariants, prev));
        setInputPlaceholder((prev) => pickRandom(inputVariants, prev));
    };
    const postsRef = useRef(posts);
    const nextPageUrlRef = useRef(nextPageUrl);
    postsRef.current = posts;
    nextPageUrlRef.current = nextPageUrl;

    // Restore scroll position on back-navigation
    useEffect(() => {
        if (restored?.scrollY) {
            requestAnimationFrame(() => window.scrollTo(0, restored.scrollY));
        }
    }, [restored]);

    // Auto-focus textarea when replying to a post
    useEffect(() => {
        if (replyingToPost) {
            textareaRef.current?.focus();
            textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [replyingToPost]);

    // Save feed state before navigating away from the dashboard
    useEffect(() => {
        return router.on('before', (event) => {
            const url = event.detail?.visit?.url?.href || '';
            // Cache feed state when navigating away (but not when sorting/reloading the dashboard itself)
            if (!url.includes('/dashboard')) {
                try {
                    sessionStorage.setItem(
                        FEED_CACHE_KEY,
                        JSON.stringify({
                            posts: postsRef.current,
                            nextPageUrl: nextPageUrlRef.current,
                            scrollY: window.scrollY,
                        }),
                    );
                } catch {}
            }
        });
    }, []);

    // Listen for new posts via WebSocket
    useEffect(() => {
        if (!auth?.user?.id) return;
        const channel = window.Echo.private(`feed.${auth.user.id}`);
        channel.listen('PostCreated', (e) => {
            setNewPostsQueue((prev) => {
                if (prev.some((p) => p.id === e.post.id)) return prev;
                return [e.post, ...prev];
            });
        });
        return () => {
            window.Echo.leave(`feed.${auth.user.id}`);
        };
    }, [auth?.user?.id]);

    const showNewPosts = () => {
        setPosts((prev) => [...newPostsQueue, ...prev]);
        setNewPostsQueue([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSortChange = (e) => {
        const selectedSort = e.target.value;
        setSortOption(selectedSort);
        router.get(
            '/dashboard',
            { sort: selectedSort },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setPosts(page.props.posts.data);
                    setNextPageUrl(page.props.posts.next_page_url);
                },
            },
        );
    };

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        setData((prev) => ({ ...prev, media: files }));
        setSelectedFiles(files.map((file) => file.name));
    };

    const handlePostSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('content', data.content);
        formData.append('parent_post_id', data.parent_post_id || '');
        formData.append('quote_post_id', data.quote_post_id || '');
        formData.append('is_private', data.is_private ? 1 : 0);

        const contentTags = data.content.match(/#(\w+)/g)?.map((tag) => tag.slice(1)) || [];
        const manualTags = data.hashtags || [];

        const combinedTags = Array.from(new Set([...contentTags, ...manualTags]));

        combinedTags.forEach((tag, index) => {
            formData.append(`hashtags[${index}]`, tag);
        });

        if (data.media.length > 0) {
            data.media.forEach((file, index) => {
                formData.append(`media[${index}]`, file);
            });
        }

        if (showPollForm) {
            const validOptions = pollOptions.filter((o) => o.trim() !== '');
            if (validOptions.length >= 2) {
                validOptions.forEach((option, index) => {
                    formData.append(`poll_options[${index}]`, option);
                });
                if (pollExpiresIn) {
                    formData.append('poll_expires_in', pollExpiresIn);
                }
            }
        }

        router.post('/dashboard', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData({
                    content: '',
                    parent_post_id: null,
                    quote_post_id: null,
                    is_private: false,
                    media: [],
                    hashtags: [],
                });
                setQuotingPost(null);
                setReplyingToPost(null);
                setSelectedFiles([]);
                setErrors({});
                setShowPollForm(false);
                setPollOptions(['', '']);
                setPollExpiresIn('');
                hashtagRef.current?.reset();
                fileInputRef.current.value = null;
                toast.success(translations['Post published!']);
                // Reload feed to show the new post immediately
                router.reload({
                    only: ['posts'],
                    onSuccess: (page) => {
                        setPosts(page.props.posts.data);
                        setNextPageUrl(page.props.posts.next_page_url);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    },
                });
            },
            onError: (errorBag) => {
                setErrors(errorBag);
                toast.error(translations['Failed to publish post']);
            },
        });
    };

    const handleReload = () => {
        setIsLoading(true);
        router.reload({
            only: ['posts'],
            onSuccess: (page) => {
                setPosts(page.props.posts.data);
                setNextPageUrl(page.props.posts.next_page_url);
                setIsLoading(false);
            },
            onError: () => setIsLoading(false),
        });
    };

    const loadMore = useCallback(() => {
        if (!nextPageUrl || loadingMore) return;
        setLoadingMore(true);
        router.get(
            nextPageUrl,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['posts'],
                onSuccess: (page) => {
                    setPosts((prev) => [...prev, ...page.props.posts.data]);
                    setNextPageUrl(page.props.posts.next_page_url);
                    setLoadingMore(false);
                    // Restore clean URL so refresh doesn't land on ?page=N
                    const cleanUrl = sortOption && sortOption !== 'latest' ? `/dashboard?sort=${sortOption}` : '/dashboard';
                    window.history.replaceState({}, '', cleanUrl);
                },
                onError: () => setLoadingMore(false),
            },
        );
    }, [nextPageUrl, loadingMore, sortOption]);

    const sentinelRef = useInfiniteScroll(loadMore, !!nextPageUrl && !loadingMore);
    const { pulling, pullDistance } = usePullToRefresh(handleReload);

    const clearMediaInput = () => {
        setData('media', null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title={translations['Dashboard']} />

            {pullDistance > 0 && (
                <div className="flex justify-center overflow-hidden transition-all lg:hidden" style={{ height: pullDistance }}>
                    <RefreshCw className={`mt-2 h-5 w-5 text-gray-400 ${pulling ? 'animate-spin text-blue-500' : ''}`} />
                </div>
            )}

            <div className="border-b border-gray-200 dark:border-neutral-800">
                <form onSubmit={handlePostSubmit} className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={shufflePlaceholders}
                            className="cursor-pointer rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:rotate-12 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
                            title="Shuffle"
                        >
                            <Pen className="h-5 w-5" />
                        </button>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{composePlaceholder}</h2>
                    </div>

                    {/* Reply/Quote context cards */}
                    {replyingToPost && (
                        <div className="relative mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                            <button
                                type="button"
                                onClick={() => {
                                    setReplyingToPost(null);
                                    setData((prev) => ({ ...prev, parent_post_id: null }));
                                    window.history.replaceState({}, '', '/dashboard');
                                }}
                                className="absolute top-2 right-2 rounded-full p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700"
                            >
                                <X size={14} />
                            </button>
                            <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                                {translations['Replying to'] || 'Replying to'}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{replyingToPost.user.name}</span>
                                {replyingToPost.user.is_verified && (
                                    <span className="flex items-center rounded-full bg-blue-500 p-0.5 text-xs text-white">
                                        <Check className="h-2.5 w-2.5" />
                                    </span>
                                )}
                                <span className="text-xs text-gray-500">@{replyingToPost.user.username}</span>
                            </div>
                            {replyingToPost.content && (
                                <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{replyingToPost.content}</p>
                            )}
                        </div>
                    )}

                    {quotingPost && (
                        <div className="relative mb-3 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/30">
                            <button
                                type="button"
                                onClick={() => {
                                    setQuotingPost(null);
                                    setData((prev) => ({ ...prev, quote_post_id: null }));
                                }}
                                className="absolute top-2 right-2 rounded-full p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700"
                            >
                                <X size={14} />
                            </button>
                            <p className="mb-1 text-xs font-medium text-purple-600 dark:text-purple-400">{translations['Quoting']}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{quotingPost.user.name}</span>
                                {quotingPost.user.is_verified && (
                                    <span className="flex items-center rounded-full bg-blue-500 p-0.5 text-xs text-white">
                                        <Check className="h-2.5 w-2.5" />
                                    </span>
                                )}
                                <span className="text-xs text-gray-500">@{quotingPost.user.username}</span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{quotingPost.content}</p>
                        </div>
                    )}

                    {/* Main compose area */}
                    <div className="flex gap-3">
                        <Avatar className="mt-0.5 hidden h-12 w-12 shrink-0 sm:flex">
                            <AvatarImage src={getProfileImageUrl(auth.user)} alt={auth.user.name} />
                            <AvatarFallback className="rounded-full bg-gray-200 text-lg text-black dark:bg-gray-700 dark:text-white">
                                {getInitials(auth.user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <textarea
                                ref={textareaRef}
                                value={data.content}
                                onChange={(e) => setData((prev) => ({ ...prev, content: e.target.value }))}
                                rows={2}
                                placeholder={
                                    replyingToPost
                                        ? `${translations['Reply to'] || 'Reply to'} @${replyingToPost.user.username}...`
                                        : inputPlaceholder
                                }
                                className="w-full resize-none border-0 bg-transparent p-0 text-[16px] text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
                            />

                            {/* Hashtags panel */}
                            {showHashtags && (
                                <div className="mt-2">
                                    <HashtagInput
                                        placeholder={translations['Add hashtag...']}
                                        ref={hashtagRef}
                                        value={data.hashtags}
                                        onChange={(hashtags) => setData((prev) => ({ ...prev, hashtags }))}
                                    />
                                </div>
                            )}

                            {/* Media attachments panel */}
                            {showAttachments && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                                            onChange={handleMediaChange}
                                            className="w-full text-sm"
                                        />
                                        {data.media && data.media.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData((prev) => ({ ...prev, media: [] }));
                                                    setSelectedFiles([]);
                                                    if (fileInputRef.current) fileInputRef.current.value = null;
                                                }}
                                                className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {selectedFiles.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {selectedFiles.map((name, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-neutral-800 dark:text-gray-400"
                                                    title={name}
                                                >
                                                    {name.length > 20 ? name.slice(0, 17) + '...' : name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {errors['media.0'] && <p className="mt-1 text-xs text-red-500">{errors['media.0']}</p>}
                                </div>
                            )}

                            {/* Poll form */}
                            {showPollForm && (
                                <div className="mt-3 rounded-lg border border-gray-200 p-3 dark:border-neutral-700">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {translations['Poll Options'] || 'Poll Options'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPollForm(false);
                                                setPollOptions(['', '']);
                                                setPollExpiresIn('');
                                            }}
                                            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {pollOptions.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => {
                                                        const u = [...pollOptions];
                                                        u[index] = e.target.value;
                                                        setPollOptions(u);
                                                    }}
                                                    placeholder={`${translations['Option'] || 'Option'} ${index + 1}`}
                                                    className="flex-1 rounded-md border border-gray-200 bg-transparent px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:text-white"
                                                    maxLength={100}
                                                />
                                                {pollOptions.length > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {pollOptions.length < 6 && (
                                            <button
                                                type="button"
                                                onClick={() => setPollOptions([...pollOptions, ''])}
                                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                            >
                                                <Plus size={14} /> {translations['Add option'] || 'Add option'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                        <select
                                            value={pollExpiresIn}
                                            onChange={(e) => setPollExpiresIn(e.target.value)}
                                            className="w-full cursor-pointer rounded-md border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700 dark:text-white"
                                        >
                                            <option value="">{translations['No expiration'] || 'No expiration'}</option>
                                            <option value="60">{translations['1 hour'] || '1 hour'}</option>
                                            <option value="360">{translations['6 hours'] || '6 hours'}</option>
                                            <option value="1440">{translations['1 day'] || '1 day'}</option>
                                            <option value="4320">{translations['3 days'] || '3 days'}</option>
                                            <option value="10080">{translations['1 week'] || '1 week'}</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}

                            {/* Toolbar + submit */}
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-neutral-800">
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowAttachments(!showAttachments)}
                                        className={`rounded-full p-2 transition ${showAttachments ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300'}`}
                                        title={translations['Upload Media (Images or Videos)'] || 'Media'}
                                    >
                                        <Image className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowHashtags(!showHashtags)}
                                        className={`rounded-full p-2 transition ${showHashtags ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300'}`}
                                        title={translations['Hashtags'] || 'Hashtags'}
                                    >
                                        <Hash className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowPollForm(!showPollForm)}
                                        className={`rounded-full p-2 transition ${showPollForm ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300'}`}
                                        title={translations['Add Poll'] || 'Poll'}
                                    >
                                        <BarChart3 className="h-5 w-5" />
                                    </button>
                                    <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-neutral-700" />
                                    <label className="flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-100 dark:hover:bg-neutral-800">
                                        <Switch checked={data.is_private} onChange={(val) => setData((prev) => ({ ...prev, is_private: val }))} />
                                        <span className={data.is_private ? 'text-blue-600 dark:text-blue-400' : ''}>
                                            {data.is_private ? translations['Private'] || 'Private' : translations['Public'] || 'Public'}
                                        </span>
                                    </label>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <span
                                        className={`text-xs tabular-nums ${data.content.length > 500 ? 'font-medium text-red-500' : 'text-gray-300 dark:text-gray-600'}`}
                                    >
                                        {data.content.length}/500
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={!data.content && (!data.media || data.media.length === 0)}
                                        className={`rounded-full px-5 py-2 text-sm font-medium text-white transition ${
                                            !data.content && (!data.media || data.media.length === 0)
                                                ? 'cursor-not-allowed bg-blue-400/50 dark:bg-blue-600/30'
                                                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                                        }`}
                                    >
                                        {replyingToPost ? translations['Reply'] || 'Reply' : translations['Publish'] || 'Publish'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6 dark:border-neutral-800">
                <h2 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">{translations['Posts']}</h2>
                <div className="flex items-center gap-2">
                    <select
                        value={sortOption}
                        onChange={handleSortChange}
                        aria-label={translations['Sort posts']}
                        className="cursor-pointer rounded-full border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    >
                        <option value="latest">{translations['Latest']}</option>
                        <option value="oldest">{translations['Oldest']}</option>
                        <option value="likes">{translations['Most Liked']}</option>
                        <option value="comments">{translations['Most Commented']}</option>
                        <option value="reposts">{translations['Most Reposted']}</option>
                        <option value="favorites">{translations['Most Favorited']}</option>
                        <option value="most_activity">{translations['Most Activity']}</option>
                        <option value="followees">{translations['People I Follow']}</option>
                        <option value="followers">{translations['People Who Follow Me']}</option>
                        <option value="mutuals">{translations['Mutual Friends']}</option>
                    </select>
                    <button
                        onClick={handleReload}
                        aria-label={translations['Refresh posts']}
                        className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {newPostsQueue.length > 0 && (
                <button
                    onClick={showNewPosts}
                    className="w-full bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"
                >
                    {translations['Show %count% new posts']
                        ? translations['Show %count% new posts'].replace('%count%', newPostsQueue.length)
                        : `Show ${newPostsQueue.length} new post${newPostsQueue.length > 1 ? 's' : ''}`}
                </button>
            )}

            <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
                {posts.length > 0 ? (
                    posts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index < 15 ? index * 0.05 : 0 }}
                        >
                            <PostComponent post={post} />
                        </motion.div>
                    ))
                ) : (
                    <EmptyState
                        icon={FileText}
                        title={translations['No posts yet.']}
                        description={translations['Be the first to share something!']}
                    />
                )}
            </div>

            {loadingMore && (
                <>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </>
            )}
            <div ref={sentinelRef} className="h-1" />
        </AppLayout>
    );
}

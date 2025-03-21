import { Head, usePage, Link, useForm, router } from '@inertiajs/react';
import { Check, MapPin, Globe, Calendar, UserCheck, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';

export default function Show() {
    const { user, auth } = usePage().props;
    const getInitials = useInitials();

    const { get, post, processing } = useForm();

    const handleFollow = () => {
        if (user.is_following) {
           post(`/user/${user.username}/unfollow`);
        } else {
            post(`/user/${user.username}/follow`);
        }
    };

    const handleEditProfile = () => {
        get(`/user/${user.username}/edit`);
    };

    const isOwnProfile = auth.user && auth.user.id === user.id;

    const breadcrumbs = [
        { title: isOwnProfile ? 'My Profile' : user.name + "'s Profile", href: `/user/${user.username}` },
    ];

    if (!user.canViewFullProfile) {
        return (
            <AppLayout breadcrumbs={[{ title: `${user.username} (Private Account)`, href: `/user/${user.username}` }]}>
                <Head title={`${user.username} (Private Account)`} />

                <div className="p-6 text-center">
                    <Avatar className="h-24 w-24 mx-auto border-4 border-white dark:border-gray-900">
                        <AvatarImage src={user.profile_image_url} alt={user.username} />
                        <AvatarFallback className="rounded-full bg-gray-300 text-4xl text-black dark:bg-gray-700 dark:text-white">
                            {getInitials(user.username)}
                        </AvatarFallback>
                    </Avatar>

                    <h2 className="text-lg font-semibold mt-2">@{user.username}</h2>
                    <p className="text-gray-500 dark:text-gray-400">This account is private.</p>

                    {auth.user && !user.is_following && (
                        <button
                            onClick={handleFollow}
                            disabled={processing}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Follow to See More
                        </button>
                    )}
                </div>
            </AppLayout>
        );
    }


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} (@${user.username})`} />

            {/* Profile Header */}
            <div className="relative h-48 w-full bg-gray-200 sm:h-56 dark:bg-gray-800">
                {user.cover_image_url && (
                    <img src={user.cover_image_url} alt="Cover Image" className="h-full w-full object-cover" />
                )}
                <div className="absolute bottom-[-40px] left-4 sm:left-6">
                    <Avatar className="h-24 w-24 border-4 border-white sm:h-28 sm:w-28 dark:border-gray-900">
                        <AvatarImage src={user.profile_image_url} alt={user.name} />
                        <AvatarFallback className="rounded-full bg-gray-300 text-4xl text-black dark:bg-gray-700 dark:text-white">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-2 p-6 pt-12 sm:pt-16">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                            {user.is_verified && (
                                <div className="group relative ml-2">
                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                                        Verified
                                    </span>
                                    <span className="flex items-center rounded-lg bg-blue-500 p-1 text-xs font-medium text-white">
                                        <Check className="h-4 w-4" />
                                    </span>
                                </div>
                            )}
                        </div>

                        <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                    </div>
                    {!isOwnProfile && (
                        <button
                            onClick={handleFollow}
                            disabled={processing}
                            className={`px-4 py-2 rounded-md ${
                                user.is_following
                                    ? 'bg-gray-600 hover:bg-gray-500 text-white dark:bg-gray-800 dark:hover:bg-gray-700'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800'
                            }`}
                        >
                            {user.is_following ? 'Unfollow' : 'Follow'}
                        </button>
                    )}
                    {isOwnProfile && (
                        <button
                            onClick={handleEditProfile}
                            className="px-4 py-2 border-2 rounded-3xl text-ray-800 hover:bg-gray-300 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {user.bio && <p className="text-gray-700 dark:text-gray-300">{user.bio}</p>}

                {/* User Details */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {user.location && (
                        <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {user.location}
                        </div>
                    )}

                    {user.website && (
                        <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {user.website}
                            </a>
                        </div>
                    )}

                    {user.date_of_birth && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(user.date_of_birth).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4" />
                        Joined{' '}{user.created_at}
                    </div>

                    {user.status && (
                        <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {user.status}
                        </div>
                    )}
                </div>

                {/* Followers and Following Links */}
                <div className="flex gap-4 text-gray-700 dark:text-gray-300 mt-4">
                    <Link href={`/user/${user.username}/followers`} className="hover:underline">
                        <strong>{user.followers_count}</strong> Followers
                    </Link>
                    <Link href={`/user/${user.username}/following`} className="hover:underline">
                        <strong>{user.following_count}</strong> Following
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}

//                                user.is_following
//                                     ? 'bg-gray-700 hover:bg-gray-600 text-white dark:bg-gray-800 dark:hover:bg-gray-700'
//                                     : 'bg-gray-300 hover:bg-gray-400 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200'

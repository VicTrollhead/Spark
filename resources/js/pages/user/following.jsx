import { usePage, Link, Head } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
export default function Following() {
    const { title, users, user, auth } = usePage().props;
    const getInitials = useInitials();
    const isOwnProfile = auth.user && auth.user.id === user.id;

    const breadcrumbs = [
        { title: isOwnProfile ? 'My Profile' : "@" + user.username + "'s Profile", href: `/user/${user.username}` },
        { title:  'Following', href: `/user/${user.username}` },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isOwnProfile ? 'Following' : user.name + "'s Following"} />
            <div className="max-w-lg p-6">
                <h1 className="mb-4 text-2xl font-bold">{title}</h1>
                {users.length === 0 ? (
                    <p className="text-gray-500">Not following anyone yet.</p>
                ) : (
                    <ul>
                        {users.map((user) => (
                            <li key={user.id} className="flex items-center gap-3 border-b py-2 dark:border-gray-700">
                                <Avatar className="h-24 w-24 border-4 border-white sm:h-28 sm:w-28 dark:border-gray-900">
                                    <AvatarImage src={user.profile_image_url} alt={user.name} />
                                    <AvatarFallback className="rounded-full bg-gray-300 text-4xl text-black dark:bg-gray-700 dark:text-white">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <Link href={`/user/${user.username}`} className="font-medium text-blue-500 hover:underline">
                                        {user.name}
                                    </Link>
                                    <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}

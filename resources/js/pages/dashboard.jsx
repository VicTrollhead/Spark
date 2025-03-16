import { Head, usePage, Link } from '@inertiajs/react';
import AppLayout from '../layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useInitials } from '../hooks/use-initials';

export default function Dashboard() {
    const { users } = usePage().props;
    const getInitials = useInitials();

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Users', href: '/dashboard/users' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users Dashboard" />

            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">All Users</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {users.map((user) => (
                        <Link key={user.id} href={`/user/${user.id}`} className="block p-4 border rounded-md hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.profile_image_url} alt={user.name} />
                                    <AvatarFallback className="rounded-full bg-gray-300 text-lg text-black dark:bg-gray-700 dark:text-white">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-lg font-semibold">{user.name}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}


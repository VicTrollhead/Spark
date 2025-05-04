import { Check } from 'lucide-react';
import { useInitials } from '../hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function UserInfo({ user, showEmail = false }) {
    const getInitials = useInitials();
    console.log('User: ' + user['name'] + ' ' + user['is_verified']);
    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-12 w-12 overflow-hidden rounded-full">
                <AvatarImage src={user.profile_image_url} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-gray-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
                <div className="flex items-center gap-1">
                    <span className="truncate text-sm font-normal">@{user.username}</span>
                    {user.is_verified && (
                        <span className="flex items-center rounded-lg bg-blue-500 p-0.5 text-xs font-medium text-white">
                            <Check className="h-3 w-3" />
                        </span>
                    )}
                </div>

                <span className="text-lg font-extrabold break-all">{user.name}</span>
                {showEmail && <span className="text-muted-foreground truncate text-xs">{user.email}</span>}
            </div>
        </div>
    );
}

import { Check } from 'lucide-react';
import { useInitials } from '../hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function UserInfo({ user, showEmail = false }) {
    const getInitials = useInitials();
    console.log("User: " + user['name'] + " " + user['is_verified'])
    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-12 w-12 overflow-hidden rounded-full">
                <AvatarImage src={user.profile_image_url} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-gray-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
                <div className="flex items-center">
                    <span className="text-lg font-extrabold break-all">{user.name}</span>
                    {user.is_verified && (
                        <div className="group relative ml-2">
                            {/*<span className="absolute -top-7 left-1/2 top -translate-x-1/2 scale-0 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">*/}
                            {/*    Verified*/}
                            {/*</span>*/}
                            <span className="flex items-center rounded-lg bg-blue-500 p-0.5 text-xs font-medium text-white">
                                <Check className="h-3 w-3" />
                            </span>
                        </div>
                    )}
                </div>

                <span className="truncate text-sm font-normal">@{user.username}</span>
                {showEmail && <span className="text-muted-foreground truncate text-xs">{user.email}</span>}
            </div>
        </div>
    );
}

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useInitials } from '../hooks/use-initials';

export function UserInfo({ user, showEmail = false }) {
    const getInitials = useInitials();

    return (<div className="flex items-center gap-1">
            <Avatar className="h-12 w-12 overflow-hidden rounded-full">
                <AvatarImage src={user.profile_image_url} alt={user.name}/>
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-lg font-extrabold">{user.name}</span>
                <span className="truncate text-sm font-normal">@{user.username}</span>
                {showEmail && <span className="text-muted-foreground truncate text-xs">{user.email}</span>}
            </div>
        </div>);
}


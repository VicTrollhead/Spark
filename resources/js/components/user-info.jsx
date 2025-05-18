import { Check } from 'lucide-react';
import { useInitials } from '../hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getProfileImageUrl } from '../lib/utils';

// const getProfileImageUrl = (user) => {
//     const url = user?.profile_image;
//     if (!url) return null;
//     if (url.startsWith('http://') || url.startsWith('https://')) {
//         return url;
//     }
//     return `/storage/${url}`;
// };
// const getProfileImageUrl = (user) => {
//     if (user?.profile_image?.disk === 's3') {
//         return user.profile_image?.url;
//     } else if (user?.profile_image?.file_path) {
//         return `/storage/${user.profile_image?.file_path}`;
//     }
//     return null;
// };
export function UserInfo({ user, showEmail = false }) {
    const getInitials = useInitials();
    return (
        <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-12 w-12 overflow-hidden rounded-full flex-shrink-0">
                <AvatarImage src={getProfileImageUrl(user)} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 min-w-0 text-left leading-tight">
                <div className="flex items-center gap-1 min-w-0">
                    <span className="truncate text-[14.5px] text-gray-700 dark:text-neutral-300 max-w-full">@{user.username}</span>
                    {user.is_verified && (
                        <span className="flex-shrink-0 flex items-center rounded-lg bg-blue-500 p-0.5 text-xs font-medium text-white">
          <Check className="h-3 w-3" />
        </span>
                    )}
                </div>
                <span className="truncate text-lg font-extrabold max-w-full">{user.name}</span>
            </div>
        </div>

    );
}

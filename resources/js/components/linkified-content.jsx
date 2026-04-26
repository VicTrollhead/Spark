import { Link } from '@inertiajs/react';

export function LinkifiedContent({ content, className = '' }) {
    if (!content) return null;

    const parts = content.split(/(@[\w.]+)/g);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part.startsWith('@')) {
                    const username = part.slice(1).replace(/\.+$/, '');
                    const trailing = part.slice(1 + username.length);
                    return (
                        <span key={i}>
                            <Link href={`/user/${username}`} className="text-blue-500 hover:underline">
                                @{username}
                            </Link>
                            {trailing}
                        </span>
                    );
                }
                return part;
            })}
        </span>
    );
}

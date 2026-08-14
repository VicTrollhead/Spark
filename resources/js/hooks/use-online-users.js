import { useEffect, useState } from 'react';

/**
 * Tracks which users are currently online via a presence channel.
 * Returns a Set of online user IDs.
 */
export function useOnlineUsers() {
    const [onlineUserIds, setOnlineUserIds] = useState(new Set());

    useEffect(() => {
        window.Echo.join('presence-online')
            .here((users) => {
                setOnlineUserIds(new Set(users.map((u) => u.id)));
            })
            .joining((user) => {
                setOnlineUserIds((prev) => new Set([...prev, user.id]));
            })
            .leaving((user) => {
                setOnlineUserIds((prev) => {
                    const next = new Set(prev);
                    next.delete(user.id);
                    return next;
                });
            });

        return () => {
            window.Echo.leave('presence-online');
        };
    }, []);

    return onlineUserIds;
}

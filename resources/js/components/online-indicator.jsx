/**
 * Green dot overlay for avatars indicating a user is online.
 * Wrap an Avatar component with this; pass isOnline to toggle visibility.
 */
export function OnlineIndicator({ isOnline, children, className = '' }) {
    return (
        <div className={`relative inline-block ${className}`}>
            {children}
            {isOnline && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-900" />
            )}
        </div>
    );
}

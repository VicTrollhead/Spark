/**
 * Convert a date string to a relative time string (e.g., "2h ago", "3d ago").
 * Falls back to full date for anything older than 7 days.
 */
export function timeAgo(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 0) return 'just now';
    if (seconds < 60) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    if (days < 365) {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a date string into a full readable date for tooltips.
 */
export function fullDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

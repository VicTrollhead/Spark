import { Link } from '@inertiajs/react';

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            {Icon && (
                <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-neutral-800">
                    <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
            )}
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
            {actionLabel && actionHref && (
                <Link href={actionHref} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}

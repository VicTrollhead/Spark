export function PostSkeleton() {
    return (
        <div className="animate-pulse border-b border-gray-200 p-4 dark:border-neutral-800">
            <div className="flex items-start space-x-3">
                <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-neutral-700" />
                <div className="flex-1 space-y-3 pt-1">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-neutral-700" />
                        <div className="h-3 w-16 rounded bg-gray-200 dark:bg-neutral-700" />
                    </div>
                    <div className="h-3 w-20 rounded bg-gray-200 dark:bg-neutral-700" />
                    <div className="space-y-2 pt-1">
                        <div className="h-4 w-full rounded bg-gray-200 dark:bg-neutral-700" />
                        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-neutral-700" />
                    </div>
                    <div className="flex gap-4 pt-2">
                        <div className="h-5 w-12 rounded bg-gray-200 dark:bg-neutral-700" />
                        <div className="h-5 w-12 rounded bg-gray-200 dark:bg-neutral-700" />
                        <div className="h-5 w-12 rounded bg-gray-200 dark:bg-neutral-700" />
                    </div>
                </div>
            </div>
        </div>
    );
}

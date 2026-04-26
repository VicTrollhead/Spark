import { Component } from 'react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Something went wrong</h2>
                    <p className="mb-4 text-gray-500 dark:text-gray-400">An unexpected error occurred. Please try refreshing the page.</p>
                    <button
                        type="button"
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-zinc-800 max-w-lg w-full text-center">
            <h1 className="text-4xl font-black text-red-600 mb-4">Oops!</h1>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong.</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              We encountered an unexpected error. Please try reloading the page or going back to safety.
            </p>
            <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-xl text-left overflow-x-auto mb-6">
              <code className="text-xs text-red-600 dark:text-red-400">
                {this.state.error?.toString()}
              </code>
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all"
              >
                Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="px-6 py-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-full font-bold transition-all"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

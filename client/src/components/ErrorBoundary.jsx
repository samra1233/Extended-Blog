import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">Something went wrong</h1>
            <p className="text-stone-500 text-sm mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                Refresh page
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false })}
                className="bg-white border border-stone-200 hover:border-stone-300 text-stone-600 font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

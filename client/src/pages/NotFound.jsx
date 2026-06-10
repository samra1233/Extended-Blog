import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-black text-stone-200 mb-4">404</p>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">Page not found</h1>
        <p className="text-stone-500 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Back to home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-white border border-stone-200 hover:border-stone-300 text-stone-600 font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

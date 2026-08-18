import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import BlogCard from '../components/BlogCard';

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/auth/bookmarks')
      .then(({ data }) => setPosts(data))
      .catch(() => setError('Failed to load bookmarks.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight mb-1">Bookmarks</h1>
          <p className="text-stone-500 text-base">
            {loading ? 'Loading...' : `${posts.length} saved ${posts.length === 1 ? 'post' : 'posts'}`}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-stone-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-stone-100 rounded-full w-1/3" />
                  <div className="h-5 bg-stone-100 rounded-full w-5/6" />
                  <div className="h-4 bg-stone-100 rounded-full w-full" />
                  <div className="pt-3 flex justify-between">
                    <div className="h-3 bg-stone-100 rounded-full w-1/4" />
                    <div className="h-3 bg-stone-100 rounded-full w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 && !error ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </div>
            <p className="text-stone-700 font-semibold text-lg mb-1">No bookmarks yet</p>
            <p className="text-stone-400 text-sm mb-6">
              Save posts you love by clicking the bookmark button on any story.
            </p>
            <Link
              to="/"
              className="bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Browse posts
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

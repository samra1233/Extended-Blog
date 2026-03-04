import { useState, useEffect } from 'react';
import api from '../api/axios';
import BlogCard from '../components/BlogCard';

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/bookmarks')
      .then(({ data }) => setPosts(data))
      .catch((err) => console.error('Failed to fetch bookmarks', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Bookmarks</h1>
          <p className="text-slate-400">Posts you've saved for later</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-500 text-lg">No bookmarks yet.</p>
            <p className="text-slate-600 text-sm mt-2">
              Bookmark posts from their detail page to see them here.
            </p>
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

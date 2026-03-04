import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/posts')
      .then(({ data }) => {
        const myPosts = data.filter((p) => p.author?._id === user?._id);
        setPosts(myPosts);
      })
      .catch((err) => console.error('Failed to fetch posts', err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="bg-slate-800 rounded-2xl p-8 mb-10 flex items-center gap-6">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-amber-400/30 flex items-center justify-center text-amber-400 text-3xl font-bold">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{user?.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
            {user?.bio && (
              <p className="text-slate-300 text-sm mt-2">{user.bio}</p>
            )}
          </div>
        </div>

        {/* My Posts */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-100">
              My Posts ({posts.length})
            </h2>
            <Link
              to="/create"
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              New Post
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-xl h-24 animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500">You haven&apos;t written any posts yet.</p>
              <Link
                to="/create"
                className="text-amber-400 hover:underline text-sm mt-2 inline-block"
              >
                Write your first post
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="bg-slate-800 rounded-xl p-5 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/posts/${post._id}`}
                      className="text-slate-100 font-semibold hover:text-amber-400 transition-colors line-clamp-1"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-slate-500 text-xs">{formatDate(post.createdAt)}</span>
                      <span className="text-slate-500 text-xs">
                        {post.likes?.length || 0} likes
                      </span>
                      {post.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="bg-amber-400/10 text-amber-400 text-xs px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/edit/${post._id}`}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="bg-red-900/40 hover:bg-red-900/60 text-red-400 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

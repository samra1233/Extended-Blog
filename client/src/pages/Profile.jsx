import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  const { user, login, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', avatar: '' });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/posts/mine?page=${page}`)
      .then(({ data }) => {
        setPosts(data.posts);
        setTotalPages(data.pages);
        setTotalPosts(data.total);
      })
      .catch(() => setError('Failed to load your posts.'))
      .finally(() => setLoading(false));
  }, [page]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const startEdit = () => {
    setEditForm({
      name: user?.name || '',
      bio: user?.bio || '',
      avatar: user?.avatar || '',
    });
    setEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', editForm);
      login(data, token);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;

  const goToPage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Profile header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-start gap-5">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-stone-100 flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 text-3xl font-bold flex-shrink-0 ring-2 ring-stone-100">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{user?.name}</h1>
                <button
                  onClick={startEdit}
                  className="text-sm font-medium text-stone-500 hover:text-stone-700 bg-stone-50 border border-stone-200 hover:border-stone-300 px-3.5 py-2 rounded-lg transition-colors"
                >
                  Edit profile
                </button>
              </div>
              <p className="text-stone-400 text-sm mt-0.5">{user?.email}</p>
              {user?.bio && (
                <p className="text-stone-600 text-sm mt-2 leading-relaxed">{user.bio}</p>
              )}
              {/* Stats row */}
              <div className="flex items-center gap-5 mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-stone-900">{totalPosts}</p>
                  <p className="text-xs text-stone-400">Total posts</p>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div className="text-center">
                  <p className="text-lg font-bold text-stone-900">{publishedCount}</p>
                  <p className="text-xs text-stone-400">Published</p>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div className="text-center">
                  <p className="text-lg font-bold text-stone-900">{draftCount}</p>
                  <p className="text-xs text-stone-400">Drafts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit profile form */}
          {editing && (
            <form onSubmit={handleEditSubmit} className="mt-6 pt-6 border-t border-stone-100 space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-stone-700 text-sm font-medium mb-1.5">Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label htmlFor="edit-bio" className="block text-stone-700 text-sm font-medium mb-1.5">Bio</label>
                <textarea
                  id="edit-bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  placeholder="Tell readers about yourself..."
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label htmlFor="edit-avatar" className="block text-stone-700 text-sm font-medium mb-1.5">
                  Avatar URL <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <input
                  id="edit-avatar"
                  type="url"
                  value={editForm.avatar}
                  onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="bg-white border border-stone-200 hover:border-stone-300 text-stone-600 font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Posts section */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">My posts</h2>
          <Link
            to="/create"
            className="bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            + Write new
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-100 h-20 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 && !error ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-16 text-center">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </div>
            <p className="text-stone-700 font-semibold mb-1">No posts yet</p>
            <p className="text-stone-400 text-sm mb-4">Start writing and your stories will appear here.</p>
            <Link
              to="/create"
              className="inline-block bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Write your first post
            </Link>
          </div>
        ) : (
          <>
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white rounded-2xl border border-stone-100 p-5 flex items-center justify-between gap-4 hover:border-stone-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/posts/${post._id}`}
                    className="text-stone-900 font-semibold hover:text-amber-700 transition-colors line-clamp-1 text-sm"
                  >
                    {post.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-stone-400 text-xs">{formatDate(post.createdAt)}</span>
                    {post.status === 'draft' ? (
                      <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        Draft
                      </span>
                    ) : (
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        Published
                      </span>
                    )}
                    <span className="text-stone-400 text-xs">
                      {post.likes?.length || 0} likes · {post.views || 0} views
                    </span>
                    {post.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag-pill">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/edit/${post._id}`}
                    className="bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-600 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-3.5 py-2 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-10 h-10 text-sm font-medium rounded-lg border transition-colors ${
                    p === page
                      ? 'bg-stone-900 border-stone-900 text-white'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3.5 py-2 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}

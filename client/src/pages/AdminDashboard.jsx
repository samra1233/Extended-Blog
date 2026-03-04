import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (tab === 'stats') {
          const { data } = await api.get('/admin/stats');
          setStats(data);
        } else if (tab === 'users') {
          const { data } = await api.get('/admin/users');
          setUsers(data);
        } else if (tab === 'posts') {
          const { data } = await api.get('/admin/posts');
          setPosts(data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all their content?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSetRole = async (userId, role) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === data._id ? { ...u, role: data.role } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Role update failed');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const tabs = [
    { key: 'stats', label: 'Statistics' },
    { key: 'users', label: 'Users' },
    { key: 'posts', label: 'All Posts' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mb-8">Manage platform users, posts, and view analytics.</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700 pb-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t.key
                  ? 'bg-amber-400 text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats Tab */}
            {tab === 'stats' && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Users', value: stats.userCount },
                    { label: 'Total Posts', value: stats.postCount },
                    { label: 'Total Comments', value: stats.commentCount },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-800 rounded-xl p-6 text-center">
                      <p className="text-4xl font-bold text-amber-400">{s.value}</p>
                      <p className="text-slate-400 text-sm mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {stats.topViewed?.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 mb-4">Most Viewed Posts</h2>
                    <div className="space-y-2">
                      {stats.topViewed.map((post) => (
                        <div key={post._id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                          <Link
                            to={`/posts/${post._id}`}
                            className="text-slate-200 hover:text-amber-400 font-medium text-sm transition-colors"
                          >
                            {post.title}
                          </Link>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>{post.views} views</span>
                            <span>{post.likes?.length || 0} likes</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats.topLiked?.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 mb-4">Most Liked Posts</h2>
                    <div className="space-y-2">
                      {stats.topLiked.map((post) => (
                        <div key={post._id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                          <Link
                            to={`/posts/${post._id}`}
                            className="text-slate-200 hover:text-amber-400 font-medium text-sm transition-colors"
                          >
                            {post.title}
                          </Link>
                          <span className="text-xs text-slate-400">{post.likes?.length || 0} likes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (
              <div className="space-y-3">
                {users.length === 0 ? (
                  <p className="text-slate-500 text-sm">No users found.</p>
                ) : (
                  users.map((u) => (
                    <div
                      key={u._id}
                      className="bg-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-amber-400/30 flex items-center justify-center text-amber-400 text-sm font-bold">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-slate-200 text-sm font-semibold">{u.name}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.role === 'admin'
                              ? 'bg-amber-400/20 text-amber-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {u.role}
                        </span>
                        {u._id !== user._id && (
                          <>
                            <button
                              onClick={() => handleSetRole(u._id, u.role === 'admin' ? 'user' : 'admin')}
                              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-lg transition-colors"
                            >
                              {u.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-400 px-3 py-1 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Posts Tab */}
            {tab === 'posts' && (
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <p className="text-slate-500 text-sm">No posts found.</p>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post._id}
                      className="bg-slate-800 rounded-xl p-4 flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/posts/${post._id}`}
                          className="text-slate-100 font-semibold hover:text-amber-400 transition-colors text-sm line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-slate-500 text-xs">by {post.author?.name}</span>
                          <span className="text-slate-500 text-xs">{post.views} views</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              post.status === 'published'
                                ? 'bg-green-900/40 text-green-400'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {post.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

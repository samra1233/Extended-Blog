import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 flex items-center gap-4">
      <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-stone-900 tracking-tight">{value}</p>
        <p className="text-stone-400 text-sm mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);

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
          const { data } = await api.get(`/admin/users?page=${usersPage}`);
          setUsers(data.users);
          setUsersTotalPages(data.pages);
        } else if (tab === 'posts') {
          const { data } = await api.get(`/admin/posts?page=${postsPage}`);
          setPosts(data.posts);
          setPostsTotalPages(data.pages);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab, usersPage, postsPage]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all their content?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSetRole = async (userId, role) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === data._id ? { ...u, role: data.role } : u)));
      toast.success(`Role updated to ${data.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Role update failed');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success('Post deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const tabs = [
    { key: 'stats', label: 'Statistics' },
    { key: 'users', label: 'Users' },
    { key: 'posts', label: 'All Posts' },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-stone-400 text-sm">Manage users, posts, and view platform analytics.</p>
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 border-b border-stone-100">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 -mb-px ${
                  tab === t.key
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-100 h-16 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {tab === 'stats' && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    label="Total users"
                    value={stats.userCount}
                    icon={
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    }
                  />
                  <StatCard
                    label="Total posts"
                    value={stats.postCount}
                    icon={
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    }
                  />
                  <StatCard
                    label="Total comments"
                    value={stats.commentCount}
                    icon={
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                    }
                  />
                </div>

                {stats.topViewed?.length > 0 && (
                  <div>
                    <h2 className="text-base font-bold text-stone-900 mb-3">Most viewed posts</h2>
                    <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-100 overflow-hidden">
                      {stats.topViewed.map((post, i) => (
                        <div key={post._id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-stone-300 text-sm font-medium w-5 text-center">{i + 1}</span>
                            <Link
                              to={`/posts/${post._id}`}
                              className="text-stone-700 hover:text-amber-700 font-medium text-sm transition-colors line-clamp-1"
                            >
                              {post.title}
                            </Link>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-stone-400 flex-shrink-0">
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
                    <h2 className="text-base font-bold text-stone-900 mb-3">Most liked posts</h2>
                    <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-100 overflow-hidden">
                      {stats.topLiked.map((post, i) => (
                        <div key={post._id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-stone-300 text-sm font-medium w-5 text-center">{i + 1}</span>
                            <Link
                              to={`/posts/${post._id}`}
                              className="text-stone-700 hover:text-amber-700 font-medium text-sm transition-colors line-clamp-1"
                            >
                              {post.title}
                            </Link>
                          </div>
                          <span className="text-xs text-stone-400 flex-shrink-0">{post.likes?.length || 0} likes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'users' && (
              <div>
                {users.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-stone-700 font-semibold mb-1">No users found</p>
                    <p className="text-stone-400 text-sm">Users will appear here once they register.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-100 overflow-x-auto">
                      {users.map((u) => (
                        <div key={u._id} className="px-5 py-4 flex items-center justify-between gap-4 min-w-[500px]">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold flex-shrink-0">
                                {u.name?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-stone-900 text-sm font-semibold">{u.name}</p>
                              <p className="text-stone-400 text-xs">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                                u.role === 'admin'
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-stone-50 border-stone-200 text-stone-500'
                              }`}
                            >
                              {u.role}
                            </span>
                            {u._id !== user._id && (
                              <>
                                <button
                                  onClick={() => handleSetRole(u._id, u.role === 'admin' ? 'user' : 'admin')}
                                  className="text-sm bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-600 px-3.5 py-2 rounded-lg transition-colors"
                                >
                                  {u.role === 'admin' ? 'Demote' : 'Promote'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="text-sm bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 px-3.5 py-2 rounded-lg transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {usersTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <button onClick={() => setUsersPage((p) => Math.max(1, p - 1))} disabled={usersPage <= 1} className="px-3.5 py-2 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
                        <span className="text-sm text-stone-500">Page {usersPage} of {usersTotalPages}</span>
                        <button onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))} disabled={usersPage >= usersTotalPages} className="px-3.5 py-2 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === 'posts' && (
              <div>
                {posts.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-stone-700 font-semibold mb-1">No posts found</p>
                    <p className="text-stone-400 text-sm">Posts will appear here once authors start writing.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-100 overflow-x-auto">
                      {posts.map((post) => (
                        <div key={post._id} className="px-5 py-4 flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/posts/${post._id}`}
                              className="text-stone-900 font-semibold hover:text-amber-700 transition-colors text-sm line-clamp-1"
                            >
                              {post.title}
                            </Link>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-stone-400 text-xs">by {post.author?.name}</span>
                              <span className="text-stone-400 text-xs">{post.views} views</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                                  post.status === 'published'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}
                              >
                                {post.status}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="text-sm bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 px-3.5 py-2 rounded-lg transition-colors flex-shrink-0"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                    {postsTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <button onClick={() => setPostsPage((p) => Math.max(1, p - 1))} disabled={postsPage <= 1} className="px-3.5 py-2 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
                        <span className="text-sm text-stone-500">Page {postsPage} of {postsTotalPages}</span>
                        <button onClick={() => setPostsPage((p) => Math.min(postsTotalPages, p + 1))} disabled={postsPage >= postsTotalPages} className="px-3.5 py-2 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PostDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    api
      .get(`/posts/${id}`)
      .then(({ data }) => setPost(data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  // Check bookmark status when user is logged in
  useEffect(() => {
    if (!token || !post) return;
    api.get('/auth/bookmarks').then(({ data }) => {
      setIsBookmarked(data.some((b) => b._id === post._id));
    }).catch(() => {});
  }, [token, post]);

  const handleLike = async () => {
    if (!token) return navigate('/login');
    setLikeLoading(true);
    try {
      const { data } = await api.put(`/posts/${id}/like`);
      setPost((prev) => ({ ...prev, likes: data.likes }));
    } catch (err) {
      console.error('Like failed', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!token) return navigate('/login');
    setBookmarkLoading(true);
    try {
      const { data } = await api.put(`/posts/${id}/bookmark`);
      setIsBookmarked(data.bookmarked);
    } catch (err) {
      console.error('Bookmark failed', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!post) return null;

  const isAuthor = user && post.author?._id === user._id;
  const isAdmin = user?.role === 'admin';
  const isLiked = user && post.likes?.some((id) => id === user._id || id?._id === user._id);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-72 object-cover rounded-2xl mb-8"
            onError={(e) => (e.target.style.display = 'none')}
          />
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags?.map((tag) => (
            <Link
              key={tag}
              to={`/?tag=${encodeURIComponent(tag)}`}
              className="bg-amber-400/10 text-amber-400 text-xs px-3 py-1 rounded-full font-medium hover:bg-amber-400/20 transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>

        {post.status === 'draft' && (
          <div className="bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg inline-block mb-4 font-medium">
            Draft — not publicly visible
          </div>
        )}

        <h1 className="text-4xl font-bold text-slate-100 mb-6 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
                {post.author?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <p className="text-slate-200 text-sm font-semibold">{post.author?.name}</p>
              <p className="text-slate-500 text-xs">
                {formatDate(post.createdAt)} · {post.views || 0} views
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isLiked
                  ? 'bg-amber-400/20 text-amber-400 hover:bg-amber-400/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.likes?.length || 0}
            </button>

            {/* Bookmark button */}
            {token && (
              <button
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark this post'}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isBookmarked
                    ? 'bg-amber-400/20 text-amber-400 hover:bg-amber-400/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}

            {(isAuthor || isAdmin) && (
              <>
                <Link
                  to={`/edit/${id}`}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        <div className="text-slate-300 leading-relaxed text-base whitespace-pre-wrap mb-12">
          {post.content}
        </div>

        <CommentSection postId={id} />
      </div>
    </div>
  );
}

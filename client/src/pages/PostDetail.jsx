import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import AISummarizer from '../components/AISummarizer';
import FollowButton from '../components/FollowButton';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function estimateReadTime(content) {
  const words = content?.split(/\s+/).length || 0;
  return Math.max(1, Math.ceil(words / 200));
}

export default function PostDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setError('');
    setLoading(true);
    api
      .get(`/posts/${id}`)
      .then(({ data }) => setPost(data))
      .catch(() => setError('Post not found or has been removed.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!token || !post) return;
    api.get('/auth/bookmarks').then(({ data }) => {
      setIsBookmarked(data.some((b) => b._id === post._id));
    }).catch(() => {});
  }, [token, post]);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLike = async () => {
    if (!token) return navigate('/login');
    setLikeLoading(true);
    try {
      const { data } = await api.put(`/posts/${id}/like`);
      setPost((prev) => ({ ...prev, likes: data.likes }));
      const liked = data.likes.some((l) => l === user._id || l?._id === user._id);
      toast.success(liked ? 'Post liked' : 'Like removed');
    } catch {
      toast.error('Failed to update like');
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
      toast.success(data.bookmarked ? 'Post saved to bookmarks' : 'Removed from bookmarks');
    } catch {
      toast.error('Failed to update bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      toast.success('Post deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading post…</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-7xl font-black text-stone-200 mb-4">404</p>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">Post not found</h1>
          <p className="text-stone-500 text-sm mb-8">
            {error || 'This post may have been removed or does not exist.'}
          </p>
          <Link
            to="/"
            className="bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user && post.author?._id === user._id;
  const isAdmin = user?.role === 'admin';
  const isLiked = user && post.likes?.some((l) => l === user._id || l?._id === user._id);
  const readTime = estimateReadTime(post.content);

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-amber-500 z-[60] transition-[width] duration-75 ease-linear"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* Cover image — full-bleed */}
      {post.coverImage && (
        <div className="w-full bg-stone-100">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full max-h-[480px] object-cover"
            loading="lazy"
            onError={(e) => (e.target.parentElement.style.display = 'none')}
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Draft banner */}
        {post.status === 'draft' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6 font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Draft — this post is not publicly visible
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/?tag=${encodeURIComponent(tag)}`}
                className="tag-pill hover:bg-amber-100 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-6 leading-tight tracking-tight">
          {post.title}
        </h1>

        {/* Author row + actions */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-stone-200 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-stone-100"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg ring-2 ring-stone-100">
                {post.author?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-stone-900 text-sm font-semibold">{post.author?.name}</p>
                <FollowButton
                  authorId={post.author?._id?.toString()}
                  authorName={post.author?.name}
                />
              </div>
              <p className="text-stone-400 text-xs mt-0.5">
                {formatDate(post.createdAt)} · {readTime} min read · {post.views || 0} views
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={likeLoading}
              aria-label={isLiked ? 'Unlike post' : 'Like post'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                isLiked
                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.likes?.length || 0}
            </button>

            {/* Bookmark */}
            {token && (
              <button
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                  isBookmarked
                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {isBookmarked ? 'Saved' : 'Save'}
              </button>
            )}

            {/* Share */}
            <button
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: post.title, url });
                } else {
                  navigator.clipboard.writeText(url);
                  toast.success('Link copied to clipboard');
                }
              }}
              aria-label="Share post"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              Share
            </button>

            {(isAuthor || isAdmin) && (
              <>
                <Link
                  to={`/edit/${id}`}
                  className="bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-150"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-150"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* AI Summarizer */}
        {post.status === 'published' && <AISummarizer content={post.content} />}

        {/* Article body */}
        <div className="article-prose mb-16">
          <ReactMarkdown
            rehypePlugins={[rehypeSanitize]}
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold text-stone-900 mt-10 mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-semibold text-stone-800 mt-6 mb-2">{children}</h3>,
              p: ({ children }) => <p className="text-stone-700 leading-relaxed mb-4">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-stone-700">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-stone-700">{children}</ol>,
              li: ({ children }) => <li className="ml-2">{children}</li>,
              code: ({ inline, children }) => inline
                ? <code className="bg-stone-100 text-amber-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                : <code>{children}</code>,
              pre: ({ children }) => <pre className="bg-stone-900 text-stone-100 rounded-xl p-4 overflow-x-auto mb-4 text-sm font-mono">{children}</pre>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-amber-300 pl-4 italic text-stone-500 my-4">{children}</blockquote>,
              strong: ({ children }) => <strong className="font-semibold text-stone-900">{children}</strong>,
              a: ({ href, children }) => {
                const safeHref = href && !href.startsWith('javascript:') ? href : '#';
                return <a href={safeHref} className="text-amber-600 underline hover:text-amber-700" rel="noopener noreferrer">{children}</a>;
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <div className="border-t border-stone-200 mb-12" />

        <CommentSection postId={id} />
      </div>
    </div>
  );
}

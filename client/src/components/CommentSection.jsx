import { useState, useEffect } from 'react';
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

function Avatar({ name, avatar, size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  if (avatar) {
    return <img src={avatar} alt={name} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function CommentNode({ comment, postId, user, onDelete, onReply }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(replyText.trim(), comment._id);
      setReplyText('');
      setShowReplyForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
      {/* Comment header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={comment.author?.name} avatar={comment.author?.avatar} />
          <div>
            <p className="text-stone-900 text-sm font-semibold leading-none">{comment.author?.name}</p>
            <p className="text-stone-400 text-xs mt-1">{formatDate(comment.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {user && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              aria-label="Reply to comment"
              className="text-stone-400 hover:text-amber-600 text-sm font-medium px-2.5 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
            >
              Reply
            </button>
          )}
          {user && comment.author?._id === user._id && (
            <button
              onClick={() => onDelete(comment._id)}
              aria-label="Delete comment"
              className="text-stone-300 hover:text-red-500 text-sm font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Comment body */}
      <p className="text-stone-700 text-sm leading-relaxed">{comment.content}</p>

      {/* Reply form */}
      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mt-4 pl-4 border-l-2 border-stone-100">
          <label htmlFor={`reply-${comment._id}`} className="sr-only">Write a reply</label>
          <textarea
            id={`reply-${comment._id}`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            rows={2}
            className="w-full bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-colors"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Posting…' : 'Post reply'}
            </button>
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="text-stone-500 hover:text-stone-700 text-sm px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-4 ml-3 space-y-3 pl-4 border-l-2 border-stone-100">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply._id}
              comment={reply}
              postId={postId}
              user={user}
              onDelete={onDelete}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId }) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/${postId}`);
      setComments(data);
      setError('');
    } catch {
      setError('Failed to load comments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const totalCount = (nodes) => {
    let count = 0;
    nodes.forEach((n) => {
      count++;
      if (n.replies?.length) count += totalCount(n.replies);
    });
    return count;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/comments/${postId}`, { content: newComment.trim() });
      setNewComment('');
      toast.success('Comment posted');
      await fetchComments();
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (content, parentId) => {
    try {
      await api.post(`/comments/${postId}`, { content, parentId });
      toast.success('Reply posted');
      await fetchComments();
    } catch {
      toast.error('Failed to post reply');
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      toast.success('Comment deleted');
      await fetchComments();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const count = totalCount(comments);

  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-6 tracking-tight">
        {count > 0 ? `${count} comment${count !== 1 ? 's' : ''}` : 'Comments'}
      </h3>

      {/* New comment form */}
      {token ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-start gap-3">
            <Avatar name={user?.name} avatar={user?.avatar} size="md" />
            <div className="flex-1">
              <label htmlFor="new-comment" className="sr-only">Write a comment</label>
              <textarea
                id="new-comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts…"
                rows={3}
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="mt-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                {submitting ? 'Posting…' : 'Post comment'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 mb-8 text-center">
          <p className="text-stone-500 text-sm">
            <a href="/login" className="text-amber-600 hover:text-amber-700 font-medium">Sign in</a>
            {' '}to join the conversation
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5 animate-pulse">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-stone-100" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-stone-100 rounded-full w-24" />
                  <div className="h-2.5 bg-stone-100 rounded-full w-16" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-stone-100 rounded-full w-full" />
                <div className="h-3 bg-stone-100 rounded-full w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 && !error ? (
        <p className="text-stone-400 text-sm text-center py-6">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentNode
              key={comment._id}
              comment={comment}
              postId={postId}
              user={user}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

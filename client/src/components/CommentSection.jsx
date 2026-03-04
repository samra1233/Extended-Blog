import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {comment.author?.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-400/30 flex items-center justify-center text-amber-400 text-xs font-bold">
              {comment.author?.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <p className="text-slate-200 text-sm font-semibold">{comment.author?.name}</p>
            <p className="text-slate-500 text-xs">{formatDate(comment.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-slate-400 hover:text-amber-400 text-xs font-medium transition-colors"
            >
              Reply
            </button>
          )}
          {user && comment.author?._id === user._id && (
            <button
              onClick={() => onDelete(comment._id)}
              className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <p className="text-slate-300 text-sm leading-relaxed">{comment.content}</p>

      {/* Reply form */}
      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mt-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="w-full bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-900 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="text-slate-400 text-xs px-3 py-1.5 rounded-lg hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-4 ml-4 space-y-3 border-l-2 border-slate-700 pl-4">
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
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/${postId}`);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
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
      await fetchComments();
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (content, parentId) => {
    await api.post(`/comments/${postId}`, { content, parentId });
    await fetchComments();
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      await fetchComments();
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold text-slate-100 mb-6">
        Comments ({totalCount(comments)})
      </h3>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-slate-500 text-sm">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4 mb-8">
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

      {token && (
        <form onSubmit={handleSubmit} className="mt-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-3 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      {!token && (
        <p className="text-slate-500 text-sm mt-4">
          <a href="/login" className="text-amber-400 hover:underline">
            Log in
          </a>{' '}
          to leave a comment.
        </p>
      )}
    </div>
  );
}

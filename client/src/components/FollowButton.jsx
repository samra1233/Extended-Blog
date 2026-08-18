import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext';

export default function FollowButton({ authorId, authorName, className = '' }) {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!authorId || !user || user._id === authorId) return null;

  const isFollowing = user.following?.some((id) => {
    const idStr = typeof id === 'string' ? id : id?._id?.toString() ?? id?.toString();
    return idStr === authorId;
  });

  const handleToggle = async () => {
    if (!token) return navigate('/login');
    setLoading(true);
    try {
      const { data } = await api.put(`/auth/follow/${authorId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.following) {
        updateUser({ following: [...(user.following || []), authorId] });
      } else {
        updateUser({
          following: (user.following || []).filter((id) => {
            const idStr = typeof id === 'string' ? id : id?._id?.toString() ?? id?.toString();
            return idStr !== authorId;
          }),
        });
      }
      toast.success(data.following ? `Following ${authorName}` : `Unfollowed ${authorName}`);
    } catch {
      toast.error('Failed to update follow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 disabled:opacity-50 ${
        isFollowing
          ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
          : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
      } ${className}`}
    >
      {isFollowing ? (
        <>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Following
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Follow
        </>
      )}
    </button>
  );
}

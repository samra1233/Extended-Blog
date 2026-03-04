import { useNavigate } from 'react-router-dom';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BlogCard({ post }) {
  const navigate = useNavigate();

  const excerpt =
    post.content.length > 150 ? post.content.slice(0, 150) + '...' : post.content;

  return (
    <div
      onClick={() => navigate(`/posts/${post._id}`)}
      className="bg-slate-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-amber-400/10 hover:shadow-xl"
    >
      {post.coverImage ? (
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
      ) : null}
      <div
        className="w-full h-48 bg-gradient-to-br from-amber-400/20 to-slate-700"
        style={{ display: post.coverImage ? 'none' : 'block' }}
      />

      <div className="p-5">
        <h2 className="text-slate-100 text-xl font-bold mb-2 line-clamp-2 leading-snug">
          {post.title}
        </h2>

        <p className="text-slate-400 text-sm mb-4 leading-relaxed">{excerpt}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-amber-400/10 text-amber-400 text-xs px-2 py-0.5 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-400/30 flex items-center justify-center text-amber-400 text-xs font-bold">
                {post.author?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span className="text-slate-400 text-xs font-medium">{post.author?.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-xs">
              {formatDate(post.createdAt)}
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              {post.likes?.length || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

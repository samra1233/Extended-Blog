import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function estimateReadTime(content) {
  const words = content?.split(/\s+/).length || 0;
  return Math.max(1, Math.ceil(words / 200));
}

// Deterministic gradient based on post title (gives each unimaged post a unique color)
const GRADIENTS = [
  'from-amber-50 to-orange-100',
  'from-sky-50 to-blue-100',
  'from-emerald-50 to-teal-100',
  'from-violet-50 to-purple-100',
  'from-rose-50 to-pink-100',
  'from-stone-50 to-amber-50',
];

function getGradient(title) {
  const index = (title?.charCodeAt(0) || 0) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getLetterColor(title) {
  const colors = [
    'text-amber-300',
    'text-sky-200',
    'text-emerald-200',
    'text-violet-200',
    'text-rose-200',
    'text-stone-300',
  ];
  const index = (title?.charCodeAt(0) || 0) % colors.length;
  return colors[index];
}

const CARD_IMAGES = [
  '/images/image-1.png',
  '/images/image-2.png',
  '/images/image-3.png',
  '/images/image-4.png',
  '/images/image-5.png',
  '/images/image-6.png',
];

export default memo(function BlogCard({ post, index = 0 }) {
  const navigate = useNavigate();

  const excerpt =
    post.content.length > 130
      ? post.content.replace(/\n/g, ' ').slice(0, 130).trim() + '…'
      : post.content;

  const readTime = estimateReadTime(post.content);
  const cardImage = CARD_IMAGES[index % CARD_IMAGES.length];
  const gradient = getGradient(post.title);
  const letterColor = getLetterColor(post.title);

  return (
    <article
      onClick={() => navigate(`/posts/${post._id}`)}
      className="bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer group
                 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] hover:shadow-[0_8px_25px_-5px_rgb(0,0,0,0.1)]
                 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Cover image */}
      <div className="aspect-[16/10] overflow-hidden relative">
        {post.coverImage ? (
          <>
            <img
              src={post.coverImage}
              alt={post.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradient} items-center justify-center hidden`}
            >
              <span className={`text-[7rem] font-black ${letterColor} leading-none select-none opacity-60`}>
                {post.title?.[0]?.toUpperCase()}
              </span>
            </div>
          </>
        ) : (
          <img
            src={cardImage}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Draft badge overlay */}
        {post.status === 'draft' && (
          <div className="absolute top-3 left-3 bg-stone-900/80 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
            Draft
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
            {post.tags.length > 2 && (
              <span className="text-stone-400 text-xs py-0.5">+{post.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Title */}
        <h2 className="text-stone-900 text-lg font-semibold leading-snug mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors duration-150">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-4">
          {excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          {/* Author */}
          <div className="flex items-center gap-2">
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                {post.author?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span className="text-stone-600 text-xs font-medium truncate max-w-[80px]">
              {post.author?.name}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-stone-400 text-xs">
            <span>{formatDate(post.createdAt)}</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-stone-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              {post.likes?.length || 0}
            </span>
            <span>{readTime} min</span>
          </div>
        </div>
      </div>
    </article>
  );
})

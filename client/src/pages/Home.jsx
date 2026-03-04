import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import BlogCard from '../components/BlogCard';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || '');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const q = searchParams.get('q') || '';
      const tag = searchParams.get('tag') || '';

      let data;
      if (q) {
        ({ data } = await api.get(`/posts/search?q=${encodeURIComponent(q)}`));
      } else if (tag) {
        ({ data } = await api.get(`/posts?tag=${encodeURIComponent(tag)}`));
      } else {
        ({ data } = await api.get('/posts'));
      }
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (searchInput.trim()) params.q = searchInput.trim();
    setActiveTag('');
    setSearchParams(params);
  };

  const handleTagClick = (tag) => {
    const newTag = activeTag === tag ? '' : tag;
    setActiveTag(newTag);
    setSearchInput('');
    setSearchParams(newTag ? { tag: newTag } : {});
  };

  const handleClear = () => {
    setSearchInput('');
    setActiveTag('');
    setSearchParams({});
  };

  const allTags = [...new Set(posts.flatMap((p) => p.tags || []))].slice(0, 12);
  const isFiltered = searchParams.get('q') || searchParams.get('tag');

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Latest Stories</h1>
          <p className="text-slate-400">Discover ideas, insights, and inspiration</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts..."
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Search
          </button>
          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        {/* Tag filter pills — only show when not searching by text */}
        {!searchParams.get('q') && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  activeTag === tag
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Active filter label */}
        {isFiltered && (
          <p className="text-slate-400 text-sm mb-6">
            {searchParams.get('q') && (
              <>Showing results for <span className="text-amber-400 font-medium">"{searchParams.get('q')}"</span></>
            )}
            {searchParams.get('tag') && (
              <>Filtering by tag <span className="text-amber-400 font-medium">#{searchParams.get('tag')}</span></>
            )}
            {' '}— {posts.length} post{posts.length !== 1 ? 's' : ''} found
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-500 text-lg">
              {isFiltered ? 'No posts match your search.' : 'No posts yet.'}
            </p>
            <p className="text-slate-600 text-sm mt-2">
              {isFiltered
                ? 'Try a different search term or clear the filter.'
                : 'Be the first to write something!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

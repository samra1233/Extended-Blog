import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import BlogCard from '../components/BlogCard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('all'); 
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = searchParams.get('q') || '';
      const tag = searchParams.get('tag') || '';
      const currentPage = parseInt(searchParams.get('page')) || 1;

      let data;
      if (activeTab === 'following' && token) {
        ({ data } = await api.get(`/auth/following-feed?page=${currentPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        }));
      } else if (q) {
        ({ data } = await api.get(`/posts/search?q=${encodeURIComponent(q)}&page=${currentPage}`));
      } else if (tag) {
        ({ data } = await api.get(`/posts?tag=${encodeURIComponent(tag)}&page=${currentPage}`));
      } else {
        ({ data } = await api.get(`/posts?page=${currentPage}`));
      }
      setPosts(data.posts);
      setPage(data.page);
      setTotalPages(data.pages);
      setTotalPosts(data.total);
    } catch {
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchParams, activeTab, token]);

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

  const goToPage = (p) => {
    const params = {};
    const q = searchParams.get('q');
    const tag = searchParams.get('tag');
    if (q) params.q = q;
    if (tag) params.tag = tag;
    if (p > 1) params.page = p;
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allTags = [...new Set(posts.flatMap((p) => p.tags || []))].slice(0, 12);
  const isFiltered = searchParams.get('q') || searchParams.get('tag');

  return (
    <div className="min-h-screen bg-stone-50">

      <div className="bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-3 tracking-tight">
              Latest Stories
            </h1>
            <p className="text-stone-500 text-lg mb-8">
              Discover ideas, insights, and perspectives from our community of writers.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2.5">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                </svg>
                <label htmlFor="search-input" className="sr-only">Search stories</label>
                <input
                  id="search-input"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search stories..."
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-colors"
                />
              </div>
              <button
                type="submit"
                className="bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors flex-shrink-0"
              >
                Search
              </button>
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 text-sm px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {user && (
          <div className="flex items-center gap-1 mb-8 border-b border-stone-200 pb-0">
            {[
              { id: 'all', label: 'All Stories' },
              { id: 'following', label: 'Following' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchInput('');
                  setActiveTag('');
                  setSearchParams({});
                }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {!loading && !searchParams.get('q') && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by tag">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`text-xs px-4 py-2 rounded-full font-medium border transition-all duration-150 ${
                  activeTag === tag
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {isFiltered && !loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-stone-500 text-sm">
              {searchParams.get('q') && (
                <>
                  Results for{' '}
                  <span className="text-stone-900 font-semibold">"{searchParams.get('q')}"</span>
                </>
              )}
              {searchParams.get('tag') && (
                <>
                  Tagged{' '}
                  <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-xs">
                    {searchParams.get('tag')}
                  </span>
                </>
              )}
              {' — '}
              <span className="font-medium text-stone-700">
                {totalPosts} {totalPosts === 1 ? 'post' : 'posts'} found
              </span>
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-stone-700 font-semibold text-lg mb-1">{error}</p>
            <button onClick={fetchPosts} className="mt-3 text-amber-600 hover:text-amber-700 text-sm font-medium">
              Try again
            </button>
          </div>
        )}

        {!error && (loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-stone-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-stone-100 rounded-full w-1/3" />
                  <div className="h-5 bg-stone-100 rounded-full w-5/6" />
                  <div className="h-4 bg-stone-100 rounded-full w-full" />
                  <div className="h-4 bg-stone-100 rounded-full w-4/5" />
                  <div className="pt-3 flex justify-between">
                    <div className="h-3 bg-stone-100 rounded-full w-1/4" />
                    <div className="h-3 bg-stone-100 rounded-full w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-stone-700 font-semibold text-lg mb-1">
              {activeTab === 'following' ? 'Your feed is empty' : isFiltered ? 'No posts found' : 'Nothing here yet'}
            </p>
            <p className="text-stone-400 text-sm">
              {activeTab === 'following'
                ? 'Follow some authors to see their posts here.'
                : isFiltered
                  ? 'Try adjusting your search or clearing the filter.'
                  : 'Be the first to publish a story.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <BlogCard key={post._id} post={post} index={index} />
            ))}
          </div>
        ))}

        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3.5 py-2 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-stone-400 text-sm">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item)}
                    className={`w-10 h-10 text-sm font-medium rounded-lg border transition-colors ${
                      item === page
                        ? 'bg-stone-900 border-stone-900 text-white'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3.5 py-2 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

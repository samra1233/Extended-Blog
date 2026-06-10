import { useState, useCallback } from 'react';
import api from '../api/axios.js';

export default function AISummarizer({ content }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const handleSummarize = useCallback(async () => {
    // Already have a summary — just toggle visibility
    if (summary) {
      setOpen((v) => !v);
      return;
    }

    setLoading(true);
    setError('');
    setOpen(true);

    try {
      const { data } = await api.post('/ai/summarize', { content });
      setSummary(data.summary);
    } catch (err) {
      console.error('Summarization error:', err);
      const msg = err.response?.data?.message || 'Failed to generate summary. Please try again.';
      setError(msg);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [content, summary]);

  // Nothing useful to summarize under 100 words
  const wordCount = content?.trim().split(/\s+/).length || 0;
  if (wordCount < 100) return null;

  return (
    <div className="mb-8">
      <button
        onClick={handleSummarize}
        disabled={loading}
        className={`group flex items-center gap-2.5 text-sm font-medium px-4 py-2.5 rounded-xl border transition-all duration-200 ${
          summary
            ? 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
            : 'bg-white border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50'
        } disabled:opacity-60 disabled:cursor-wait`}
      >
        <svg
          className={`w-4 h-4 flex-shrink-0 ${loading ? 'animate-pulse' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
        {loading
          ? 'Summarizing…'
          : summary
            ? (open ? 'Hide AI Summary' : 'Show AI Summary')
            : 'Summarize with AI'}
      </button>

      {open && summary && (
        <div className="mt-3 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-violet-700 text-xs font-semibold uppercase tracking-wide">AI-Generated Summary</span>
          </div>
          <p className="text-stone-700 text-sm leading-relaxed">{summary}</p>
          <p className="text-violet-400 text-xs mt-3">
            Powered by BART · facebook/bart-large-cnn via HuggingFace
          </p>
        </div>
      )}

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
    </div>
  );
}

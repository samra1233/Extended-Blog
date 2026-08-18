import { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext';

const inputClass =
  'w-full bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-colors';
const labelClass = 'block text-stone-700 text-sm font-medium mb-1.5';

export default function PostForm({ form, onChange, onSubmit, error, loading, submitLabel, cancelPath }) {
  const { token } = useAuth();
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);
  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      onChange({ target: { name: 'coverImage', value: data.url } });
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [token, onChange]);

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label htmlFor="post-title" className={labelClass}>
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="post-title"
            type="text"
            name="title"
            value={form.title}
            onChange={onChange}
            required
            placeholder="Give your post a great title"
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Cover image{' '}
            <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="post-cover"
              type="url"
              name="coverImage"
              value={form.coverImage}
              onChange={onChange}
              placeholder="https://example.com/image.jpg"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50 text-stone-600 hover:text-amber-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              <svg className={`w-4 h-4 ${uploading ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {uploadError && (
            <p className="mt-1.5 text-red-500 text-xs">{uploadError}</p>
          )}
          {form.coverImage && (
            <div className="mt-2 rounded-xl overflow-hidden border border-stone-200 aspect-[16/6]">
              <img
                src={form.coverImage}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={(e) => (e.target.parentElement.style.display = 'none')}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="post-tags" className={labelClass}>
            Tags{' '}
            <span className="text-stone-400 font-normal">(comma-separated, max 20)</span>
          </label>
          <input
            id="post-tags"
            type="text"
            name="tags"
            value={form.tags}
            onChange={onChange}
            placeholder="technology, design, coding"
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="post-content" className={labelClass + ' mb-0'}>
              Content <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center rounded-lg border border-stone-200 overflow-hidden text-xs font-medium">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-1.5 transition-colors ${!previewMode ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-1.5 transition-colors ${previewMode ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                Preview
              </button>
            </div>
          </div>

          {previewMode ? (
            <div className="min-h-[360px] bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm leading-relaxed overflow-auto">
              {form.content.trim() ? (
                <ReactMarkdown
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-stone-900 mt-6 mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-stone-900 mt-5 mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-stone-800 mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="text-stone-700 leading-relaxed mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-stone-700">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-stone-700">{children}</ol>,
                    code: ({ inline, children }) => inline
                      ? <code className="bg-stone-100 text-amber-700 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                      : <code>{children}</code>,
                    pre: ({ children }) => <pre className="bg-stone-900 text-stone-100 rounded-xl p-4 overflow-x-auto mb-3 text-xs font-mono">{children}</pre>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-amber-300 pl-4 italic text-stone-500 my-3">{children}</blockquote>,
                    strong: ({ children }) => <strong className="font-semibold text-stone-900">{children}</strong>,
                  }}
                >
                  {form.content}
                </ReactMarkdown>
              ) : (
                <p className="text-stone-400 italic">Nothing to preview yet.</p>
              )}
            </div>
          ) : (
            <textarea
              id="post-content"
              name="content"
              value={form.content}
              onChange={onChange}
              required
              placeholder="Write your story here… Markdown is supported."
              rows={18}
              className={`${inputClass} resize-none leading-relaxed`}
            />
          )}

          <div className="flex justify-between mt-1.5 text-xs text-stone-400">
            <span>{wordCount} words</span>
            <span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Visibility</legend>
          <div className="flex gap-3">
            {[
              { value: 'published', label: 'Published', desc: 'Visible to everyone' },
              { value: 'draft', label: 'Draft', desc: 'Only visible to you' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                  form.status === opt.value
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  checked={form.status === opt.value}
                  onChange={onChange}
                  className="accent-amber-500"
                />
                <div>
                  <p className="text-stone-900 text-sm font-medium">{opt.label}</p>
                  <p className="text-stone-400 text-xs">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-3 pt-2 border-t border-stone-100">
          <button
            type="submit"
            disabled={loading}
            className="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Saving…' : submitLabel}
          </button>
          {cancelPath && (
            <a
              href={cancelPath}
              className="bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-600 font-medium px-6 py-3 rounded-xl transition-colors text-sm inline-flex items-center"
            >
              Cancel
            </a>
          )}
        </div>
      </form>
    </>
  );
}

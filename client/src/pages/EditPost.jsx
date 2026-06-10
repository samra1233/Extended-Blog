import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PostForm from '../components/PostForm';

export default function EditPost() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    coverImage: '',
    tags: '',
    content: '',
    status: 'published',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api
      .get(`/posts/${id}`)
      .then(({ data }) => {
        const isAuthor = data.author?._id === user?._id;
        const isAdmin = user?.role === 'admin';
        if (!isAuthor && !isAdmin) {
          navigate('/');
          return;
        }
        setForm({
          title: data.title,
          coverImage: data.coverImage || '',
          tags: data.tags?.join(', ') || '',
          content: data.content,
          status: data.status || 'published',
        });
      })
      .catch(() => navigate('/'))
      .finally(() => setFetching(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        coverImage: form.coverImage.trim(),
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        status: form.status,
      };
      await api.put(`/posts/${id}`, payload);
      toast.success('Post updated');
      navigate(`/posts/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Edit post</h1>
          <p className="text-stone-500 text-sm mt-1">Update your story</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <PostForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          error={error}
          loading={loading}
          submitLabel="Save changes"
          cancelPath={`/posts/${id}`}
        />
      </div>
    </div>
  );
}

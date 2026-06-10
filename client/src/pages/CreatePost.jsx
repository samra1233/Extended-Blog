import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import PostForm from '../components/PostForm';

export default function CreatePost() {
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
      const { data } = await api.post('/posts', payload);
      toast.success(form.status === 'draft' ? 'Draft saved' : 'Post published');
      navigate(`/posts/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">New post</h1>
          <p className="text-stone-500 text-sm mt-1">Share your story with the world</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <PostForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          error={error}
          loading={loading}
          submitLabel={form.status === 'draft' ? 'Save draft' : 'Publish post'}
          cancelPath="/"
        />
      </div>
    </div>
  );
}

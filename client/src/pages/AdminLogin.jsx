import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@inkwell.com');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data, data.token);
      toast.success('Authenticated as Primary Admin');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-stone-900 text-stone-100">
      <div className="w-full max-w-md bg-stone-800 border border-stone-700 p-8 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-stone-950 font-bold text-xl">
            👑
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Primary Admin Portal</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-stone-900 border border-stone-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-stone-900 border border-stone-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3.5 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In as Primary Admin'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-700 text-center text-xs text-stone-400">
          <Link to="/login" className="hover:text-amber-400 transition-colors">
            Return to User Login
          </Link>
        </div>
      </div>
    </div>
  );
}

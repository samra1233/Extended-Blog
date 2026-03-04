import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-amber-400 tracking-tight">
          InkWell
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/"
                className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/create"
                className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium"
              >
                Create Post
              </Link>
              <Link
                to="/bookmarks"
                className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium"
              >
                Bookmarks
              </Link>
              <Link
                to="/profile"
                className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium"
              >
                Profile
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

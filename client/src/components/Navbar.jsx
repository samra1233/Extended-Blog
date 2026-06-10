import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationItem({ n, onRemove }) {
  const typeLabel = {
    like:    (s) => `${s} liked your post`,
    comment: (s) => `${s} commented on your post`,
    follow:  (s) => `${s} started following you`,
  };
  const label = typeLabel[n.type]?.(n.sender?.name || 'Someone') ?? n.type;
  const postSlug = n.post?.slug || n.post?._id;

  return (
    <div className={`flex items-start gap-3 px-4 py-3 group transition-colors ${n.read ? 'bg-white hover:bg-stone-50' : 'bg-amber-50 hover:bg-amber-100/60'}`}>
      {n.sender?.avatar ? (
        <img src={n.sender.avatar} alt={n.sender.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0 mt-0.5">
          {n.sender?.name?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-stone-700 text-xs leading-snug">{label}</p>
        {n.post && (
          <Link
            to={`/posts/${postSlug}`}
            className="text-amber-700 text-xs font-medium line-clamp-1 hover:underline"
          >
            {n.post.title}
          </Link>
        )}
        <p className="text-stone-400 text-[11px] mt-0.5">{timeAgo(n.createdAt)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(n._id); }}
        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-stone-500 transition-opacity p-0.5 flex-shrink-0"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, removeNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const navLinkClass = (path) =>
    `btn-ghost ${isActive(path) ? 'text-amber-700 bg-amber-50' : ''}`;
  const mobileNavClass = (path) =>
    `block py-2.5 text-sm font-medium transition-colors ${
      isActive(path) ? 'text-amber-700' : 'text-stone-700 hover:text-stone-900'
    }`;

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifToggle = () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening && unreadCount > 0) markAllRead();
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-amber-600 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
            </div>
            <span className="text-xl font-bold text-stone-900 tracking-tight">InkWell</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <Link to="/" className={navLinkClass('/')}>Home</Link>
                <Link to="/bookmarks" className={navLinkClass('/bookmarks')}>Bookmarks</Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`font-medium px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive('/admin')
                        ? 'text-amber-800 bg-amber-100'
                        : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                    }`}
                  >
                    Admin
                  </Link>
                )}

                {/* Notification bell */}
                <div className="relative ml-1" ref={notifRef}>
                  <button
                    onClick={handleNotifToggle}
                    aria-label="Notifications"
                    className="relative p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                        <p className="text-sm font-semibold text-stone-900">Notifications</p>
                        {notifications.length > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <p className="text-stone-400 text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <NotificationItem key={n._id} n={n} onRemove={removeNotification} />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/profile" className={`flex items-center gap-2 ml-1 pl-3 border-l border-stone-200 ${isActive('/profile') ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}>
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold flex-shrink-0">
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm font-medium text-stone-700 max-w-[100px] truncate">{user.name}</span>
                </Link>
                <Link
                  to="/create"
                  className="ml-3 bg-stone-900 hover:bg-stone-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                >
                  + Write
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-1 text-stone-400 hover:text-stone-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/" className={navLinkClass('/')}>Home</Link>
                <Link to="/login" className={navLinkClass('/login')}>Sign in</Link>
                <Link
                  to="/register"
                  className="ml-1 bg-stone-900 hover:bg-stone-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white px-6 py-4 space-y-1">
          {user ? (
            <>
              <div className="flex items-center gap-3 pb-4 mb-3 border-b border-stone-100">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{user.name}</p>
                  <p className="text-xs text-stone-500">{user.role === 'admin' ? 'Administrator' : 'Author'}</p>
                </div>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <Link to="/" onClick={() => setMobileOpen(false)} className={mobileNavClass('/')}>Home</Link>
              <Link to="/create" onClick={() => setMobileOpen(false)} className={mobileNavClass('/create')}>Write a post</Link>
              <Link to="/bookmarks" onClick={() => setMobileOpen(false)} className={mobileNavClass('/bookmarks')}>Bookmarks</Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className={mobileNavClass('/profile')}>Profile</Link>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className={`block py-2.5 text-sm font-medium ${isActive('/admin') ? 'text-amber-800' : 'text-amber-700'}`}>Admin dashboard</Link>
              )}
              <button onClick={handleLogout} className="block w-full text-left py-2.5 text-sm text-stone-500 hover:text-stone-900 font-medium mt-2 pt-3 border-t border-stone-100">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/" onClick={() => setMobileOpen(false)} className={mobileNavClass('/')}>Home</Link>
              <Link to="/login" onClick={() => setMobileOpen(false)} className={mobileNavClass('/login')}>Sign in</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block mt-2 bg-stone-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center">Get started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

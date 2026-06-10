import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Lazy-loaded pages — only downloaded when the route is visited
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const EditPost = lazy(() => import('./pages/EditPost'));
const Profile = lazy(() => import('./pages/Profile'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-stone-400">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Navbar />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#1c1917',
                color: '#fafaf9',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#f59e0b', secondary: '#1c1917' },
              },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/posts/:id" element={<PostDetail />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/create" element={<CreatePost />} />
                <Route path="/edit/:id" element={<EditPost />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

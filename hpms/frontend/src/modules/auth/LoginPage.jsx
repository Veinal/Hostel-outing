import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleRedirect = (role) => {
    switch (role) {
      case 'STUDENT': return navigate('/student/dashboard');
      case 'WARDEN':
      case 'CHIEF_WARDEN': return navigate('/warden/dashboard');
      case 'ADMIN': return navigate('/admin/dashboard');
      case 'SECURITY': return navigate('/gate/dashboard');
      default: return navigate('/');
    }
  };

  React.useEffect(() => {
    if (isAuthenticated && user) {
      handleRedirect(user.role);
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      handleRedirect(res.data.user.role);
    } catch (err) {
      if (err.response?.data?.error) {
        const code = err.response.data.error.code;
        if (code === 'AUTH_INVALID_CREDENTIALS') {
          setError('Invalid email or password.');
        } else {
          setError(err.response.data.error.message || 'Login failed.');
        }
      } else {
        setError('Connection error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setSnackbar({ open: true, message: 'Contact hostel admin to reset your password.', severity: 'info' });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_1922,h_689/https://mite.ac.in/wp-content/uploads/2020/07/slider-1-mite.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay on top of background photo */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(30,58,95,0.75) 50%, rgba(15,23,42,0.85) 100%)' }}
      />

      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl" />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md px-4">

        {/* College Logo + Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl p-2">
            <img
              src="https://mite.ac.in/wp-content/uploads/2025/03/mite-logo.svg"
              alt="MITE Logo"
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:2rem">🏫</span>'; }}
            />
          </div>
          <h1 className="font-bold text-4xl" style={{ color: 'white' }}>
            MITE <span style={{ color: '#60a5fa' }}>HOSTEL</span>
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
            Permission Management System
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border shadow-2xl"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(100, 116, 139, 0.4)',
          }}
        >
          <h2 className="font-bold text-2xl mb-6" style={{ color: 'white' }}>
            Sign In
          </h2>

          {/* Error alert */}
          {error && (
            <div
              className="rounded-lg px-4 py-3 mb-4 text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="mb-4">
              <label
                className="block text-xs uppercase font-semibold mb-2 tracking-wide"
                style={{ color: '#94a3b8' }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hpms.college"
                required
                className="w-full rounded-xl px-4 py-3 focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'rgba(51, 65, 85, 0.6)',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  color: 'white',
                }}
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 1px #3b82f6'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(100,116,139,0.5)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password field */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label
                  className="text-xs uppercase font-semibold tracking-wide"
                  style={{ color: '#94a3b8' }}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold hover:underline"
                  style={{ color: '#60a5fa' }}
                  onClick={handleForgotPassword}
                >
                  FORGOT?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl px-4 py-3 focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'rgba(51, 65, 85, 0.6)',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  color: 'white',
                }}
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 1px #3b82f6'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(100,116,139,0.5)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: '#1e293b' }}
              onMouseEnter={e => !loading && (e.target.style.backgroundColor = '#f1f5f9')}
              onMouseLeave={e => (e.target.style.backgroundColor = 'white')}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: '#475569' }}>
          © 2026 MITE HOSTEL MANAGEMENT
        </p>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl"
          style={{ backgroundColor: '#1e293b', color: 'white' }}
        >
          <div className="flex items-center gap-4">
            <span className="font-bold text-sm">{snackbar.message}</span>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="p-1 rounded-lg opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-md w-full px-6 relative z-10">
        
        <div className="text-center mb-10">
          <img
            src="https://mite.ac.in/wp-content/uploads/2025/03/mite-logo.svg"
            className="w-16 mx-auto mb-6 drop-shadow-xl"
            alt="MITE Logo"
          />
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
            MITE <span className="text-blue-600">Hostel</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Permission Management System</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 dark:shadow-none p-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-bold mb-8 text-slate-800 dark:text-white">Sign In</h2>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="themed-input w-full rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                placeholder="name@hpms.college"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] uppercase font-black text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="themed-input w-full rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold p-4 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 dark:shadow-none hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin"></span>
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 dark:text-slate-600 text-[10px] uppercase font-black tracking-widest mt-12">
          © 2026 MITE Hostel Management
        </p>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-4">
            <span className="font-bold text-sm">{snackbar.message}</span>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="p-1 hover:bg-white/10 dark:hover:bg-slate-100 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

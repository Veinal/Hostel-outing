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

  // If already authenticated, redirect
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
      if (err.response && err.response.data && err.response.data.error) {
        const code = err.response.data.error.code;
        if (code === 'AUTH_INVALID_CREDENTIALS') {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(err.response.data.error.message || 'Login failed. Please check your credentials and try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // TODO: API endpoint needed — POST /api/auth/forgot-password
  const handleForgotPassword = () => {
    if (!email) {
      setSnackbar({ open: true, message: 'Please enter your email address above.', severity: 'error' });
      return;
    }
    setSnackbar({ open: true, message: 'Password reset is handled by admin. Please contact your hostel admin.', severity: 'info' });
  };

  return (
    <div>
      <div
        className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
        style={{
          backgroundImage:
            "url('https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_1922,h_689/https://mite.ac.in/wp-content/uploads/2020/07/slider-1-mite.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-extrabold text-white uppercase">
            Welcome Back
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {loading ? (
              <div className="flex justify-center items-center">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                  />
                </div>

                {/* Forgot Password */}
                <div className="flex justify-start">
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:underline focus:outline-none"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign in
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${
            snackbar.severity === 'error' ? 'bg-red-600' :
            snackbar.severity === 'success' ? 'bg-green-600' : 'bg-blue-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>{snackbar.message}</span>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="ml-2 text-white font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

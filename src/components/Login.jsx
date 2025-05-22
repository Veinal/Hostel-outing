import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, OAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

// Map Firebase Auth errors to user-friendly messages
function getFriendlyErrorMessage(error) {
  if (!error || !error.code) return "An unexpected error occurred. Please try again.";
  switch (error.code) {
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please try again.";
    default:
      return "Login failed. Please check your credentials and try again.";
  }
}

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  // Google Login
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Fetch the user's role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;
        if (userRole === 'admin') navigate('/admindashboard');
        else if (userRole === 'student') navigate('/studentdashboard');
        else if (userRole === 'warden') navigate('/wardendashboard');
        else navigate('/');
      } else {
        setError('User role not found.');
      }
    } catch (err) {
      setError('Google login failed.');
    }
    setLoading(false);
  };

  // Yahoo Login
  const handleYahooLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new OAuthProvider('yahoo.com');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Fetch the user's role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;
        if (userRole === 'admin') navigate('/admindashboard');
        else if (userRole === 'student') navigate('/studentdashboard');
        else if (userRole === 'warden') navigate('/wardendashboard');
        else navigate('/');
      } else {
        setError('User role not found.');
      }
    } catch (err) {
      setError('Yahoo login failed.');
    }
    setLoading(false);
  };

  // Microsoft Login (as another example)
  const handleMicrosoftLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new OAuthProvider('microsoft.com');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Fetch the user's role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;
        if (userRole === 'admin') navigate('/admindashboard');
        else if (userRole === 'student') navigate('/studentdashboard');
        else if (userRole === 'warden') navigate('/wardendashboard');
        else navigate('/');
      } else {
        setError('User role not found.');
      }
    } catch (err) {
      setError('Microsoft login failed.');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    setLoading(true); // Set loading to true

    try {
      // Sign in the user with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch the user's role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        if (userRole === 'admin') {
          navigate('/admindashboard'); 
        } else if (userRole === 'student') {
          navigate('/studentdashboard');
        } else if (userRole === 'warden') {
          navigate('/wardendashboard');
        } else {
          navigate('/'); 
        }
      } else {
        setError('User role not found.');
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err)); // Use friendly error messages
    } finally {
      setLoading(false); // Set loading to false after login process
    }
  };

  const handleForgotPassword = async () => {
    setResetError('');
    setResetSent(false);
    if (!email) {
      setSnackbar({ open: true, message: 'Please enter your email address above.', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSnackbar({ open: true, message: 'Password reset email sent!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to send reset email. Please check your email address.', severity: 'error' });
    }
    setLoading(false);
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
              <form className="space-y-6" onSubmit={handleLogin}>
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

                {/* Social Login Buttons in one line */}
                <div className="flex justify-center items-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center border border-gray-300 rounded-full bg-white hover:bg-gray-100 p-2"
                    disabled={loading}
                    title="Sign in with Google"
                  >
                    {/* Google SVG */}
                    <svg className="w-6 h-6" viewBox="0 0 48 48">
                      <g>
                        <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.18 3.23l6.85-6.85C36.68 2.36 30.7 0 24 0 14.82 0 6.73 5.08 2.69 12.44l7.98 6.2C12.34 13.02 17.74 9.5 24 9.5z"/>
                        <path fill="#34A853" d="M46.14 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.44c-.54 2.92-2.18 5.39-4.66 7.06l7.2 5.6C43.97 37.36 46.14 31.46 46.14 24.55z"/>
                        <path fill="#FBBC05" d="M10.67 28.64c-1.08-3.22-1.08-6.68 0-9.9l-7.98-6.2C.86 16.34 0 20.06 0 24s.86 7.66 2.69 11.46l7.98-6.2z"/>
                        <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.14 15.9-5.82l-7.2-5.6c-2.01 1.35-4.6 2.16-8.7 2.16-6.26 0-11.66-3.52-14.33-8.7l-7.98 6.2C6.73 42.92 14.82 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                      </g>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleYahooLogin}
                    className="flex items-center justify-center border border-gray-300 rounded-full bg-white hover:bg-gray-100 p-2"
                    disabled={loading}
                    title="Sign in with Yahoo"
                  >
                    {/* Yahoo SVG */}
                    <svg className="w-6 h-6" viewBox="0 0 48 48">
                      <g>
                        <circle cx="24" cy="24" r="24" fill="#6001D2"/>
                        <text x="24" y="32" textAnchor="middle" fontSize="20" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold">Y!</text>
                      </g>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    className="flex items-center justify-center border border-gray-300 rounded-full bg-white hover:bg-gray-100 p-2"
                    disabled={loading}
                    title="Sign in with Microsoft"
                  >
                    {/* Microsoft SVG */}
                    <svg className="w-6 h-6" viewBox="0 0 48 48">
                      <g>
                        <rect x="4" y="4" width="18" height="18" fill="#F35325"/>
                        <rect x="26" y="4" width="18" height="18" fill="#81BC06"/>
                        <rect x="4" y="26" width="18" height="18" fill="#05A6F0"/>
                        <rect x="26" y="26" width="18" height="18" fill="#FFBA08"/>
                      </g>
                    </svg>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

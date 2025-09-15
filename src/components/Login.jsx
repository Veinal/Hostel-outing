import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, OAuthProvider, sendPasswordResetEmail, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
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
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  
  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch the user's role from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userRole = userData.role;
            
            // Redirect based on role
            if (userRole === 'admin') {
              navigate('/admindashboard');
            } else if (userRole === 'student') {
              navigate('/studentdashboard');
            } else if (userRole === 'warden') {
              navigate('/wardendashboard');
            } else {
              // If role is not recognized, redirect to home
              navigate('/');
            }
            return;
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, [navigate]);

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
      // Try normal sign-in first
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData.role;
          if (userRole === 'admin') navigate('/admindashboard');
          else if (userRole === 'student') navigate('/studentdashboard');
          else if (userRole === 'warden') navigate('/wardendashboard');
          else navigate('/');
          return;
        }
        // If signed in but no role
        setError('User role not found.');
        return;
      } catch (signInErr) {
        // If sign-in failed, check if this email is in pendingStudents
        const pendingQ = query(collection(db, 'pendingStudents'), where('email', '==', email));
        const pendingSnap = await getDocs(pendingQ);
        if (!pendingSnap.empty) {
          const pendingDoc = pendingSnap.docs[0];
          const pendingData = pendingDoc.data();
          // Attempt to create auth user using provided password
          try {
            const created = await createUserWithEmailAndPassword(auth, email, password);
            const createdUser = created.user;
            const studentData = { ...pendingData, uid: createdUser.uid, activatedAt: new Date(), isFirstLogin: true };
            delete studentData.tempCredentials;
            delete studentData.status; // remove pending flag
            await setDoc(doc(db, 'users', createdUser.uid), studentData);
            await deleteDoc(doc(db, 'pendingStudents', pendingDoc.id));
            navigate('/studentdashboard');
            return;
          } catch (createErr) {
            // If email already exists or wrong password, show friendly message
            setError(getFriendlyErrorMessage(createErr));
            return;
          }
        }
        // Not pending; show friendly sign-in error
        setError(getFriendlyErrorMessage(signInErr));
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

  // Show loading state while checking authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{backgroundImage : "url('https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_1922,h_689/https://mite.ac.in/wp-content/uploads/2020/07/slider-1-mite.jpg')",backgroundSize:"cover",backgroundPosition:"center"}}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        <p className="ml-4 text-white">Loading...</p>
      </div>
    );
  }

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

              </form>
            )}

            <div className="mt-6 text-center">
              {/* <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Sign up
                </Link>
              </p> */}
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

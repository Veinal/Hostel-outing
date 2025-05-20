import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Add this import
import { auth, db } from '../firebase';
import { onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

export const EditWardenProfile = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate(); // <-- Add this

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setEmail(user.email);
        // Fetch warden's name from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setFullName(userDoc.data().fullName || '');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Update name in Firebase Auth profile
        await updateProfile(user, { displayName: fullName });
        // Update name in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { fullName });
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        setTimeout(() => {
          navigate('/wardendashboard');
        }, 1200); // Give user time to see the snackbar
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update profile.', severity: 'error' });
    }
    setSubmitting(false);
  };

  const handleChangePassword = async () => {
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSnackbar({ open: true, message: 'Password reset email sent!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to send reset email.', severity: 'error' });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">
        <div className="px-8 py-6">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-1">Warden Profile</h2>
          <p className="text-gray-500 mb-6">Update your information</p>

          {(loading || submitting) && (
            <div className="flex justify-center items-center my-8">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            </div>
          )}

          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
                disabled={loading || submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-2 rounded-xl shadow-md transition duration-200"
                disabled={loading || submitting}
                onClick={() => navigate('/wardendashboard')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl shadow-md transition duration-200 flex items-center"
                disabled={loading || submitting}
              >
                {submitting ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                ) : null}
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Password Section */}
          <section className="bg-blue-50 rounded-lg shadow-sm p-6 mt-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Password</h3>
              <p className="text-gray-600 text-sm">Send yourself a password reset email</p>
            </div>
            <button
              onClick={handleChangePassword}
              className="mt-4 md:mt-0 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-5 py-2 rounded-lg transition"
              disabled={loading || submitting}
            >
              Change Password
            </button>
          </section>
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

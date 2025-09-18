import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FiLogOut, FiUser } from 'react-icons/fi';

export const NavBar = () => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  // Helper to get first name from full name
  const getFirstName = (name) => {
    if (!name) return '';
    return name.split(' ')[0];
  };

  // Listen for authentication state changes
  useEffect(() => {
    const fetchUserData = async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFullName(data.fullName);
          setRole(data.role || '');
        }
      } else {
        setUser(null);
        setFullName('');
        setRole('');
      }
    };

    const unsubscribe = onAuthStateChanged(auth, fetchUserData);

    // Listen for profile updates
    const handleProfileUpdate = () => {
      if (auth.currentUser) {
        fetchUserData(auth.currentUser);
      }
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutModal(false);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Responsive: remove right margin on small screens, only add on md+
  // Also, only show first name
  const getDisplayName = () => {
    if (fullName) {
      return getFirstName(fullName);
    }
    if (user && user.email) {
      return user.email.split('@')[0];
    }
    return '';
  };

  return (
    <div>
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
        <div className="navbar-start">
          {/* Logo */}
          <img
            src="https://mite.ac.in/wp-content/uploads/2025/03/mite-logo.svg"
            className="w-7 ml-5"
            alt="MITE Logo"
          />
          <span className="font-semibold ml-3 text-xl hidden md:inline">MITE Hostel</span>
        </div>
        
        <div className="navbar-end flex items-center">
          {user ? (
            <>
              <span
                className="
                  text-gray-700 font-medium
                  mr-0 md:mr-4
                  truncate
                  max-w-[90px] xs:max-w-[120px] sm:max-w-[160px] md:max-w-none
                  text-base xs:text-base sm:text-base md:text-base
                  "
                style={{ minWidth: 0 }}
                title={getDisplayName()}
              >
                Hi, {getDisplayName()}
              </span>
              {/* Show Edit Profile icon only for students and wardens */}
              {user && role !== 'admin' && (
                <Link
                  to={role === 'warden' ? '/editwardenprofile' : '/editstudentprofile'}
                  className="mr-2"
                  title="Edit Profile"
                >
                  <FiUser className="text-blue-700 hover:text-blue-900 md:w-7 md:h-7 w-5 h-5 ml-1" />
                  <span className="sr-only">Edit Profile</span>
                </Link>
              )}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="text-gray-700 hover:text-red-600 transition-all duration-300"
                title="Logout"
              >
                <FiLogOut
                  className="text-blue-700 md:w-7 md:h-7 w-5 h-5"
                />
                <span className="sr-only">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login">
              <button className="btn bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 rounded-md px-4 py-2 shadow">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>

      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-lg p-8 shadow-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn bg-gray-300 text-gray-700 hover:bg-gray-400 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="btn bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

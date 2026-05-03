import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth/useAuth';

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide navbar on login page
  if (location.pathname === '/login') return null;

  const getFirstName = (name) => {
    if (!name) return '';
    return name.split(' ')[0];
  };

  const getDisplayName = () => {
    if (user?.fullName) return getFirstName(user.fullName);
    if (user?.email) return user.email.split('@')[0];
    return '';
  };

  const getProfileLink = () => {
    if (user?.role === 'STUDENT') return '/student/profile';
    if (user?.role === 'WARDEN' || user?.role === 'CHIEF_WARDEN') return '/warden/profile';
    return null;
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const profileLink = getProfileLink();

  return (
    <div>
      <div className="navbar bg-slate-800 px-6 py-3 flex items-center justify-between shadow-md sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-3">
          <img
            src="https://mite.ac.in/wp-content/uploads/2025/03/mite-logo.svg"
            className="w-7 ml-5"
            alt="MITE Logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="text-white font-bold text-xl hidden md:inline">MITE Hostel</span>
        </div>

        <div className="flex items-center">
          {isAuthenticated ? (
            <>
              <span
                className="text-slate-300 font-medium mr-0 md:mr-4 truncate max-w-[90px] sm:max-w-[160px] md:max-w-none text-sm"
                style={{ minWidth: 0 }}
                title={getDisplayName()}
              >
                Hi, {getDisplayName()}
              </span>

              {profileLink && (
                <Link to={profileLink} className="mr-2 text-slate-400 hover:text-white transition-colors" title="Edit Profile">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-7 md:h-7 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="sr-only">Edit Profile</span>
                </Link>
              )}

              <button
                onClick={() => setShowLogoutModal(true)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-lg p-8 shadow-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Confirm Logout</h2>
            <p className="mb-6 text-slate-600">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

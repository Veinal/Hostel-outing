import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth/useAuth';
import { useTheme } from './ThemeContext';

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
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
      <div className="navbar bg-slate-800 dark:bg-slate-900 px-6 py-3 flex items-center justify-between shadow-md sticky top-0 z-50 print:hidden transition-colors duration-300">
        <div className="flex items-center gap-3">
          <img
            src="https://mite.ac.in/wp-content/uploads/2025/03/mite-logo.svg"
            className="w-7 ml-5"
            alt="MITE Logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="text-white font-bold text-xl hidden md:inline">MITE Hostel</span>
        </div>

        <div className="flex items-center gap-4">
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-all"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3">
                <span
                  className="text-slate-300 font-medium truncate max-w-[90px] sm:max-w-[160px] md:max-w-none text-sm"
                  style={{ minWidth: 0 }}
                  title={getDisplayName()}
                >
                  Hi, {getDisplayName()}
                </span>

                {profileLink && (
                  <Link to={profileLink} className="text-slate-400 hover:text-white transition-colors" title="Edit Profile">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                )}

                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <Link to="/login">
              <button className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 border-none rounded-md px-4 shadow">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>

      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[60]"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl w-full max-w-md mx-4 animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Confirm Logout</h2>
            <p className="mb-8 text-slate-600 dark:text-slate-400">Are you sure you want to log out of the system?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-6 py-2 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
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

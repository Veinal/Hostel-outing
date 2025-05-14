import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase'; // Import Firebase auth and Firestore
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore methods
import { FiLogOut } from 'react-icons/fi'; // Import logout icon

export const NavBar = () => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State for modal visibility
  const navigate = useNavigate();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set the logged-in user

        // Fetch the user's full name from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const fetchedFullName = userDoc.data().fullName || 'Unknown User';
          setFullName(fetchedFullName); // Set the full name from Firestore
          localStorage.setItem('fullName', fetchedFullName); // Store full name in localStorage
        }
      } else {
        setUser(null); // No user is logged in
        setFullName(''); // Clear the full name
        localStorage.removeItem('fullName'); // Remove full name from localStorage
      }
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user
      localStorage.removeItem('fullName'); // Remove full name from localStorage
      setShowLogoutModal(false);
      navigate('/'); // Redirect to the login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
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
          {/* Text hidden on smaller screens */}
          <span className="font-semibold ml-3 text-xl hidden md:inline">MITE Hostel</span>
        </div>
        <div className="navbar-end flex items-center">
          {user ? (
            <>
              {/* Greeting - Visible on all screen sizes */}
              <span className="text-gray-700 font-medium mr-4">
                Hi, {fullName || user.email.split('@')[0]}
              </span>
              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutModal(true)} // Show the modal
                className="text-gray-700 hover:text-red-600 transition-all duration-300"
                title="Logout"
              >
                <FiLogOut className="text-blue-700" size={30} />
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={() => setShowLogoutModal(false)} // Close modal when clicking outside
        >
          <div
            className="bg-white rounded-lg p-8 shadow-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)} // Close the modal
                className="btn bg-gray-300 text-gray-700 hover:bg-gray-400 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout} // Perform logout
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

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase'; // Import Firebase auth and Firestore
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore methods
import { FiLogOut } from 'react-icons/fi'; // Import logout icon

export const NavBar = () => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
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
          setFullName(userDoc.data().fullName); // Set the full name from Firestore
        }
      } else {
        setUser(null); // No user is logged in
        setFullName(''); // Clear the full name
      }
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user
      navigate('/'); // Redirect to the login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div>
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
        <div className="navbar-start">
          <img
            src="https://mite.ac.in/wp-content/uploads/2025/03/mite-logo.svg"
            className="w-7 ml-5"
            alt="MITE Logo"
          />
          <span className="font-semibold ml-3 text-xl">MITE Hostel</span>
        </div>
        <div className="navbar-end flex items-center">
          {user ? (
            <>
              <span className="text-gray-700 font-medium mr-4">
                Hi, {fullName || user.email.split('@')[0]}
              </span>
              <button
                onClick={handleLogout}
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
    </div>
  );
};

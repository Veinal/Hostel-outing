import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'; // Added 'getDoc'
import { db } from '../firebase';
import { SideBar } from './SideBar';
import { FaUsers, FaUserTie, FaClipboardList } from 'react-icons/fa'; // Importing icons

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true); // State to track loading
  const [studentCount, setStudentCount] = useState(0); // State for student count
  const [wardenCount, setWardenCount] = useState(0); // State for warden count
  const [pendingRequestCount, setPendingRequestCount] = useState(0); // State for pending requests count

  useEffect(() => {
    const checkAdminRole = async () => {
      const auth = getAuth();

      // Listen for authentication state changes
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          // If no user is logged in, redirect to home page
          navigate('/');
          return;
        }

        // Fetch the user's role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid)); // Use getDoc for a single document
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData.role;

          if (userRole !== 'admin') {
            // If the user is not an admin, redirect to home page
            navigate('/');
          } else {
            // User is an admin, allow access
            setIsLoading(false);
          }
        } else {
          // If the user's role is not found, redirect to home page
          navigate('/');
        }
      });
    };

    const fetchCounts = async () => {
      try {
        // Fetch student count
        const studentQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const studentSnapshot = await getDocs(studentQuery);
        setStudentCount(studentSnapshot.size);

        // Fetch warden count
        const wardenQuery = query(collection(db, 'users'), where('role', '==', 'warden'));
        const wardenSnapshot = await getDocs(wardenQuery);
        setWardenCount(wardenSnapshot.size);

        // Fetch all requests count
        const requestSnapshot = await getDocs(collection(db, 'outingRequests')); // Fetch all requests
        setPendingRequestCount(requestSnapshot.size); // Update state with total requests count
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    checkAdminRole();
    fetchCounts();
  }, [navigate]);

  if (isLoading) {
    // Show a loading spinner or message while checking the user's role
    return <div className="flex justify-center items-center min-h-screen"><span className="loading loading-bars loading-lg"></span></div>;
  }

  return (
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white rounded-lg shadow flex items-center">
            <FaUsers className="text-blue-500 text-3xl sm:text-4xl md:text-5xl mr-4" />
            <div className="break-words">
              <h2 className="text-xl font-semibold">Total Students</h2>
              <p className="text-gray-600">{studentCount}</p>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow flex items-center">
            <FaUserTie className="text-teal-500 text-3xl sm:text-4xl md:text-5xl mr-4" />
            <div className="break-words">
              <h2 className="text-xl font-semibold">Total Wardens</h2>
              <p className="text-gray-600">{wardenCount}</p>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow flex items-center">
            <FaClipboardList className="text-purple-500 text-3xl sm:text-4xl md:text-5xl mr-4" />
            <div className="break-words">
              <h2 className="text-xl font-semibold">Total Requests</h2>
              <p className="text-gray-600">{pendingRequestCount}</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/managestudents">
            <div className="p-6 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition flex items-center">
              <FaUsers className="text-white text-3xl sm:text-4xl md:text-5xl mr-4" />
              <div>
                <h2 className="text-xl font-semibold break-words">Manage Students</h2>
                <p className="text-sm break-words">View, add, edit, or remove student profiles.</p>
              </div>
            </div>
          </Link>
          <Link to="/managewardens">
            <div className="p-6 bg-teal-500 text-white rounded-lg shadow hover:bg-teal-600 transition flex items-center">
              <FaUserTie className="text-white text-3xl sm:text-4xl md:text-5xl mr-4" />
              <div>
                <h2 className="text-xl font-semibold break-words">Manage Wardens</h2>
                <p className="text-sm break-words">View, add, edit, or remove warden profiles.</p>
              </div>
            </div>
          </Link>
          <Link to="/managerequests">
            <div className="p-6 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 transition flex items-center">
              <FaClipboardList className="text-white text-3xl sm:text-4xl md:text-5xl mr-4" />
              <div>
                <h2 className="text-xl font-semibold break-words">Manage Requests</h2>
                <p className="text-sm break-words">Review and manage outing requests.</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};
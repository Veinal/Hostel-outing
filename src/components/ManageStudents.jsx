import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { SideBar } from './SideBar';

export const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteStudentId, setDeleteStudentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true); // State to track loading
  const rowsPerPage = 10;
  const navigate = useNavigate();

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
        const userDoc = await getDoc(doc(db, 'users', user.uid));
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

    checkAdminRole();
  }, [navigate]);

  useEffect(() => {
    const fetchStudents = async () => {
      const studentsCollection = collection(db, 'users');
      const studentDocs = await getDocs(studentsCollection);
      const studentList = studentDocs.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role === 'student');
      setStudents(studentList);
    };

    fetchStudents();
  }, []);

  const handleDelete = async () => {
    if (deleteStudentId) {
      await deleteDoc(doc(db, 'users', deleteStudentId));
      setStudents(students.filter((student) => student.id !== deleteStudentId));
      setDeleteStudentId(null);
    }
  };

  const handleView = (student) => {
    setSelectedStudent(student);
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = students.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(students.length / rowsPerPage);

  if (isLoading) {
    // Show a loading spinner or message while checking the user's role
    return <div className="flex justify-center items-center min-h-screen"><span className="loading loading-bars loading-lg"></span></div>;
  }

  return (
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-4 md:p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Students</h1>
        <div className="overflow-x-auto">
          <table className="table w-full border border-gray-200 rounded-lg shadow">
            <thead>
              <tr>
                <th className="bg-gray-100 text-gray-600">Photo</th>
                <th className="bg-gray-100 text-gray-600">Full Name</th>
                <th className="bg-gray-100 text-gray-600">Email</th>
                <th className="bg-gray-100 text-gray-600">Branch</th>
                <th className="bg-gray-100 text-gray-600">Year</th>
                <th className="bg-gray-100 text-gray-600">Block</th>
                <th className="bg-gray-100 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((student) => (
                <tr key={student.id}>
                  <td className="text-center">
                    <img
                      src={student.photo || 'https://via.placeholder.com/50'}
                      alt="student"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </td>
                  <td className="text-gray-800">{student.fullName}</td>
                  <td className="text-gray-800">{student.email}</td>
                  <td className="text-gray-800">{student.branch || 'N/A'}</td>
                  <td className="text-gray-800">{student.year || 'N/A'}</td>
                  <td className="text-gray-800">{student.block || 'N/A'}</td>
                  <td>
                    <button
                      onClick={() => handleView(student)}
                      className="btn btn-sm btn-primary mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setDeleteStudentId(student.id)}
                      className="btn btn-sm btn-error"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="join mt-4 flex justify-center">
          {Array.from({ length: totalPages }, (_, index) => (
            <input
              key={index + 1}
              type="radio"
              name="pagination"
              aria-label={`${index + 1}`}
              className={`join-item btn btn-square ${
                currentPage === index + 1 ? 'btn-primary' : ''
              }`}
              onClick={() => setCurrentPage(index + 1)}
            />
          ))}
        </div>

        {/* View Student Modal */}
        {selectedStudent && (
          <div
            className="modal modal-open flex items-center justify-center"
            onClick={() => setSelectedStudent(null)} // Close modal on outside click
          >
            <div
              className="modal-box relative bg-white rounded-lg shadow-lg p-6"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              <button
                className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
                onClick={() => setSelectedStudent(null)}
              >
                ✕
              </button>
              <h3 className="font-bold text-lg text-center mb-4">Student Details</h3>
              <div className="flex flex-col items-center">
                <img
                  src={selectedStudent.photo || 'https://via.placeholder.com/100'}
                  alt="Student"
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
                <p className="text-gray-800">
                  <strong>Full Name:</strong> {selectedStudent.fullName}
                </p>
                <p className="text-gray-800">
                  <strong>Email:</strong> {selectedStudent.email}
                </p>
                <p className="text-gray-800">
                  <strong>Branch:</strong> {selectedStudent.branch || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Year:</strong> {selectedStudent.year || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Block:</strong> {selectedStudent.block || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteStudentId && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-red-600">Confirm Deletion</h3>
              <p>Are you sure you want to delete this student?</p>
              <div className="modal-action">
                <button
                  onClick={handleDelete}
                  className="btn btn-sm btn-error"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteStudentId(null)}
                  className="btn btn-sm btn-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
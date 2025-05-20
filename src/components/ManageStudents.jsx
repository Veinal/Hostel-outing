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
                      src={student.photoUrl || 'https://via.placeholder.com/50'}
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
            className="fixed inset-0 bg-opacity-50 backdrop-blur-md flex justify-center items-center z-50"
            onClick={() => setSelectedStudent(null)} // Close modal on outside click
          >
            <div
              className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 relative"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              {/* Close button inside the modal, top-right */}
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl font-bold focus:outline-none"
                onClick={() => setSelectedStudent(null)}
                aria-label="Close"
                type="button"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-6 text-center uppercase tracking-wide text-blue-700">Student Details</h2>
              <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
                {/* Student Image */}
                <div className="flex-shrink-0 mb-4 md:mb-0 flex flex-col items-center">
                  <img
                    src={selectedStudent.photoUrl || 'https://via.placeholder.com/150'}
                    alt="Student"
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow"
                  />
                  <div className="mt-2 text-sm text-gray-500 text-center break-all max-w-[8rem]">
                    {selectedStudent.fullName || 'N/A'}
                  </div>
                </div>
                {/* Student Details */}
                <div className="w-full">
                  <div className="grid grid-cols-1 gap-y-3">
                    <DetailRow label="Email" value={selectedStudent.email} />
                    <DetailRow label="Phone" value={selectedStudent.phone} />
                    <DetailRow label="Branch" value={selectedStudent.branch} isLong />
                    <DetailRow label="Year" value={selectedStudent.year} />
                    <DetailRow label="Block" value={selectedStudent.block} />
                    <DetailRow label="Room" value={selectedStudent.room} />
                  </div>
                </div>
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

// Add this helper component at the bottom of the file or in the same file
const DetailRow = ({ label, value, isLong, inline }) => (
  <div className={inline ? "flex-1 min-w-0" : ""}>
    <span className="font-semibold text-gray-700">{label}:</span>
    <span
      className={`ml-2 text-gray-800 ${isLong ? "break-words max-w-xs inline-block align-top" : ""}`}
      style={isLong ? { wordBreak: 'break-all' } : {}}
    >
      {value || 'N/A'}
    </span>
  </div>
);
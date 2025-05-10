import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null); // For viewing student details
  const [deleteStudentId, setDeleteStudentId] = useState(null); // For confirming deletion

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
      setDeleteStudentId(null); // Close the delete modal
    }
  };

  const handleView = (student) => {
    setSelectedStudent(student); // Open the view modal with student details
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
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
            {students.map((student) => (
              <tr key={student.id}>
                <td className="text-center">
                  <img
                    src={student.photoURL || 'https://via.placeholder.com/50'}
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

      {/* View Student Modal */}
      {selectedStudent && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Student Details</h3>
            <div className="card bg-gray-100 shadow-md p-4 mt-4">
              <img
                src={selectedStudent.photoURL || 'https://via.placeholder.com/100'}
                alt="Student"
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
              />
              <p><strong>Full Name:</strong> {selectedStudent.fullName}</p>
              <p><strong>Email:</strong> {selectedStudent.email}</p>
              <p><strong>Branch:</strong> {selectedStudent.branch || 'N/A'}</p>
              <p><strong>Year:</strong> {selectedStudent.year || 'N/A'}</p>
              <p><strong>Block:</strong> {selectedStudent.block || 'N/A'}</p>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn btn-sm btn-primary"
              >
                Close
              </button>
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
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { SideBar } from './SideBar';
import { FaSortAmountDown, FaSortAmountUp, FaSearch } from 'react-icons/fa';

export const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteStudentId, setDeleteStudentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [branchOptions, setBranchOptions] = useState([]); // <-- For branch filter dropdown
  const rowsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminRole = async () => {
      const auth = getAuth();
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          navigate('/');
          return;
        }
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData.role;
          if (userRole !== 'admin') {
            navigate('/');
          } else {
            setIsLoading(false);
          }
        } else {
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

  // Fetch branch options from Firestore branches collection
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'branches'));
        let allBranchesArr = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.allBranches)) {
            allBranchesArr = data.allBranches; // Use the first/all allBranches arrays found
          }
        });
        setBranchOptions(allBranchesArr);
      } catch (err) {
        setBranchOptions([]);
      }
    };
    fetchBranches();
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

  // Get unique years and blocks for filter dropdowns
  const uniqueYears = [...new Set(students.map(s => s.year).filter(Boolean))];
  const uniqueBlocks = [...new Set(students.map(s => s.block).filter(Boolean))];

  // Sorting logic
  const sortedStudents = [...students].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = (a[sortField] || '').toString().toLowerCase();
    const bValue = (b[sortField] || '').toString().toLowerCase();
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Filtered students based on search and filters
  const filteredStudents = sortedStudents.filter(student => {
    const matchesSearch =
      student.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      student.email?.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = filterBranch ? student.branch === filterBranch : true;
    const matchesYear = filterYear ? student.year === filterYear : true;
    const matchesBlock = filterBlock ? student.block === filterBlock : true;
    return matchesSearch && matchesBranch && matchesYear && matchesBlock;
  });

  // Pagination logic (use filteredStudents instead of students)
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredStudents.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><span className="loading loading-bars loading-lg"></span></div>;
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-4 md:p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Students</h1>

        {/* Search above the table */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input input-bordered w-full max-w-xs"
              onKeyDown={e => {
                if (e.key === 'Enter') setCurrentPage(1);
              }}
            />
            <button
              className="btn btn-primary"
              onClick={() => setCurrentPage(1)}
              title="Search"
            >
              <FaSearch />
            </button>
          </div>
        </div>

        {/* Table with sortable headers */}
        <div className="overflow-x-auto">
          <table className="table w-full border border-gray-200 rounded-lg shadow">
            <thead>
              <tr>
                <th className="bg-gray-100 text-gray-600">Photo</th>
                <th className="bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    Full Name
                    <button
                      onClick={() => handleSort('fullName')}
                      className="ml-1"
                      title="Sort"
                    >
                      {sortField === 'fullName' && sortOrder === 'asc' ? (
                        <FaSortAmountDown className="text-gray-800" />
                      ) : sortField === 'fullName' && sortOrder === 'desc' ? (
                        <FaSortAmountUp className="text-gray-800" />
                      ) : (
                        <FaSortAmountDown className="opacity-30 text-gray-800" />
                      )}
                    </button>
                  </div>
                </th>
                <th className="bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    Email
                    <button
                      onClick={() => handleSort('email')}
                      className="ml-1"
                      title="Sort"
                    >
                      {sortField === 'email' && sortOrder === 'asc' ? (
                        <FaSortAmountDown className="text-gray-800" />
                      ) : sortField === 'email' && sortOrder === 'desc' ? (
                        <FaSortAmountUp className="text-gray-800" />
                      ) : (
                        <FaSortAmountDown className="opacity-30 text-gray-800" />
                      )}
                    </button>
                  </div>
                </th>
                <th className="bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    Branch
                    <button
                      onClick={() => handleSort('branch')}
                      className="ml-1"
                      title="Sort"
                    >
                      {sortField === 'branch' && sortOrder === 'asc' ? (
                        <FaSortAmountDown className="text-gray-800" />
                      ) : sortField === 'branch' && sortOrder === 'desc' ? (
                        <FaSortAmountUp className="text-gray-800" />
                      ) : (
                        <FaSortAmountDown className="opacity-30 text-gray-800" />
                      )}
                    </button>
                  </div>
                </th>
                <th className="bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    Year
                    <button
                      onClick={() => handleSort('year')}
                      className="ml-1"
                      title="Sort"
                    >
                      {sortField === 'year' && sortOrder === 'asc' ? (
                        <FaSortAmountDown className="text-gray-800" />
                      ) : sortField === 'year' && sortOrder === 'desc' ? (
                        <FaSortAmountUp className="text-gray-800" />
                      ) : (
                        <FaSortAmountDown className="opacity-30 text-gray-800" />
                      )}
                    </button>
                  </div>
                </th>
                <th className="bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    Block
                    <button
                      onClick={() => handleSort('block')}
                      className="ml-1"
                      title="Sort"
                    >
                      {sortField === 'block' && sortOrder === 'asc' ? (
                        <FaSortAmountDown className="text-gray-800" />
                      ) : sortField === 'block' && sortOrder === 'desc' ? (
                        <FaSortAmountUp className="text-gray-800" />
                      ) : (
                        <FaSortAmountDown className="opacity-30 text-gray-800" />
                      )}
                    </button>
                  </div>
                </th>
                <th className="bg-gray-100 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 font-semibold">
                    No results found
                  </td>
                </tr>
              ) : (
                currentRows.map((student) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Filter dropdowns below the table */}
        <div className="flex flex-wrap gap-4 mt-4 items-center">
          <select
            value={filterBranch}
            onChange={e => {
              setFilterBranch(e.target.value);
              setCurrentPage(1);
            }}
            className="select select-bordered"
          >
            <option value="">All Branches</option>
            {branchOptions.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={e => {
              setFilterYear(e.target.value);
              setCurrentPage(1);
            }}
            className="select select-bordered"
          >
            <option value="">All Years</option>
            {uniqueYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={filterBlock}
            onChange={e => {
              setFilterBlock(e.target.value);
              setCurrentPage(1);
            }}
            className="select select-bordered"
          >
            <option value="">All Blocks</option>
            {uniqueBlocks.map(block => (
              <option key={block} value={block}>{block}</option>
            ))}
          </select>
          {(filterBranch || filterYear || filterBlock) && (
            <button
              className="btn btn-outline"
              onClick={() => {
                setFilterBranch('');
                setFilterYear('');
                setFilterBlock('');
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </button>
          )}
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
            onClick={() => setSelectedStudent(null)}
          >
            <div
              className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
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
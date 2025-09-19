import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { FaCheck, FaTimes, FaEye, FaSpinner } from 'react-icons/fa';

export const PendingStudents = ({ onClose, onStudentsActivated }) => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'pendingStudents'));
        setPending(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activate = async (student) => {
    setActivatingId(student.id);
    try {
      const data = { ...student };
      delete data.tempCredentials;
      delete data.status;
      await setDoc(doc(db, 'users', student.id), { ...data, activatedAt: new Date(), isFirstLogin: true });
      await deleteDoc(doc(db, 'pendingStudents', student.id));
      setPending(prev => prev.filter(s => s.id !== student.id));
      if (typeof onStudentsActivated === 'function') onStudentsActivated();
    } catch (e) {
      alert('Activation failed: ' + (e?.message || String(e)));
    } finally {
      setActivatingId(null);
    }
  };

  const remove = async (studentId) => {
    await deleteDoc(doc(db, 'pendingStudents', studentId));
    setPending(prev => prev.filter(s => s.id !== studentId));
  };

  const removeAll = async () => {
    const ids = pending.map(p => p.id);
    for (const id of ids) {
      try {
        await deleteDoc(doc(db, 'pendingStudents', id));
      } catch (e) {
        // best-effort delete; continue others
      }
    }
    setPending([]);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <FaSpinner className="animate-spin text-2xl text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Pending Students</h2>
            <div className="flex items-center gap-3">
              {pending.length > 0 && (
                <button
                  className="btn btn-active btn-error btn-sm mr-2"
                  onClick={() => setConfirmDeleteAll(true)}
                  title="Delete All Pending Students"
                >
                  Delete All
                </button>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
            </div>
          </div>

          {pending.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No pending students found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Gender</th>
                    <th>Branch</th>
                    <th>Year</th>
                    <th>Block</th>
                    <th>Room</th>
                    <th>Default Password</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <img src={s.photoUrl || 'https://via.placeholder.com/40'} alt="student" className="w-10 h-10 rounded-full object-cover" />
                      </td>
                      <td>{s.fullName}</td>
                      <td className="font-mono text-sm">{s.email}</td>
                      <td>{s.gender || 'N/A'}</td>
                      <td>{s.branch || 'N/A'}</td>
                      <td>{s.year || 'N/A'}</td>
                      <td>{s.block || 'N/A'}</td>
                      <td>{s.room || 'N/A'}</td>
                      <td className="font-mono text-sm">{s.defaultPassword}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => setSelected(s)} className="btn btn-sm btn-outline" title="View"><FaEye /></button>
                          {/* <button onClick={() => activate(s)} disabled={activatingId === s.id} className="btn btn-sm btn-success" title="Activate">
                            {activatingId === s.id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                          </button> */}
                          <button onClick={() => setDeleteId(s.id)} className="btn btn-sm btn-error" title="Delete"><FaTimes /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selected && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
              <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 relative" onClick={(e) => e.stopPropagation()}>
                <button className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl font-bold" onClick={() => setSelected(null)}>&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Student Details</h2>
                <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
                  <div className="flex-shrink-0 mb-4 md:mb-0 flex flex-col items-center">
                    <img src={selected.photoUrl || 'https://via.placeholder.com/150'} alt="Student" className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow" />
                    <div className="mt-2 text-sm text-gray-500 text-center">{selected.fullName}</div>
                  </div>
                  <div className="w-full">
                    <div className="grid grid-cols-1 gap-y-3">
                      <DetailRow label="Email" value={selected.email} />
                      <DetailRow label="Phone" value={selected.phone} />
                      <DetailRow label="Gender" value={selected.gender} />
                      <DetailRow label="Branch" value={selected.branch} />
                      <DetailRow label="Year" value={selected.year} />
                      <DetailRow label="Block" value={selected.block} />
                      <DetailRow label="Room" value={selected.room} />
                      <DetailRow label="Default Password" value={selected.defaultPassword} />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <button onClick={() => activate(selected)} disabled={activatingId === selected.id} className="btn btn-success btn-lg">
                    {activatingId === selected.id ? (<><FaSpinner className="animate-spin mr-2" />Activating...</>) : (<><FaCheck className="mr-2" />Activate Student</>)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Confirm Delete Single Modal */}
      {deleteId && (
        <div className="modal modal-open" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-red-600">Confirm Deletion</h3>
            <p>Are you sure you want to delete this pending student?</p>
            <div className="modal-action">
              <button
                className="btn btn-sm btn-error"
                onClick={async () => {
                  await remove(deleteId);
                  setDeleteId(null);
                }}
              >
                Delete
              </button>
              <button className="btn btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete All Modal */}
      {confirmDeleteAll && (
        <div className="modal modal-open" onClick={() => setConfirmDeleteAll(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-red-600">Delete All Pending Students</h3>
            <p>This will permanently delete all pending students. Continue?</p>
            <div className="modal-action">
              <button
                className="btn btn-sm btn-error"
                onClick={async () => {
                  await removeAll();
                  setConfirmDeleteAll(false);
                }}
              >
                Delete All
              </button>
              <button className="btn btn-sm" onClick={() => setConfirmDeleteAll(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div>
    <span className="font-semibold text-gray-700">{label}:</span>
    <span className="ml-2 text-gray-800">{value || 'N/A'}</span>
  </div>
);



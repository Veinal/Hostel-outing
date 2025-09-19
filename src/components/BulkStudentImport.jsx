import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { FaUpload, FaDownload, FaSpinner, FaCheckCircle } from 'react-icons/fa';

export const BulkStudentImport = ({ onClose, onStudentsAdded }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const normalizeEmail = (value) => (value || '').trim().toLowerCase();

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i] || !lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      if (row.email) data.push(row);
    }
    return data;
  };

  const generateDefaultPassword = (fullName) => {
    const firstName = (fullName || '').trim().split(' ')[0] || 'student';
    // Remove any special characters and convert to lowercase
    const cleanFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `${cleanFirstName}123`;
  };

  const createPendingStudent = async (studentData) => {
    try {
      const email = normalizeEmail(studentData.email || studentData.Email);
      if (!email) throw new Error('Missing email');
      const fullName = studentData.fullName || studentData['Full Name'] || studentData.name || studentData.Name || '';
      const defaultPassword = generateDefaultPassword(fullName);
      const studentId = `student_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const studentDoc = {
        uid: studentId,
        email,
        fullName: studentData.fullName || studentData['Full Name'] || studentData.name || studentData.Name || '',
        phone: studentData.phone || studentData.Phone || studentData.phoneNumber || '',
        usn: studentData.usn || studentData.USN || '',
        parentPhone: studentData.parentPhone || studentData['Parent Phone'] || studentData.parentPhoneNumber || '',
        branch: studentData.branch || studentData.Branch || '',
        year: studentData.year || studentData.Year || '',
        block: studentData.block || studentData.Block || '',
        room: studentData.room || studentData.Room || '',
        role: 'student',
        // photoUrl excluded from bulk import - students can add photos later
        createdAt: new Date(),
        defaultPassword,
        isFirstLogin: true,
        status: 'pending_activation',
        tempCredentials: { email, password: defaultPassword }
      };

      await setDoc(doc(db, 'pendingStudents', studentId), studentDoc);

      return { success: true, email, password: defaultPassword, message: 'Pending student created' };
    } catch (error) {
      return { success: false, email: normalizeEmail(studentData.email || studentData.Email) || 'Unknown', message: error.message };
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    if (uploadedFile.type === 'text/csv' || uploadedFile.name.toLowerCase().endsWith('.csv')) {
      setFile(uploadedFile);
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress({ current: 0, total: 0, success: 0, failed: 0 });
    setResults([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvText = String(e.target?.result || '');
        const students = parseCSV(csvText);
        setProgress(prev => ({ ...prev, total: students.length }));

        // Preload existing emails from both users and pendingStudents to prevent duplicates
        const [usersSnap, pendingSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'pendingStudents')),
        ]);
        const existingEmails = new Set([
          ...usersSnap.docs.map(d => normalizeEmail((d.data().email))),
          ...pendingSnap.docs.map(d => normalizeEmail((d.data().email))),
        ].filter(Boolean));

        const processed = [];
        let ok = 0, bad = 0;
        for (let i = 0; i < students.length; i++) {
          setProgress(prev => ({ ...prev, current: i + 1 }));
          const emailCandidate = normalizeEmail(students[i].email || students[i].Email);
          if (!emailCandidate) {
            processed.push({ success: false, email: 'Unknown', message: 'Missing email' });
            bad++;
            setProgress(prev => ({ ...prev, failed: bad }));
            continue;
          }

          if (existingEmails.has(emailCandidate)) {
            processed.push({ success: false, email: emailCandidate, message: 'Duplicate: email already exists' });
            bad++;
            setProgress(prev => ({ ...prev, failed: bad }));
            continue;
          }

          const result = await createPendingStudent(students[i]);
          processed.push(result);
          if (result.success) {
            ok++;
            existingEmails.add(emailCandidate);
          } else {
            bad++;
          }
          setProgress(prev => ({ ...prev, success: ok, failed: bad }));
          await new Promise(r => setTimeout(r, 200));
        }

        setResults(processed);
        setShowResults(true);
        if (ok > 0 && typeof onStudentsAdded === 'function') onStudentsAdded();
      } catch (err) {
        alert('Error processing file: ' + (err?.message || String(err)));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `email,fullName,phone,usn,parentPhone,branch,year,block,room
student1@example.com,John Doe,1234567890,1MS21CS001,9876543210,Computer Science,2,A,101
student2@example.com,Jane Smith,0987654321,1MS21EE002,8765432109,Electrical Engineering,3,B,205`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!results.length) return;
    const header = ['Email', 'Password', 'Status', 'Message'];
    const rows = results.map(r => [r.email, r.success ? r.password : 'N/A', r.success ? 'Success' : 'Failed', r.message]);
    const csv = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Bulk Import Students</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
          </div>

          {!showResults ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Upload a CSV file with student details</li>
                  <li>• Required: email, fullName, phone, usn, parentPhone, branch, year, block, room</li>
                  <li>• Photos are excluded from bulk import - students can add photos after login</li>
                  <li>• Default password format: firstname123</li>
                  <li>• Accounts are created as pending and activated on first login</li>
                </ul>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={downloadTemplate} className="btn btn-outline btn-primary">
                  <FaDownload className="mr-2" />
                  Download Template
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={isProcessing} />
                <label htmlFor="csv-upload" className={`cursor-pointer flex flex-col items-center space-y-4 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <FaUpload className="text-4xl text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">{file ? file.name : 'Click to upload CSV file'}</p>
                    <p className="text-sm text-gray-500">{file ? 'File selected' : 'or drag and drop'}</p>
                  </div>
                </label>
              </div>

              {file && (
                <div className="flex justify-center">
                  <button onClick={processFile} disabled={isProcessing} className="btn btn-primary btn-lg">
                    {isProcessing ? (<><FaSpinner className="animate-spin mr-2" />Processing...</>) : (<><FaUpload className="mr-2" />Import Students</>)}
                  </button>
                </div>
              )}

              {isProcessing && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Processing: {progress.current} / {progress.total}</span>
                    <span className="text-sm text-gray-500">{progress.total ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-green-600">Success: {progress.success}</span>
                    <span className="text-red-600">Failed: {progress.failed}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FaCheckCircle className="text-green-500 text-xl" />
                <h3 className="text-xl font-semibold text-gray-800">Import Complete</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{progress.success}</div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{progress.total}</div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Message</th>
                      <th>Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td className="font-mono text-sm">{r.email}</td>
                        <td>{r.success ? <span className="badge badge-success">Success</span> : <span className="badge badge-error">Failed</span>}</td>
                        <td className="text-sm">{r.message}</td>
                        <td className="font-mono text-sm">{r.success ? r.password : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-6">
                <button onClick={downloadResults} className="btn btn-outline btn-primary"><FaDownload className="mr-2" />Download Results</button>
                <div className="flex gap-4">
                  <button onClick={() => { setShowResults(false); setFile(null); setResults([]); }} className="btn btn-outline">Import Another File</button>
                  <button onClick={onClose} className="btn btn-primary">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from './adminApi';
import SideBar from '../../shared/SideBar';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi.getSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <span className="loading loading-bars loading-lg"></span>
          </div>
        ) : summary ? (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Total Students', value: summary.totalStudents, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                { label: 'Total Wardens', value: summary.totalWardens, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
                { label: 'Active Requests', value: summary.activeRequests, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                { label: 'Approved Today', value: summary.approvedToday, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
                { label: 'Overdue Now', value: summary.overdueNow, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} className={`${bg} ${border} border rounded-xl p-4 text-center shadow-sm`}>
                  <h3 className="font-semibold text-gray-700 text-sm mb-1">{label}</h3>
                  <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
                </div>
              ))}
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/admin/wardens">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-200">
                  <div className="text-4xl mb-3">👔</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Manage Wardens</h3>
                  <p className="text-sm text-gray-500">Add, edit, assign blocks to wardens</p>
                </div>
              </Link>
              <Link to="/admin/students">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer hover:border-green-200">
                  <div className="text-4xl mb-3">🎓</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Manage Students</h3>
                  <p className="text-sm text-gray-500">View, search, filter and import students</p>
                </div>
              </Link>
              <Link to="/admin/reports">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer hover:border-teal-200">
                  <div className="text-4xl mb-3">📋</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Reports</h3>
                  <p className="text-sm text-gray-500">View outing reports and overdue tracking</p>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600">Failed to load summary data.</p>
        )}
      </main>
    </div>
  );
}

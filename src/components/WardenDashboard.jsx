import React from 'react'
import { useState } from 'react';

export const WardenDashboard = () => {

  const allRequests = [
    {
      id: 1,
      title: 'Medical Appointment',
      outTime: '2025-05-06T13:54:00',
      returnTime: '2025-05-09T01:51:00',
      destination: 'City Hospital',
      notes: 'Doctor appointment for regular check-up',
      status: 'Pending',
    },
    {
      id: 2,
      title: 'Internship Interview',
      outTime: '2025-05-07T11:00:00',
      returnTime: '2025-05-09T22:37:00',
      destination: 'Tech Company Office',
      notes: 'Interview for summer internship',
      status: 'Pending',
    },
    {
      id: 3,
      title: 'Family Visit',
      outTime: '2025-05-03T09:30:00',
      returnTime: '2025-05-05T19:00:00',
      destination: 'Home Town',
      notes: 'Family function',
      status: 'Approved',
    },
    {
      id: 4,
      title: 'Conference',
      outTime: '2025-05-01T08:00:00',
      returnTime: '2025-05-02T18:00:00',
      destination: 'City Conference Hall',
      notes: 'Technical seminar',
      status: 'Rejected',
    }
  ];

  const [filter, setFilter] = useState('Pending');

  // Filtered requests based on selected filter
  const filteredRequests = filter === 'All'
    ? allRequests
    : allRequests.filter((r) => r.status === filter);

  // Count for each category
  const statusCount = {
    Pending: allRequests.filter((r) => r.status === 'Pending').length,
    Approved: allRequests.filter((r) => r.status === 'Approved').length,
    Rejected: allRequests.filter((r) => r.status === 'Rejected').length,
  };

  return (
    <div>
       <div className="p-8 bg-gray-50 min-h-screen font-sans">
  <div className="max-w-7xl mx-auto px-6">
    <h1 className="text-3xl font-bold text-gray-800">Warden Dashboard</h1>
    <p className="text-gray-500 mt-1">Manage and review student outing requests</p>

    {/* Filter and Stats */}
    <div className="mt-6 bg-white p-5 rounded-lg shadow flex flex-col md:flex-row items-center justify-between">
      <div className="flex space-x-2 mb-3 md:mb-0">
        {['All', 'Pending', 'Approved', 'Rejected'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              filter === type
                ? type === 'Pending'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="flex space-x-4 text-sm">
        <span className="flex items-center gap-1 text-yellow-600"><span className="w-2 h-2 bg-yellow-500 rounded-full"></span>Pending: {statusCount.Pending}</span>
        <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Approved: {statusCount.Approved}</span>
        <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 bg-red-500 rounded-full"></span>Rejected: {statusCount.Rejected}</span>
      </div>
    </div>

    {/* Request Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {filteredRequests.map((request) => (
        <div
          key={request.id}
          className={`border p-5 rounded-lg shadow ${
            request.status === 'Pending'
              ? 'bg-yellow-50 border-yellow-200'
              : request.status === 'Approved'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className={`font-medium flex items-center gap-1 ${
              request.status === 'Pending'
                ? 'text-yellow-600'
                : request.status === 'Approved'
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {request.status === 'Pending' && '⚠️ Pending'}
              {request.status === 'Approved' && '✅ Approved'}
              {request.status === 'Rejected' && '❌ Rejected'}
            </span>
            <span className="text-gray-500 text-xs font-medium">#{request.id}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">{request.title}</h2>
          <div className="text-sm text-gray-600 mb-1">📅 Out: {new Date(request.outTime).toLocaleString()}</div>
          <div className="text-sm text-gray-600 mb-2">⏰ Return: {new Date(request.returnTime).toLocaleString()}</div>
          <p className="text-sm text-gray-700"><strong>Destination:</strong> {request.destination}</p>
          <p className="text-sm text-gray-700"><strong>Notes:</strong> {request.notes}</p>
          {request.status === 'Pending' && (
            <div className="mt-4 flex gap-3">
              <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded">Approve</button>
              <button className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded">Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
</div>

    </div>
  )
}

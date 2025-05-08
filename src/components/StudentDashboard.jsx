import React, { useState } from 'react'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Schedule';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const requests = [
  {
    id: 1,
    title: 'Family Emergency',
    outDate: 'May 4, 2025, 4:47 AM',
    returnDate: 'May 11, 2025, 12:54 AM',
    destination: 'Home',
    notes: 'Need to visit home due to a family emergency',
    status: 'Approved',
  },
  {
    id: 2,
    title: 'Medical Appointment',
    outDate: 'May 7, 2025, 6:34 AM',
    returnDate: 'May 9, 2025, 12:41 AM',
    destination: 'City Hospital',
    notes: 'Doctor appointment for regular check-up',
    status: 'Pending',
  },
  {
    id: 3,
    title: 'Shopping Trip',
    outDate: 'Apr 26, 2025, 11:07 PM',
    returnDate: 'Apr 28, 2025, 11:22 PM',
    destination: 'Downtown Mall',
    notes: '',
    status: 'Rejected',
  },
];

const statusStyles = {
  Approved: {
    icon: <CheckCircleIcon className="text-green-600" />,
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
  },
  Pending: {
    icon: <PendingIcon className="text-yellow-600" />,
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
  },
  Rejected: {
    icon: <CancelIcon className="text-red-600" />,
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
  },
};

export const StudentDashboard = () => {
  const [filter, setFilter] = useState('All');
  const filteredRequests = filter === 'All' ? requests : requests.filter(r => r.status === filter);
  const statuses = ['All', 'Pending', 'Approved', 'Rejected'];

  return (
    <div>
      <div className="max-w-7xl mx-auto p-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">My Outing Requests</h2>
            <p className="text-base text-gray-600">Manage and track your hostel outing requests</p>
          </div>
          <button className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            <span className="mr-2">➕</span> New Request
          </button>
        </div>

        <div className="bg-gray-100 p-4 rounded-md flex items-center space-x-4 mb-8">
          <span className="font-medium text-gray-700">Filter:</span>
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {filteredRequests.map((req) => {
            const styles = statusStyles[req.status];
            return (
              <div key={req.id} className={`border rounded-xl p-6 shadow-sm ${styles.bg} border-l-4`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    {styles.icon}
                    <span className={`font-semibold ${styles.text}`}>{req.status}</span>
                  </div>
                  <span className="text-gray-500 text-sm">#{req.id}</span>
                </div>

                <h3 className="text-lg font-semibold mb-3">{req.title}</h3>

                <div className="flex items-center text-sm text-gray-700 mb-1">
                  <CalendarTodayIcon className="w-4 h-4 mr-1" />
                  <span>Out: {req.outDate}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 mb-2">
                  <AccessTimeIcon className="w-4 h-4 mr-1" />
                  <span>Expected Return: {req.returnDate}</span>
                </div>

                <hr className="my-3" />

                <p className="text-sm"><span className="font-medium">Destination:</span> {req.destination}</p>
                {req.notes && (
                  <p className="text-sm mt-1"><span className="font-medium">Notes:</span> {req.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

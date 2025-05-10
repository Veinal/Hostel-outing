import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaUserGraduate, FaUserTie, FaClipboardList, FaUsers } from 'react-icons/fa';

export const AdminDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileMenuOpen ? 'absolute z-50' : 'hidden md:flex'
        } bg-gradient-to-br from-blue-400 to-teal-500 text-white flex flex-col transition-all duration-300 shadow-lg md:relative`}
      >
        <div className="p-4 flex items-center justify-between">
          <h1
            className={`text-2xl font-bold transition-all duration-300 ${
              isCollapsed ? 'hidden' : 'block'
            }`}
          >
            Admin Panel
          </h1>
          <button
            onClick={toggleSidebar}
            className="text-white focus:outline-none"
          >
            <FaBars size={20} />
          </button>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link
                to="/managestudents"
                className="flex items-center px-4 py-3 hover:bg-teal-600 transition rounded-md"
              >
                <FaUserGraduate className="mr-3" />
                <span
                  className={`transition-all duration-300 ${
                    isCollapsed ? 'hidden' : 'block'
                  }`}
                >
                  Manage Students
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/managewardens"
                className="flex items-center px-4 py-3 hover:bg-teal-600 transition rounded-md"
              >
                <FaUserTie className="mr-3" />
                <span
                  className={`transition-all duration-300 ${
                    isCollapsed ? 'hidden' : 'block'
                  }`}
                >
                  Manage Wardens
                </span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Mobile Menu Toggle */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
      >
        <FaBars size={20} />
      </button>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white rounded-lg shadow flex items-center">
            <FaUsers className="text-blue-500 text-3xl mr-4" />
            <div>
              <h2 className="text-xl font-semibold">Total Students</h2>
              <p className="text-gray-600">1,234</p>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow flex items-center">
            <FaUserTie className="text-teal-500 text-3xl mr-4" />
            <div>
              <h2 className="text-xl font-semibold">Total Wardens</h2>
              <p className="text-gray-600">56</p>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow flex items-center">
            <FaClipboardList className="text-purple-500 text-3xl mr-4" />
            <div>
              <h2 className="text-xl font-semibold">Pending Requests</h2>
              <p className="text-gray-600">12</p>
            </div>
          </div>
        </div>


        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/managestudents"
            className="p-6 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
          >
            <h2 className="text-xl font-semibold">Manage Students</h2>
            <p className="text-sm">View, add, edit, or remove student profiles.</p>
          </Link>
          <Link
            to="/managewardens"
            className="p-6 bg-teal-500 text-white rounded-lg shadow hover:bg-teal-600 transition"
          >
            <h2 className="text-xl font-semibold">Manage Wardens</h2>
            <p className="text-sm">View, add, edit, or remove warden profiles.</p>
          </Link>
        </div>
      </main>
    </div>
  );
};
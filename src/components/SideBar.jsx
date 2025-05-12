import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUserGraduate, FaUserTie, FaClipboardList } from 'react-icons/fa'; // Importing icons

export const SideBar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Function to determine if a link is active
  const isActive = (path) => location.pathname === path;

  return (
    <div className="relative">
      {/* Hamburger Button for Mobile */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="btn btn-ghost text-2xl m-2 md:hidden"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isMobileOpen ? 'absolute z-50' : 'hidden'
        } md:block ${
          isCollapsed ? 'w-14' : 'w-56'
        } bg-base-200 text-base-content min-h-full flex flex-col transition-all duration-300`}
      >
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="btn btn-ghost text-xl m-2"
        >
          {isCollapsed ? '☰' : '✖'}
        </button>

        {/* Sidebar Links */}
        <ul className="menu p-4">
          <li>
            <Link
              to="/admindashboard"
              className={`flex items-center gap-4 p-2 rounded-lg ${
                isActive('/admindashboard') ? 'bg-primary text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FaHome className="text-xl" />
              {!isCollapsed && <span>Admin Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/managestudents"
              className={`flex items-center gap-4 p-2 rounded-lg ${
                isActive('/managestudents') ? 'bg-primary text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FaUserGraduate className="text-xl" />
              {!isCollapsed && <span>Manage Students</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/managewardens"
              className={`flex items-center gap-4 p-2 rounded-lg ${
                isActive('/managewardens') ? 'bg-primary text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FaUserTie className="text-xl" />
              {!isCollapsed && <span>Manage Wardens</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/managerequests"
              className={`flex items-center gap-4 p-2 rounded-lg ${
                isActive('/managerequests') ? 'bg-primary text-white' : 'hover:bg-gray-100'
              }`}
            >
              <FaClipboardList className="text-xl" />
              {!isCollapsed && <span>Manage Requests</span>}
            </Link>
          </li>
        </ul>
      </div>

      {/* Overlay for Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        ></div>
      )}
    </div>
  );
};

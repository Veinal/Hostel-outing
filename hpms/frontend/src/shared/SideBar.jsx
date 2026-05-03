import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function SideBar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { to: '/admin/dashboard', icon: '🏠', label: 'Admin Dashboard' },
    { to: '/admin/students', icon: '🎓', label: 'Manage Students' },
    { to: '/admin/wardens', icon: '👔', label: 'Manage Wardens' },
    { to: '/admin/reports', icon: '📋', label: 'Reports' },
  ];

  return (
    <div className="relative">
      {/* Hamburger Button for Mobile */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="btn btn-ghost text-2xl m-2 md:hidden"
        >
          ☰
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`${isMobileOpen ? 'absolute z-50' : 'hidden'} md:block ${isCollapsed ? 'w-14' : 'w-56'} bg-base-200 text-base-content min-h-full flex flex-col transition-all duration-300`}
      >
        {/* Collapse Button */}
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              setIsMobileOpen(false);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
          className="btn btn-ghost text-xl m-2"
        >
          {isCollapsed || (isMobileOpen && window.innerWidth < 768) ? '☰' : '✖'}
        </button>

        {/* Sidebar Links */}
        <ul className="menu p-4">
          {navLinks.map(({ to, icon, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`flex items-center gap-4 p-2 rounded-lg ${
                  isActive(to) ? 'bg-primary text-white' : 'hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="text-xl">{icon}</span>
                {!isCollapsed && <span>{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
        />
      )}
    </div>
  );
}

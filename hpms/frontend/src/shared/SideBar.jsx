import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function SideBar() {
  const location = useLocation();
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
          className="text-2xl m-2 md:hidden text-slate-600"
        >
          ☰
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`${isMobileOpen ? 'absolute z-50' : 'hidden'} md:flex flex-col w-64 bg-slate-800 min-h-screen`}
      >
        <div className="px-6 py-5 border-b border-slate-700 flex justify-between items-center">
          <span className="text-white font-bold text-lg">Admin Portal</span>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            ✖
          </button>
        </div>

        {/* Sidebar Links */}
        <ul className="flex flex-col py-4">
          {navLinks.map(({ to, icon, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={
                  isActive(to)
                    ? 'flex items-center gap-3 px-6 py-3 text-white bg-slate-700 border-r-2 border-blue-400 transition-colors'
                    : 'flex items-center gap-3 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors'
                }
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="text-xl">{icon}</span>
                <span className="font-medium text-sm">{label}</span>
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

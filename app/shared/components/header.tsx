'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { FiBell, FiChevronDown, FiLogOut, FiSettings, FiUser } from 'react-icons/fi';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout click
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    setIsDropdownOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-gray-200 bg-white transition-all duration-300 md:left-[280px]">
      <div className="mt-1 flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side - Page title */}
        <div className="flex items-center" />

        {/* Right side - User info and notifications */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          {/* <button className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100">
            <FiBell size={20} />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500" />
          </button> */}

          {/* User profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 rounded-md p-2 transition-colors hover:bg-gray-100"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-blue-500 font-medium text-white">
                {user?.username ? user.username.charAt(0) : '?'}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-gray-700">{user?.username || 'Guest'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
              <FiChevronDown
                size={16}
                className={`text-gray-500 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                >
                  {/* <a
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiUser className="mr-3 text-gray-500" />
                    Profile
                  </a> */}
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiSettings className="mr-3 text-gray-500" />
                    Settings
                  </Link>
                  <div className="my-1 border-t border-gray-200" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <FiLogOut className="mr-3" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import {
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout click
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    setIsDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[280px] z-30 bg-white border-b border-gray-200 transition-all duration-300">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 mt-1">
        {/* Left side - Page title */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">AESPT Admin</h1>
        </div>

        {/* Right side - User info and notifications */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors relative">
            <FiBell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-blue-500 flex items-center justify-center text-white font-medium">
                {user?.username ? user.username.charAt(0) : '?'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">{user?.username || 'Guest'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
              <FiChevronDown
                size={16}
                className={`text-gray-500 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
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
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                >
                  <a
                    href="#"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiUser className="mr-3 text-gray-500" />
                    Profile
                  </a>
                  <a
                    href="#"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiSettings className="mr-3 text-gray-500" />
                    Settings
                  </a>
                  <div className="border-t border-gray-200 my-1"></div>
                  <a
                    href="#"
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <FiLogOut className="mr-3" />
                    Logout
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

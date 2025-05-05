'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  FiHome,
  FiBox,
  FiUsers,
  FiTruck,
  FiUserCheck,
  FiShoppingCart,
  FiShoppingBag,
  FiSettings,
  FiMenu,
  FiX,
  FiFile,
  FiClipboard,
  FiList,
} from 'react-icons/fi';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: FiHome },
  { name: 'Products', path: '/products', icon: FiBox },
  { name: 'Suppliers', path: '/suppliers', icon: FiTruck },
  { name: 'Customers', path: '/customers', icon: FiUsers },
  { name: 'Salesmen', path: '/salesmen', icon: FiUserCheck },
  { name: 'Sales', path: '/invoices/create', icon: FiShoppingCart },
  { name: 'Sales History', path: '/invoices', icon: FiFile },
  { name: 'Purchases', path: '/purchases/create', icon: FiShoppingBag },
  { name: 'Purchase Entry', path: '/purchase-entries/create', icon: FiClipboard },
  { name: 'Purchases History', path: '/purchases', icon: FiList },
  { name: 'Settings', path: '/settings', icon: FiSettings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="rounded-md bg-white p-2 text-gray-700 shadow-md transition-colors hover:bg-gray-100"
        >
          {isMobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          onKeyDown={e => e.key === 'Escape' && setIsMobileOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ width: isCollapsed ? '80px' : '280px' }}
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-white shadow-lg ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          {!isCollapsed && (
            <div className="flex items-center pb-[4px]">
              <span className="bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-2xl font-bold text-transparent">
                AESPT
              </span>
              <span className="ml-2 text-sm text-gray-500">Admin</span>
            </div>
          )}
          {/* <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hidden md:block"
          >
            <FiChevronRight
              size={20}
              className={`transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </button> */}
        </div>

        {/* Menu items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map(item => {
              const isActive =
                pathname === item.path ||
                // Handle nested routes for settings
                (item.path === '/settings' && pathname.startsWith('/settings'));
              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <div
                      className={`flex cursor-pointer items-center rounded-md p-3 ${
                        isActive
                          ? 'bg-gradient-to-r from-red-500 to-blue-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon size={20} className="shrink-0" />
                      {!isCollapsed && <span className="ml-3 font-medium">{item.name}</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          {!isCollapsed && (
            <div className="text-xs text-gray-500">
              <p>© 2025 AESPT</p>
              <p>Wholesale Spare Parts</p>
            </div>
          )}
        </div>
      </aside>

      {/* Content margin - Fixed to avoid hydration errors with dynamic classes */}
      <div className={isCollapsed ? 'md:ml-20' : 'md:ml-72'} />
    </>
  );
}

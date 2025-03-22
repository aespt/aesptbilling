"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiBox,
  FiUsers,
  FiTruck,
  FiUserCheck,
  FiShoppingCart,
  FiShoppingBag,
  FiSettings,
  FiChevronRight,
  FiMenu,
  FiX,
} from "react-icons/fi";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: FiHome },
  { name: "Products", path: "/products", icon: FiBox },
  { name: "Suppliers", path: "/suppliers", icon: FiTruck },
  { name: "Customers", path: "/customers", icon: FiUsers },
  { name: "Salesmen", path: "/salesmen", icon: FiUserCheck },
  { name: "Sales", path: "/sales", icon: FiShoppingCart },
  { name: "Purchases", path: "/purchases", icon: FiShoppingBag },
  { name: "Settings", path: "/settings", icon: FiSettings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-md bg-white shadow-md text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {isMobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ width: isCollapsed ? '80px' : '280px' }}
        className={`fixed top-0 left-0 z-40 h-screen bg-white shadow-lg flex flex-col
                   ${
                     isMobileOpen
                       ? "translate-x-0"
                       : "-translate-x-full md:translate-x-0"
                   }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center pb-[4px]">
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent ">
                AESPT
              </span>
              <span className="ml-2 text-sm text-gray-500 ">Admin</span>
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
            {menuItems.map((item) => {
              const isActive = pathname === item.path || 
                // Handle nested routes for settings
                (item.path === '/settings' && pathname.startsWith('/settings'));
              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <div
                      className={`flex items-center px-3 py-3 rounded-md cursor-pointer
                                ${
                                  isActive
                                    ? "bg-gradient-to-r from-red-500 to-blue-500 text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                    >
                      <item.icon size={20} className="flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="ml-3 font-medium">{item.name}</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {!isCollapsed && (
            <div className="text-xs text-gray-500">
              <p>© 2024 AESPT</p>
              <p>Wholesale Spare Parts</p>
            </div>
          )}
        </div>
      </aside>

      {/* Content margin - Fixed to avoid hydration errors with dynamic classes */}
      <div className={isCollapsed ? "md:ml-20" : "md:ml-72"} />
    </>
  );
}

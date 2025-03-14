"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="relative z-10">
      {/* App Logo */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mb-4 p-3">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-10 h-10 text-white"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AESPT</h1>
        </motion.div>
      </div>

      {/* Login Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Login</h2>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-500 bg-opacity-20 text-red-100"
            >
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiMail className="text-blue-300" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 border border-blue-300 border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-200"
                  placeholder="Email address"
                  required
                />
              </div>
              
              {/* Password Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiLock className="text-blue-300" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white bg-opacity-10 border border-blue-300 border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-200"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-300 hover:text-blue-100"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              
              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/forgot-password"
                  className="text-blue-300 hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              
              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-lg font-medium text-white ${
                  loading
                    ? "bg-blue-700"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                } transition-colors shadow-lg`}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Login</span>
                    <FiArrowRight className="ml-2" />
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
        
      </motion.div>
      
    </div>
  );
} 
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // In a real app, you would call your backend to send a reset email
      if (email.includes('@')) {
        setSuccess(true);
      } else {
        setError("Please enter a valid email address");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          <p className="text-blue-200 text-sm">Database Management System</p>
        </motion.div>
      </div>

      {/* Reset Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-xl overflow-hidden"
      >
        <div className="p-8">
          {!success ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-blue-200 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
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
                  
                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-center py-3 px-4 rounded-lg font-medium text-white ${
                      isLoading
                        ? "bg-blue-700"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    } transition-colors shadow-lg`}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </motion.button>
                </div>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 bg-opacity-20 mb-4">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Check Your Email</h3>
              <p className="text-blue-200 mb-6">
                We've sent a password reset link to <span className="text-white font-medium">{email}</span>. Please check your inbox and follow the instructions.
              </p>
            </motion.div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-8 py-4 bg-white bg-opacity-5 border-t border-blue-900 border-opacity-30">
          <p className="text-sm text-center">
            <Link
              href="/(features)/(unauth)/login"
              className="inline-flex items-center text-blue-300 hover:text-white font-medium transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
} 
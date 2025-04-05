'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call our API to send a reset email
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error sending reset email:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10">
      {/* App Logo */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-10 text-white"
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
          <h1 className="mb-2 text-3xl font-bold text-white">AESPT</h1>
          <p className="text-sm text-blue-200">Database Management System</p>
        </motion.div>
      </div>

      {/* Reset Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="overflow-hidden rounded-xl bg-white bg-opacity-10 shadow-xl backdrop-blur-lg"
      >
        <div className="p-8">
          {!success ? (
            <>
              <h2 className="mb-2 text-2xl font-bold text-white">Reset Password</h2>
              <p className="mb-6 text-blue-200">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-lg bg-red-500 bg-opacity-20 p-3 text-red-100"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  {/* Email Field */}
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FiMail className="text-blue-300" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-blue-300 border-opacity-30 bg-white bg-opacity-10 py-3 pl-10 pr-4 text-white placeholder:text-blue-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className={`flex w-full items-center justify-center rounded-lg px-4 py-3 font-medium text-white ${
                      isLoading
                        ? 'bg-blue-700'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                    } shadow-lg transition-colors`}
                  >
                    {isLoading ? (
                      <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Send Reset Link'
                    )}
                  </motion.button>
                </div>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-4 text-center"
            >
              <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-green-500 bg-opacity-20">
                <svg
                  className="size-8 text-green-400"
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
              <h3 className="mb-2 text-xl font-semibold text-white">Check Your Email</h3>
              <p className="mb-6 text-blue-200">
                We&apos;ve sent a password reset link to{' '}
                <span className="font-medium text-white">{email}</span>. Please check your inbox and
                follow the instructions.
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-blue-900 border-opacity-30 bg-white bg-opacity-5 px-8 py-4">
          <p className="text-center text-sm">
            <Link
              href="/login"
              className="inline-flex items-center font-medium text-blue-300 transition-colors hover:text-white"
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

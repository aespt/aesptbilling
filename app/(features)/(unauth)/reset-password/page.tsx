'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('Missing password reset token');
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password/validate?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Invalid or expired token');
        }

        setIsTokenValid(true);
      } catch (err) {
        console.error('Token validation error:', err);
        setError(err instanceof Error ? err.message : 'Invalid or expired token');
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('Error resetting password:', err);
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
          {isValidating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 size-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              <p className="text-blue-200">Validating your reset link...</p>
            </div>
          ) : !isTokenValid ? (
            <div className="py-4 text-center">
              <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-red-500 bg-opacity-20">
                <svg
                  className="size-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Invalid Reset Link</h3>
              <p className="mb-6 text-blue-200">
                {error || 'Your password reset link is invalid or has expired.'}
              </p>
              <Link
                href="/(features)/(unauth)/forgot-password"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 font-medium text-white shadow-lg transition-colors hover:from-blue-600 hover:to-indigo-700"
              >
                Request New Link
              </Link>
            </div>
          ) : success ? (
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
              <h3 className="mb-2 text-xl font-semibold text-white">Password Reset Successfully</h3>
              <p className="mb-6 text-blue-200">
                Your password has been reset successfully. You&apos;ll be redirected to the login
                page in a few seconds.
              </p>
            </motion.div>
          ) : (
            <>
              <h2 className="mb-2 text-2xl font-bold text-white">Reset Your Password</h2>
              <p className="mb-6 text-blue-200">Please enter a new password for your account.</p>

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
                  {/* Password Field */}
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FiLock className="text-blue-300" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-blue-300 border-opacity-30 bg-white bg-opacity-10 py-3 pl-10 pr-12 text-white placeholder-blue-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="New Password"
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

                  {/* Confirm Password Field */}
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FiLock className="text-blue-300" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-blue-300 border-opacity-30 bg-white bg-opacity-10 py-3 pl-10 pr-4 text-white placeholder:text-blue-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm New Password"
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
                      'Reset Password'
                    )}
                  </motion.button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-blue-900 border-opacity-30 bg-white bg-opacity-5 px-8 py-4">
          <p className="text-center text-sm">
            <Link
              href="/(features)/(unauth)/login"
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

'use client';

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarProps {
  open: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onClose: () => void;
}

export default function Snackbar({
  open,
  message,
  type = 'info',
  duration = 5000,
  onClose
}: SnackbarProps) {
  // Auto-close the snackbar after duration
  useEffect(() => {
    if (open && duration !== null) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  // If not open, don't render anything
  if (!open) return null;

  // Define styles based on type
  const typeStyles = {
    success: {
      bgColor: 'bg-green-50 border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
      icon: <FiCheckCircle size={20} />
    },
    error: {
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
      icon: <FiAlertCircle size={20} />
    },
    warning: {
      bgColor: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
      icon: <FiInfo size={20} />
    },
    info: {
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
      icon: <FiInfo size={20} />
    }
  };

  const { bgColor, textColor, iconColor, icon } = typeStyles[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className={`flex items-center p-4 rounded-lg shadow-md border ${bgColor} max-w-md`}>
        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className={`ml-3 mr-8 ${textColor}`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          type="button"
          className={`ml-auto -mx-1.5 -my-1.5 ${textColor} rounded-lg p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8`}
          onClick={onClose}
          aria-label="Close"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
} 
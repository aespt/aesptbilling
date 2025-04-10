'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

interface SidepanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

const sizeClasses = {
  small: 'w-1/4',
  medium: 'w-1/2',
  large: 'w-3/4',
};

export default function Sidepanel({ isOpen, onClose, children, size = 'medium' }: SidepanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Sidepanel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '0' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className={`fixed right-0 top-0 z-50 h-full bg-white shadow-lg ${sizeClasses[size]}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

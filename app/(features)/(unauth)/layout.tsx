'use client';

import { motion } from 'framer-motion';

export default function UnauthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {children}
      </motion.div>

      {/* Decorative elements */}
      <div className="pointer-events-none fixed left-0 top-0 z-0 size-full overflow-hidden">
        <div className="animate-blob absolute -left-40 -top-40 size-80 rounded-full bg-blue-500 opacity-10 mix-blend-multiply blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -right-40 top-40 size-80 rounded-full bg-purple-500 opacity-10 mix-blend-multiply blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-40 left-20 size-80 rounded-full bg-indigo-500 opacity-10 mix-blend-multiply blur-3xl" />
      </div>
    </div>
  );
}

// Add animation for the blob effect
const styles = `
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

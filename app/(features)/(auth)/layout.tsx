'use client';

import Header from '@/app/shared/components/header';
import Sidebar from '@/app/shared/components/sidebar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <Sidebar />
      <Header />
      <main>{children}</main>
    </div>
  );
}

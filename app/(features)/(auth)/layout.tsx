'use client';

import { AuthGuard } from '@/app/components/AuthGuard';
import Header from '@/app/shared/components/header';
import Sidebar from '@/app/shared/components/sidebar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 pt-6">
        <Sidebar />
        <Header />
        <main>{children}</main>
      </div>
    </AuthGuard>
  );
}

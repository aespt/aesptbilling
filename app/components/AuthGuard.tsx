'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * A component that guards routes requiring authentication
 * Redirects to login page if user is not authenticated
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If not loading and no user is found, redirect to login
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show nothing while checking authentication
  if (loading || !user) {
    return null;
  }

  // If authenticated, render the children
  return <>{children}</>;
};

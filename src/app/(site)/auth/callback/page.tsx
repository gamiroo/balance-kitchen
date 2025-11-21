// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { captureErrorSafe } from '@/shared/lib/utils/error-utils';
import { logger } from '@/shared/lib/logging/logger';

// Create a wrapper component to handle client-side only logic
const AuthCallbackContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle URL parameters on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const callback = urlParams.get('callbackUrl');
      setCallbackUrl(callback);
    }
  }, []);

  useEffect(() => {
    try {
      if (status === "loading") {
        logger.debug('Auth callback - session loading');
        return;
      }

      if (!session) {
        logger.info('Auth callback - no session, redirecting to login');
        router.push("/login");
        return;
      }

      if (redirecting) {
        logger.debug('Auth callback - already redirecting');
        return;
      }

      setRedirecting(true);
      logger.info('Auth callback - redirecting user', {
        userId: session.user?.id,
        userRole: session.user?.role,
        callbackUrl
      });

      // Determine redirect based on user role
      let redirectPath: string;
      
      if (session.user?.role === "admin") {
        redirectPath = callbackUrl && callbackUrl.includes('/admin')
          ? callbackUrl
          : "/admin/dashboard";
        logger.debug('Admin user redirect', { redirectPath });
      } else {
        redirectPath = callbackUrl || "/dashboard";
        logger.debug('Regular user redirect', { redirectPath });
      }

      router.push(redirectPath);
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'auth_callback_redirect',
        component: 'AuthCallback'
      });
      
      logger.error('Auth callback redirect failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setError('Redirect failed. Please try again.');
      setRedirecting(false);
    }
  }, [session, status, router, callbackUrl, redirecting]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">❌</div>
          <p className="text-gray-800 font-medium">Authentication Error</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

// Main page component - no hooks here to avoid SSR issues
export default function AuthCallback() {
  return <AuthCallbackContent />;
}

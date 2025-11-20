// app/login/page.tsx
'use client';

import { useState, useEffect } from "react";
import { signIn, SignInResponse } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { captureErrorSafe } from '@/shared/lib/utils/error-utils';
import { logger } from '@/shared/lib/logging/logger';
import { AuditLogger } from '@/shared/lib/logging/audit-logger';
import { AnimatedGradientBorder } from '@/shared/components/ui/animated-border/AnimatedGradientBorder';

// Create a wrapper component for search params
const LoginContent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState('/backend/dashboard');
  const [errorParam, setErrorParam] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Handle URL parameters on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const callback = url.searchParams.get('callbackUrl');
      const error = url.searchParams.get('error');
      
      if (callback) {
        setCallbackUrl(callback);
      }
      
      if (error) {
        setErrorParam(error);
      }
      
      // Clear error from URL
      if (error) {
        url.searchParams.delete('error');
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    }
  }, []);

  // Handle previous errors
  useEffect(() => {
    if (errorParam === 'CredentialsSignin') {
      const errorMessage = 'Invalid email or password';
      setError(errorMessage);
      logger.info('Login page loaded with previous auth error', { errorParam });
    }
  }, [errorParam]);

  useEffect(() => {
    // Trigger entrance animation after component mounts
    const timer = setTimeout(() => {
      setShow(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const validateForm = (): boolean => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    logger.info('Login attempt initiated', { 
      email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING' 
    });

    try {
      const result: SignInResponse | undefined = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      logger.debug('Sign in result received', { 
        hasError: !!result?.error,
        status: result?.status,
        ok: result?.ok
      });

      if (result?.error) {
        let errorMessage = "Invalid credentials";
        
        switch (result.error) {
          case 'CredentialsSignin':
            errorMessage = "Invalid email or password";
            break;
          case 'AccessDenied':
            errorMessage = "Access denied";
            break;
          default:
            errorMessage = result.error || "Login failed";
        }
        
        setError(errorMessage);
        logger.warn('Login failed', { 
          error: result.error,
          email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
        });
        
        AuditLogger.logFailedAction(
          undefined,
          'USER_LOGIN',
          'auth',
          result.error || 'LOGIN_FAILED',
          { 
            email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
          }
        );
      } else if (result?.ok) {
        // Success
        logger.info('Login successful', { 
          email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
        });
        
        AuditLogger.logUserAction(
          'unknown', // User ID not available yet
          'USER_LOGIN',
          'auth',
          { 
            email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
          }
        );
        
        // Redirect to auth callback for proper session handling
        router.push("/auth/callback?callbackUrl=" + encodeURIComponent(callbackUrl));
        router.refresh();
      }
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'user_login',
        component: 'LoginPage',
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
      });
      
      logger.error('Login error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
      });
      
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Clear error when user starts typing
      if (error) {
        setError("");
      }
      setter(e.target.value);
    };

  return (
    <div className={styles.container}>
      <div className={`${styles.loginCard} ${show ? styles.show : ''}`}>
        <h1 className={styles.title}>Sign In</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <AnimatedGradientBorder isActive={focusedInput === 'email'}>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleInputChange(setEmail)}
              required
              className={styles.input}
              placeholder="your@email.com"
              autoComplete="email"
              disabled={loading}
            />
            </AnimatedGradientBorder>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handleInputChange(setPassword)}
              required
              className={styles.input}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          {error && (
            <div className={styles.error} role="alert">
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className={styles.button}
            aria-busy={loading}
          >
            {loading ? (
              <span className={styles.buttonContent}>
                <span className={styles.spinner}></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        <div className={styles.signupLink}>
          <p>Don&#39;t have an account? <a href="/signup">Sign up</a></p>
        </div>
        <div className={styles.forgotPassword}>
          <a href="/forgot-password">Forgot password?</a>
        </div>
      </div>
    </div>
  );
};

// Main page component - no hooks here to avoid SSR issues
export default function LoginPage() {
  return <LoginContent />;
}

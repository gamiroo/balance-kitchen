// app/signup/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import bcrypt from "bcryptjs";
import styles from "./signup.module.css";
import { captureErrorSafe } from '@/shared/lib/utils/error-utils';
import { logger } from '@/shared/lib/logging/logger';
import { AuditLogger } from '@/shared/lib/logging/audit-logger';

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Trigger entrance animation after component mounts
    const timer = setTimeout(() => {
      setShow(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Please enter your full name');
      return false;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setError('Please enter a password');
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
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
    logger.info('Signup attempt initiated', { 
      email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
    });

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      logger.debug('Password hashed successfully');
      
      // Create user in database
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password: hashedPassword,
        }),
      });

      const data = await response.json();
      logger.debug('Signup API response received', { 
        status: response.status,
        success: data.success
      });

      if (!response.ok) {
        const errorMessage = data.error || `Signup failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to create account");
      }

      logger.info('User account created successfully', { 
        userId: data.user?.id,
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
      });

      AuditLogger.logUserAction(
        data.user?.id || 'unknown',
        'USER_REGISTERED',
        'auth',
        { 
          email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
        }
      );

      // Sign in user after successful registration
      logger.debug('Attempting automatic sign-in after registration');
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        logger.warn('Auto sign-in failed after registration', { 
          error: result.error 
        });
        setError("Account created but failed to sign in. Please login manually.");
        router.push("/login");
      } else {
        logger.info('Auto sign-in successful after registration');
        router.push("/auth/callback?callbackUrl=/dashboard");
      }
    } catch (err: unknown) {
      captureErrorSafe(err, {
        action: 'user_signup',
        component: 'SignupPage',
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
      });
      
      const errorMessage = err instanceof Error ? err.message : "Failed to create account";
      setError(errorMessage);
      
      logger.error('Signup failed', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING'
      });
      
      AuditLogger.logFailedAction(
        undefined,
        'USER_REGISTRATION',
        'auth',
        'REGISTRATION_FAILED',
        { 
          email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'MISSING',
          error: errorMessage
        }
      );
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
      <div className={`${styles.signupCard} ${show ? styles.show : ''}`}>
        <h1 className={styles.title}>Create Account</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleInputChange(setName)}
              required
              className={styles.input}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
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
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleInputChange(setConfirmPassword)}
              required
              className={styles.input}
              placeholder="••••••••"
              autoComplete="new-password"
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
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        
        <div className={styles.loginLink}>
          <p>Already have an account? <a href="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  );
}

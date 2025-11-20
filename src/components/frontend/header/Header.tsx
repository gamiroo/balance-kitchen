'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CTAButton } from '../../ui/CTAButton/CTAButton';
import { Menu, X, FileText, LogIn, LogOut, User } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import styles from './Header.module.css';
import { ThemeToggle } from '../../ui/ThemeToggle/ThemeToggle';

// Declare Jotform embed handler for TypeScript
declare global {
  interface Window {
    jotformEmbedHandler?: (selector: string, baseUrl: string) => void;
  }
}

export const Header = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { data: session } = useSession();

  /* -------------------------------------------------
     Scroll‑hide / scroll‑show logic (unchanged)
     ------------------------------------------------- */
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);            // scrolling down → hide
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);             // scrolling up → show
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  /* -------------------------------------------------
     Close menu on resize (unchanged)
     ------------------------------------------------- */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleAuth = async () => {
    if (session) {
      await signOut({ callbackUrl: '/' });
    } else {
      await signIn('credentials');
    }
    closeMenu();
  };

  /* -------------------------------------------------
     Navigation items – **Legal** added here
     ------------------------------------------------- */
  const navItems = [
    {
      href: '/menu',
      label: 'Menu',
      icon: (
        <svg
          className={`${styles.navIcon} ${styles.navIconMd}`}
          fill="none"
          stroke="#ffc33e"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: '/faq',
      label: 'Frequently Asked Questions',
      icon: (
        <svg
          className={`${styles.navIcon} ${styles.navIconMd}`}
          fill="none"
          stroke="#ffc33e"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      href: '/contact',
      label: 'Contact Us',
      icon: (
        <svg
          className={`${styles.navIcon} ${styles.navIconMd}`}
          fill="none"
          stroke="#ffc33e"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      href: session ? '/dashboard' : '/profile',
      label: session ? 'Dashboard' : 'User Profile',
      icon: (
        <User
          className={`${styles.navIcon} ${styles.navIconMd}`}
          color="#ffc33e"
          aria-hidden="true"
        />
      ),
    },
    {
      href: '/legal',
      label: 'Legal',
      icon: (
        // Lucide “FileText” icon – matches the colour used by the others
        <FileText
          className={`${styles.navIcon} ${styles.navIconMd}`}
          color="#ffc33e"
          aria-hidden="true"
        />
      ),
    },
  ];

  return (
    <header
      className={`${styles.header} transition-transform duration-300 ease-in-out`}
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
      }}
      role="banner"
    >
      <div className={`${styles.headerContent} ${styles.headerContentMd}`}>
        {/* LEFT – LOGO */}
        <div className={styles.logoContainer}>
          <Link
            href="/"
            className={styles.logoLink}
            onClick={closeMenu}
            aria-label="Balance Kitchen Home"
          >
            <Image
              src="/assets/logo/balance-logo.svg"
              alt="Balance Kitchen"
              className={`${styles.logoImage} ${styles.logoImageMd} ${styles.themeAwareLogo}`}
              width={120}
              height={40}
              priority
            />
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          className={styles.menuButton}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close main menu' : 'Open main menu'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>

        {/* DESKTOP NAVIGATION */}
        <div className={`${styles.desktopNav} ${styles.desktopNavMd}`}>
          {/* ICON‑ONLY LINKS */}
          <nav
            className={styles.navLinks}
            role="navigation"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navLink}
                aria-label={item.label}
              >
                {item.icon}
              </Link>
            ))}
            
            {/* LOGIN/LOGOUT BUTTON */}
            <button
              onClick={handleAuth}
              className={styles.navLink}
              aria-label={session ? 'Sign out' : 'Sign in'}
            >
              {session ? (
                <LogOut
                  className={`${styles.navIcon} ${styles.navIconMd}`}
                  color="#ffc33e"
                  aria-hidden="true"
                />
              ) : (
                <LogIn
                  className={`${styles.navIcon} ${styles.navIconMd}`}
                  color="#ffc33e"
                  aria-hidden="true"
                />
              )}
            </button>
          </nav>

          <div className={styles.themeToggleWrapper}>
            <ThemeToggle />
          </div>

          {/* CTA BUTTON (right side) */}
          <div>
            <CTAButton
              onClick={onOpenModal}
              aria-label="Enquire for Balance Kitchen"
            >
              Enquire now
            </CTAButton>
          </div>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY – uses the same navItems array */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className={`${styles.mobileMenuOverlay} ${styles.mobileMenuOverlayOpen}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
          aria-describedby="mobile-menu-description"
        >
          {/* TOP – LOGO + CLOSE */}
          <div className={styles.mobileMenuTop}>
            <Link
              href="/"
              className={styles.mobileLogoLink}
              onClick={closeMenu}
              aria-label="Balance Kitchen Home"
            >
              <Image
                src="/assets/logo/balance-logo.svg"
                alt="Balance Kitchen"
                className={`${styles.mobileLogoImage} ${styles.themeAwareLogo}`}
                width={140}
                height={45}
              />
            </Link>

            <button
              className={styles.mobileCloseButton}
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={28} aria-hidden="true" />
            </button>
          </div>

          {/* SCREEN‑READER TITLE / DESCRIPTION */}
          <h2 id="mobile-menu-title" className="sr-only">
            Main Menu
          </h2>
          <p id="mobile-menu-description" className="sr-only">
            Navigate to different sections of the website
          </p>

          {/* MIDDLE – SCROLLABLE LIST */}
          <div className={styles.mobileMenuContent}>
            <nav
              className={styles.mobileNav}
              role="navigation"
              aria-label="Main mobile navigation"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.mobileNavLink}
                  onClick={closeMenu}
                  aria-label={item.label}
                >
                  <div className={styles.mobileNavLinkContent}>
                    <span className={styles.mobileNavIcon}>{item.icon}</span>
                    <span className={styles.mobileNavText}>{item.label}</span>
                  </div>
                </Link>
              ))}
              
              {/* MOBILE LOGIN/LOGOUT */}
              <button
                onClick={handleAuth}
                className={styles.mobileNavLink}
                aria-label={session ? 'Sign out' : 'Sign in'}
              >
                <div className={styles.mobileNavLinkContent}>
                  <span className={styles.mobileNavIcon}>
                    {session ? (
                      <LogOut
                        className={`${styles.navIcon} ${styles.navIconMd}`}
                        color="#ffc33e"
                        aria-hidden="true"
                      />
                    ) : (
                      <LogIn
                        className={`${styles.navIcon} ${styles.navIconMd}`}
                        color="#ffc33e"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span className={styles.mobileNavText}>
                    {session ? 'Sign Out' : 'Sign In'}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* BOTTOM – CTA */}
          <div className={styles.mobileMenuBottom}>
            <div className={styles.mobileToggleRow}>
              <span className={styles.mobileToggleLabel}>Theme</span>
              <ThemeToggle className={styles.mobileToggle} />
            </div>
            <CTAButton
              onClick={() => {
                onOpenModal();
                closeMenu();
              }}
              aria-label="Enquire for Balance Kitchen"
            >
              Enquire now
            </CTAButton>
          </div>
        </div>
      )}
    </header>
  );
};

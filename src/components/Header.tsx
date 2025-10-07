// src/app/components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CTAButton } from './CTAButton';
import { Menu, X } from 'lucide-react';
import styles from './styles/Header.module.css';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px threshold
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Close menu when resizing from mobile to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Navigation items with accessible labels
  const navItems = [
    { 
      href: "/menu", 
      label: "Menu", 
      icon: (
        <svg className={`${styles.navIcon} ${styles.navIconMd}`} fill="none" stroke="#ffc33e" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      href: "/faq", 
      label: "Frequently Asked Questions", 
      icon: (
        <svg className={`${styles.navIcon} ${styles.navIconMd}`} fill="none" stroke="#ffc33e" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      href: "/contact", 
      label: "Contact Us", 
      icon: (
        <svg className={`${styles.navIcon} ${styles.navIconMd}`} fill="none" stroke="#ffc33e" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      href: "/profile", 
      label: "User Profile", 
      icon: (
        <svg className={`${styles.navIcon} ${styles.navIconMd}`} fill="none" stroke="#ffc33e" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  return (
    <header 
      className={`${styles.header} transition-transform duration-300 ease-in-out`}
      style={{ 
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out'
      }}
      role="banner"
    >
      <div className={`${styles.headerContent} ${styles.headerContentMd}`}>
        {/* Left side - Logo */}
        <div className={styles.logoContainer}>
          <Link 
            href="/" 
            className={styles.logoLink}
            onClick={closeMenu}
            aria-label="Balance Kitchen Home"
          >
            <Image 
              src="/balance-logo-9.svg" 
              alt="Balance Kitchen" 
              className={`${styles.logoImage} ${styles.logoImageMd}`}
              width={120}
              height={40}
              priority
            />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.menuButton}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close main menu" : "Open main menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>

        {/* Desktop Navigation */}
        <div className={`${styles.desktopNav} ${styles.desktopNavMd}`}>
          {/* Icon Links */}
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
          </nav>

          {/* Right side - CTA Button */}
          <div>
            <CTAButton 
              href="#" 
              onClick={() => console.log('Sign up clicked')}
              aria-label="Sign up for Balance Kitchen"
            >
              Sign up now
            </CTAButton>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Improved Layout */}
      {isMenuOpen && (
        <div 
          id="mobile-menu"
          className={`${styles.mobileMenuOverlay} ${styles.mobileMenuOverlayOpen}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
          aria-describedby="mobile-menu-description"
        >
          {/* Top Section - Logo and Close Button */}
          <div className={styles.mobileMenuTop}>
            <Link 
              href="/" 
              className={styles.mobileLogoLink}
              onClick={closeMenu}
              aria-label="Balance Kitchen Home"
            >
              <Image 
                src="/balance-logo-9.svg" 
                alt="Balance Kitchen" 
                className={styles.mobileLogoImage}
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

          {/* Menu Title for screen readers */}
          <h2 id="mobile-menu-title" className="sr-only">Main Menu</h2>
          <p id="mobile-menu-description" className="sr-only">Navigate to different sections of the website</p>

          {/* Middle Section - Navigation Links (Scrollable) */}
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
            </nav>
          </div>

          {/* Bottom Section - CTA Button */}
          <div className={styles.mobileMenuBottom}>
            <CTAButton 
              href="#" 
              onClick={() => {
                console.log('Sign up clicked');
                closeMenu();
              }}
              aria-label="Sign up for Balance Kitchen"
            >
              Sign up now
            </CTAButton>
          </div>
        </div>
      )}
    </header>
  );
};

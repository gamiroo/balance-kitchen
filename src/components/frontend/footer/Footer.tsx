import styles from './Footer.module.css';
import Image from "next/image";

export const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.footerContent}>
      <div className={styles.copyright}>
        © 2025 Balance Kitchen – All rights reserved.
      </div>
      <div className={styles.links}>
        <a href="/privacy" className={styles.link}>
          Privacy Policy
        </a>
        <a href="/terms" className={styles.link}>
          Terms of Use
        </a>
      </div>
      <div className={styles.formBadge}>
        <span className={styles.badgeText}>Designed & Built by</span>
        <Image
          src="/assets/gamiroo.svg"
          alt="Gamiroo logo"
          width={60}
          height={20}
          className={styles.gamirooLogo}
        />
      </div>
    </div>
  </footer>
);

export const themeColors = {
  primary: '#ffc33e',
  primaryLight: '#ffd54f',
  primaryDark: '#f57f17',
  textPrimary: '#ffffff',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  textAccent: '#ffc33e',
  borderPrimary: 'rgba(255, 195, 62, 0.2)',
  borderSecondary: 'rgba(255, 255, 255, 0.1)',
  success: '#10b981',
  error: '#ef4444',
};

interface EmailThemeStyles {
  [key: string]: string;
}

export const assetConfig = {
  logoUrl: process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo-bal-form.png`
    : 'https://balance-kitchen.vercel.app/images/logo-bal-form.png',
  logoAlt: 'Balance Kitchen Logo - Fresh, Healthy, Delivered',
  
  // Fallback options for logo
  logoFallbackOptions: [
    // SVG logo (if you have one)
    `${process.env.NEXT_PUBLIC_SITE_URL || 'https://balance-kitchen.vercel.app'}/balance-logo.svg`,
    // PNG with different naming
    `${process.env.NEXT_PUBLIC_SITE_URL || 'https://balance-kitchen.vercel.app'}/images/balance-kitchen-logo.png`,
    // Alternative path
    `${process.env.NEXT_PUBLIC_SITE_URL || 'https://balance-kitchen.vercel.app'}/assets/logo-bal-form.png`,
  ]
};

export const modalThemeStyles: EmailThemeStyles = {
  ...themeColors,
  
  baseBody: `
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: 
      radial-gradient(circle at 10% 20%, rgba(255, 195, 62, 0.15) 0%, transparent 20%),
      radial-gradient(circle at 90% 80%, rgba(203, 46, 18, 0.25) 0%, transparent 20%),
      radial-gradient(circle at 40% 80%, rgba(169, 76, 240, 0.1) 0%, transparent 30%),
      radial-gradient(circle at 70% 20%, rgba(41, 58, 211, 0.1) 0%, transparent 30%),
      rgba(0, 0, 0, 0.92);
    color: ${themeColors.textPrimary};
    min-height: 100vh;
    line-height: 1.6;
  `,
  
  // Mobile-first responsive container
  mobileContainer: `
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    padding: 1rem;
    box-sizing: border-box;
  `,
  
  header: `
    padding: 2rem;
    text-align: center;
    border-bottom: 1px solid ${themeColors.borderSecondary};
    background: rgba(26, 25, 25, 0.232);
    backdrop-filter: blur(24px);
    position: relative;
    overflow: hidden;
  `,
  
  headerGlow: `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255, 195, 62, 0.1), rgba(203, 46, 18, 0.1));
    filter: blur(50px);
    z-index: -1;
  `,
  
  brandContainer: `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    position: relative;
    z-index: 2;
  `,
  
  logoIcon: `
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 12px 16px;
    border: 1px solid ${themeColors.borderPrimary};
    box-shadow: 0 0 20px rgba(255, 195, 62, 0.3);
  `,
  
  logoImage: `
    width: 280px;
    height: auto;
    max-height: 80px;
    object-fit: contain;
    display: block;
  `,
  
  title: `
    margin: 0;
    color: ${themeColors.textAccent};
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  `,
  
  subtitle: `
    margin: 16px 0 0 0;
    color: ${themeColors.textSecondary};
    font-size: 16px;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  `,
  
  mainContainer: `
    padding: 2rem;
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    padding: 1rem;
    box-sizing: border-box;
  `,
  
  contentCard: `
    max-width: 680px;
    margin: 0 auto;
    background: rgba(29, 28, 28, 0.288);
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(255, 195, 62, 0.2);
    overflow: hidden;
    position: relative;
    animation: modalEnter 0.2s ease-out;
  `,
  
  cardGlow: `
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg, rgba(255, 195, 62, 0.3), rgba(203, 46, 18, 0.3), rgba(169, 76, 240, 0.3));
    border-radius: 16px;
    filter: blur(8px);
    z-index: -1;
    opacity: 0.6;
  `,
  
  section: `
    padding: 2.5rem;
    border-bottom: 1px solid ${themeColors.borderSecondary};
    background: rgba(26, 25, 25, 0.232);
    backdrop-filter: blur(24px);
    box-shadow: inset 0 0 20px rgba(231, 214, 179, 0.05);
  `,
  
  sectionLast: `
    padding: 2.5rem;
    background: rgba(26, 25, 25, 0.232);
    backdrop-filter: blur(24px);
    box-shadow: inset 0 0 20px rgba(231, 214, 179, 0.05);
  `,
  
  sectionHeader: `
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
  `,
  
  iconContainer: `
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primaryDark});
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px rgba(255, 195, 62, 0.3);
    border: 1px solid ${themeColors.borderPrimary};
  `,
  
  icon: `
    font-size: 24px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  `,
  
  sectionTitle: `
    margin: 0;
    color: ${themeColors.textAccent};
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
  `,
  
  sectionSubtitle: `
    margin: 8px 0 0 0;
    color: ${themeColors.textMuted};
    font-size: 14px;
    font-weight: 500;
  `,
  
  description: `
    margin: 0;
    color: ${themeColors.textSecondary};
    font-size: 18px;
    line-height: 1.6;
  `,
  
  // Accessible contact grid
  contactGrid: `
    display: grid;
    gap: 0;
  `,
  
  contactRow: `
    display: grid;
    grid-template-columns: 140px 1fr;
    align-items: flex-start;
    padding: 1rem 0;
    border-bottom: 1px solid rgba(255, 195, 62, 0.1);
    gap: 1rem;
  `,
  
  contactLabel: `
    color: ${themeColors.textMuted};
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 0.25rem;
  `,
  
  contactValue: `
    color: ${themeColors.textPrimary};
    font-size: 16px;
    font-weight: 500;
    word-break: break-word;
  `,
  
  contactLink: `
    color: ${themeColors.primaryLight};
    text-decoration: none;
    transition: color 0.2s ease;
    font-weight: 500;
  `,
  
  messageCard: `
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid ${themeColors.borderPrimary};
    border-radius: 16px;
    padding: 1.5rem;
    margin-top: 1.25rem;
    position: relative;
    overflow: hidden;
  `,
  
  messageCardGlow: `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 195, 62, 0.1), rgba(203, 46, 18, 0.1));
    z-index: -1;
  `,
  
  messageText: `
    margin: 0;
    color: ${themeColors.textPrimary};
    font-size: 16px;
    line-height: 1.7;
    white-space: pre-wrap;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  `,
  
  buttonContainer: `
    text-align: center;
    margin-top: 2rem;
  `,
  
  button: `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primaryDark});
    color: #000;
    text-decoration: none;
    padding: 16px 32px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 0 20px rgba(255, 195, 62, 0.3);
    border: 1px solid ${themeColors.borderPrimary};
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  `,
  
  buttonGlow: `
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s ease;
  `,
  
  trackingBadge: `
    margin-top: 1.5rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(255, 195, 62, 0.15));
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 16px;
    position: relative;
    overflow: hidden;
  `,
  
  trackingBadgeGlow: `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(255, 195, 62, 0.1));
    z-index: -1;
  `,
  
  trackingTitle: `
    margin: 0 0 8px 0;
    color: ${themeColors.primaryLight};
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  
  trackingText: `
    margin: 0;
    color: ${themeColors.textSecondary};
    font-size: 14px;
    font-weight: 500;
  `,
  
  footer: `
    text-align: center;
    padding: 2rem;
    margin-top: 2.5rem;
  `,
  
  footerText: `
    margin: 0;
    color: ${themeColors.textMuted};
    font-size: 14px;
    line-height: 1.6;
  `,
  
  footerLink: `
    color: ${themeColors.primaryLight};
    text-decoration: none;
    transition: color 0.2s ease;
  `,
  
  // Accessibility and screen reader support
  srOnly: `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `,
  
  fadeIn: 'animation: fadeInUp 0.6s ease-out;',
  slideIn: 'animation: slideInLeft 0.8s ease-out;',
  pulse: 'animation: pulse 2s infinite;',
  
  keyframes: `
    @keyframes modalEnter {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `,
  
  // Mobile responsive breakpoints
  mobileBreakpoints: `
    @media (max-width: 768px) {
      .mainContainer { padding: 1rem !important; }
      .section { padding: 1.5rem !important; }
      .sectionLast { padding: 1.5rem !important; }
      .contactRow { 
        grid-template-columns: 1fr !important; 
        gap: 0.5rem !important;
        padding: 0.75rem 0 !important;
      }
      .contactLabel { 
        margin-bottom: 0.25rem !important;
        font-size: 13px !important;
      }
      .contactValue { font-size: 15px !important; }
      .logoImage { width: 200px !important; max-height: 60px !important; }
      .title { font-size: 24px !important; }
      .sectionTitle { font-size: 20px !important; }
      .description { font-size: 16px !important; }
    }
    
    @media (max-width: 480px) {
      .header { padding: 1.5rem 1rem !important; }
      .mainContainer { padding: 0.75rem !important; }
      .section { padding: 1.25rem !important; }
      .sectionLast { padding: 1.25rem !important; }
      .logoImage { width: 150px !important; max-height: 50px !important; }
      .title { font-size: 20px !important; }
      .sectionTitle { font-size: 18px !important; }
      .button { 
        padding: 12px 24px !important; 
        font-size: 14px !important;
        width: 100% !important;
        justify-content: center !important;
      }
    }
  `
};

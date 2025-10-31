// src/lib/email-templates.ts
import { modalThemeStyles, assetConfig } from './email-styles';

export interface EmailData {
  displayName: string;
  sanitized: {
    firstName: string;
    lastName: string;
    preferredName?: string;
    email: string;
    phone?: string;
    subject: string;
    howDidYouHear: string;
    referrer?: string;
    message: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
  utmParts: string[];
}

const generateLogoHTML = () => {
  return `
    <img
      src="${assetConfig.logoUrl}"
      alt="${assetConfig.logoAlt}"
      class="logo-image"
      style="${modalThemeStyles.logoImage}"
      width="280"
      height="100"
      onerror="this.onerror=null; this.src='${assetConfig.logoFallback}'"
    />
  `;
};

export const generateAdminEmailHTML = (data: EmailData, requestId: string, ip: string): string => {
  const { displayName, sanitized, utmParts } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New Enquiry - Balance Kitchen</title>
  <style>
    ${modalThemeStyles.keyframes}
    ${modalThemeStyles.mobileBreakpoints}
    .email-button:hover .button-glow { left: 100%; }
    .email-button:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255, 195, 62, 0.6); }
    .contact-link:hover { color: ${modalThemeStyles.primaryLight}; }
    .footer-link:hover { color: ${modalThemeStyles.primaryLight}; }
    
    @media (prefers-contrast: high) {
      .content-card { border-width: 2px !important; }
      .contact-row { border-bottom-width: 2px !important; }
      .button { border-width: 2px !important; }
    }
    
    @media (prefers-reduced-motion: reduce) {
      .fade-in { animation: none !important; }
      .slide-in { animation: none !important; }
      .pulse { animation: none !important; }
      .email-button:hover { transform: none !important; }
    }
  </style>
</head>
<body style="${modalThemeStyles.baseBody}">
  <div role="main" aria-label="Admin notification for new enquiry">
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="header" style="${modalThemeStyles.header}">
      <div style="${modalThemeStyles.headerGlow}"></div>
      <tr>
        <td style="text-align: center; position: relative; z-index: 2;">
          <div style="${modalThemeStyles.brandContainer}">
            <div style="align-items: center;">
              ${generateLogoHTML()}
            </div>
          </div>
          <p style="${modalThemeStyles.subtitle}" aria-label="Email timestamp">
            New Website Enquiry • ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </td>
      </tr>
    </table>

    <div class="main-container" style="${modalThemeStyles.mainContainer}">
      <div class="content-card" style="${modalThemeStyles.contentCard} ${modalThemeStyles.fadeIn}">
        <div style="${modalThemeStyles.cardGlow}"></div>
        
        <div class="section" style="${modalThemeStyles.section}">
          <div style="${modalThemeStyles.sectionHeader} ${modalThemeStyles.slideIn}">
            <div style="${modalThemeStyles.iconContainer} ${modalThemeStyles.pulse}" aria-hidden="true">
              <span style="${modalThemeStyles.icon}">📧</span>
            </div>
            <div>
              <h2 style="${modalThemeStyles.sectionTitle}">
                New Enquiry Received
              </h2>
              <p style="${modalThemeStyles.sectionSubtitle}">
                From ${displayName}
              </p>
            </div>
          </div>
          <p style="${modalThemeStyles.description}">
            You have received a new enquiry from <strong style="color: ${modalThemeStyles.textAccent};">${displayName}</strong>. 
            Please review the details below and respond promptly.
          </p>
        </div>

        <div class="section" style="${modalThemeStyles.section}">
          <div style="${modalThemeStyles.sectionHeader}">
            <div style="${modalThemeStyles.iconContainer}" aria-hidden="true">
              <span style="${modalThemeStyles.icon}">👤</span>
            </div>
            <div>
              <h3 style="${modalThemeStyles.sectionTitle}; font-size: 20px;">
                Contact Information
              </h3>
            </div>
          </div>
          
          <div style="${modalThemeStyles.contactGrid}" role="table" aria-label="Contact details">
            <div class="contact-row" style="${modalThemeStyles.contactRow}" role="row">
              <div style="${modalThemeStyles.contactLabel}" role="rowheader">
                <span aria-hidden="true">👤</span>
                <span>Name</span>
              </div>
              <div style="${modalThemeStyles.contactValue}" role="cell">
                ${displayName}
              </div>
            </div>
            
            <div class="contact-row" style="${modalThemeStyles.contactRow}" role="row">
              <div style="${modalThemeStyles.contactLabel}" role="rowheader">
                <span aria-hidden="true">✉️</span>
                <span>Email</span>
              </div>
              <div style="${modalThemeStyles.contactValue}" role="cell">
                <a 
                  href="mailto:${sanitized.email}" 
                  class="contact-link" 
                  style="${modalThemeStyles.contactLink}"
                  aria-label="Send email to ${sanitized.email}"
                >
                  ${sanitized.email}
                </a>
              </div>
            </div>
            
            <div class="contact-row" style="${modalThemeStyles.contactRow}" role="row">
              <div style="${modalThemeStyles.contactLabel}" role="rowheader">
                <span aria-hidden="true">📞</span>
                <span>Phone</span>
              </div>
              <div style="${modalThemeStyles.contactValue}" role="cell">
                ${sanitized.phone || 'Not provided'}
              </div>
            </div>
            
            <div class="contact-row" style="${modalThemeStyles.contactRow}" role="row">
              <div style="${modalThemeStyles.contactLabel}" role="rowheader">
                <span aria-hidden="true">📢</span>
                <span>Heard From</span>
              </div>
              <div style="${modalThemeStyles.contactValue}" role="cell">
                ${sanitized.howDidYouHear}
              </div>
            </div>
            
            <div class="contact-row" style="${modalThemeStyles.contactRow}" role="row">
              <div style="${modalThemeStyles.contactLabel}" role="rowheader">
                <span aria-hidden="true">🤝</span>
                <span>Referrer</span>
              </div>
              <div style="${modalThemeStyles.contactValue}" role="cell">
                ${sanitized.referrer || 'Not provided'}
              </div>
            </div>
            
            <div class="contact-row" style="${modalThemeStyles.contactRow}; border-bottom: none;" role="row">
              <div style="${modalThemeStyles.contactLabel}" role="rowheader">
                <span aria-hidden="true">📋</span>
                <span>Subject</span>
              </div>
              <div style="${modalThemeStyles.contactValue}" role="cell">
                ${sanitized.subject}
              </div>
            </div>
          </div>

          ${utmParts.length ? `
          <div style="${modalThemeStyles.trackingBadge}">
            <div style="${modalThemeStyles.trackingBadgeGlow}"></div>
            <p style="${modalThemeStyles.trackingTitle}">
              <span aria-hidden="true">📊</span>
              <span>Tracking Parameters</span>
            </p>
            <p style="${modalThemeStyles.trackingText}">
              ${utmParts.join(' • ')}
            </p>
          </div>
          ` : ''}
        </div>

        <div class="section-last" style="${modalThemeStyles.sectionLast}">
          <div style="${modalThemeStyles.sectionHeader}">
            <div style="${modalThemeStyles.iconContainer}" aria-hidden="true">
              <span style="${modalThemeStyles.icon}">💬</span>
            </div>
            <div>
              <h3 style="${modalThemeStyles.sectionTitle}; font-size: 20px;">
                Message Content
              </h3>
            </div>
          </div>
          
          <div style="${modalThemeStyles.messageCard}">
            <div style="${modalThemeStyles.messageCardGlow}"></div>
            <p style="${modalThemeStyles.messageText}" role="article" aria-label="Enquiry message content">
              ${sanitized.message}
            </p>
          </div>

          <div style="${modalThemeStyles.buttonContainer}">
            <a 
              href="mailto:${sanitized.email}?subject=Re: ${encodeURIComponent(sanitized.subject)}" 
              class="email-button"
              style="${modalThemeStyles.button}"
              aria-label="Reply to ${displayName.split(' ')[0]} via email"
              role="button"
            >
              <span style="${modalThemeStyles.buttonGlow}" class="button-glow"></span>
              <span aria-hidden="true">📩</span>
              <span>Reply to ${displayName.split(' ')[0]}</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="footer" style="${modalThemeStyles.footer}">
      <p style="${modalThemeStyles.footerText}">
        <span class="sr-only" style="${modalThemeStyles.srOnly}">Request ID: </span>
        <strong>Request ID:</strong> ${requestId} • <strong>IP:</strong> ${ip}<br>
        <span class="sr-only" style="${modalThemeStyles.srOnly}">This enquiry was submitted via </span>
        This enquiry was submitted via the Balance Kitchen website contact form.
      </p>
      <p style="${modalThemeStyles.footerText}; margin-top: 16px;">
        © ${new Date().getFullYear()} Balance Kitchen • Crafted with ❤️ for healthy living
      </p>
    </div>

  </div>
</body>
</html>
`;
};

export const generateConfirmationEmailHTML = (data: EmailData, requestId: string): string => {
  const { displayName, sanitized } = data;
  const firstName = displayName.split(' ')[0];
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Thank you - Balance Kitchen</title>
  <style>
    ${modalThemeStyles.keyframes}
    ${modalThemeStyles.mobileBreakpoints}
    .email-button:hover .button-glow { left: 100%; }
    .email-button:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(16, 185, 129, 0.5); }
    .footer-link:hover { color: ${modalThemeStyles.primaryLight}; }
    
    @media (prefers-contrast: high) {
      .content-card { border-width: 2px !important; }
      .summary-card { border-width: 2px !important; }
      .button { border-width: 2px !important; }
    }
    
    @media (prefers-reduced-motion: reduce) {
      .fade-in { animation: none !important; }
      .pulse { animation: none !important; }
      .email-button:hover { transform: none !important; }
    }
  </style>
</head>
<body style="${modalThemeStyles.baseBody}">
  <div role="main" aria-label="Confirmation email for enquiry submission">
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="header" style="${modalThemeStyles.header}">
      <div style="${modalThemeStyles.headerGlow}"></div>
      <tr>
        <td style="text-align: center; position: relative; z-index: 2;">
          <div style="${modalThemeStyles.brandContainer}">
            <div style="align-items: center;">
             ${generateLogoHTML()}
            </div>
          </div>
          <p style="${modalThemeStyles.subtitle}" aria-label="Company tagline">
            Fresh • Healthy • Delivered
          </p>
        </td>
      </tr>
    </table>

    <div class="main-container" style="${modalThemeStyles.mainContainer}">
      <div class="content-card" style="${modalThemeStyles.contentCard} ${modalThemeStyles.fadeIn}">
        <div style="${modalThemeStyles.cardGlow}"></div>
        
        <div class="section" style="${modalThemeStyles.section}; text-align: center;">
          <div style="width: 96px; height: 96px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 2rem; box-shadow: 0 16px 40px rgba(16, 185, 129, 0.4); ${modalThemeStyles.pulse}" aria-hidden="true">
            <span style="color: #ffffff; font-size: 40px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));">✅</span>
          </div>
          
          <h2 style="margin: 0 0 16px 0; color: ${modalThemeStyles.textAccent}; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
            Thank you, ${firstName}!
          </h2>
          
          <p style="margin: 0; color: ${modalThemeStyles.textSecondary}; font-size: 18px; line-height: 1.6;">
            We&apos;ve received your enquiry and our team will get back to you within 24 hours.
          </p>
        </div>

        <div class="section" style="${modalThemeStyles.section}">
          <div class="summary-card" style="background: rgba(15, 23, 42, 0.6); border: 1px solid ${modalThemeStyles.borderPrimary}; border-radius: 16px; padding: 2rem; text-align: center;">
            <h3 style="margin: 0 0 24px 0; color: ${modalThemeStyles.textAccent}; font-size: 20px; font-weight: 700;">
              <span aria-hidden="true">📝</span>
              <span>Your Message Summary</span>
            </h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; color: ${modalThemeStyles.textMuted}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                <span class="sr-only" style="${modalThemeStyles.srOnly}">Subject: </span>
                Subject
              </p>
              <p style="margin: 0; color: ${modalThemeStyles.textPrimary}; font-size: 18px; font-weight: 600;">
                ${sanitized.subject}
              </p>
            </div>
            
            <div>
              <p style="margin: 0 0 8px 0; color: ${modalThemeStyles.textMuted}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                <span class="sr-only" style="${modalThemeStyles.srOnly}">Message preview: </span>
                Message Preview
              </p>
              <p style="margin: 0; color: ${modalThemeStyles.textSecondary}; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
                ${sanitized.message.substring(0, 200)}${sanitized.message.length > 200 ? '...' : ''}
              </p>
            </div>
          </div>

          ${sanitized.referrer ? `
          <div style="margin-top: 24px; padding: 24px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15)); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; text-align: center;">
            <p style="margin: 0; color: ${modalThemeStyles.success}; font-size: 16px; font-weight: 700;">
              <span aria-hidden="true">🎁</span>
              <span>Thank your referrer</span>
            </p>
            <p style="margin: 8px 0 0 0; color: #6ee7b7; font-size: 14px;">
              We&apos;ll send a thank you gift to <strong>${sanitized.referrer}</strong> for referring you to us!
            </p>
          </div>
          ` : ''}
        </div>

        <div class="section-last" style="${modalThemeStyles.sectionLast}">
          <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15)); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 16px; padding: 2rem;">
            <h3 style="margin: 0 0 24px 0; color: ${modalThemeStyles.textAccent}; font-size: 20px; font-weight: 700; text-align: center;">
              <span aria-hidden="true">⏰</span>
              <span>What happens next?</span>
            </h3>
            
            <div style="display: grid; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 12px; color: ${modalThemeStyles.textSecondary}; font-size: 16px;">
                <span style="font-size: 20px; font-weight: bold;">1.</span>
                <span>Our team reviews your enquiry</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; color: ${modalThemeStyles.textSecondary}; font-size: 16px;">
                <span style="font-size: 20px; font-weight: bold;">2.</span>
                <span>We&apos;ll respond within 24 hours</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; color: ${modalThemeStyles.textSecondary}; font-size: 16px;">
                <span style="font-size: 20px; font-weight: bold;">3.</span>
                <span>Ready to help with your Balance Kitchen journey!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer" style="${modalThemeStyles.footer}">
      <p style="${modalThemeStyles.footerText}">
        <span class="sr-only" style="${modalThemeStyles.srOnly}">Request ID: </span>
        <strong>Request ID:</strong> ${requestId}<br>
        <span class="sr-only" style="${modalThemeStyles.srOnly}">This is an automated confirmation. Please do not reply to this email. </span>
        This is an automated confirmation. Please do not reply to this email.
      </p>
      <p style="${modalThemeStyles.footerText}; margin-top: 16px;">
        © ${new Date().getFullYear()} Balance Kitchen • Made with ❤️ for healthy living
      </p>
      <p style="${modalThemeStyles.footerText}; margin-top: 16px;">
        <a href="https://balancekitchen.com" class="footer-link" style="${modalThemeStyles.footerLink}" aria-label="Visit Balance Kitchen website">Visit our website</a> • 
        <a href="https://balancekitchen.com/privacy" class="footer-link" style="${modalThemeStyles.footerLink}" aria-label="Read our privacy policy">Privacy Policy</a> • 
        <a href="https://balancekitchen.com/terms" class="footer-link" style="${modalThemeStyles.footerLink}" aria-label="Read our terms of service">Terms</a>
      </p>
    </div>

  </div>
</body>
</html>
`;
};

export const getMockEmailData = (): EmailData => ({
  displayName: 'John "Johnny" Doe',
  sanitized: {
    firstName: 'John',
    lastName: 'Doe',
    preferredName: 'Johnny',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    subject: 'Website Inquiry About Your Services',
    howDidYouHear: 'Search Engine',
    referrer: 'Google',
    message: `Hi Balance Kitchen Team,

I&apos;m very interested in learning more about your services. I found your website through a Google search and I&apos;m impressed by what I&apos;ve read so far.

I&apos;m currently looking for a reliable service provider and would love to schedule a consultation to discuss my needs in detail. I&apos;m particularly interested in:

• Your premium service offerings
• Pricing and packages
• Implementation timeline
• Support and maintenance

Please let me know when would be a good time to talk. I&apos;m available most weekdays after 2 PM EST.

Looking forward to hearing from you!

Best regards,
John Doe

P.S. Please mention this inquiry came from your website contact form.`,
    utm_source: 'google',
    utm_medium: 'organic',
    utm_campaign: 'spring_promo'
  },
  utmParts: ['utm_source: google', 'utm_medium: organic', 'utm_campaign: spring_promo']
});

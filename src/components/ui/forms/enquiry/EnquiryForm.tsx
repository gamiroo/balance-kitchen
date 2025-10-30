'use client';

import React, { useState, useEffect } from 'react';
import { CTAButton } from '../../CTAButton/CTAButton';
import styles from './EnquiryForm.module.css';

interface EnquiryFormProps {
  onSubmitSuccess?: () => void;
  onSubmitError?: () => void;
}

const HEAR_OPTIONS = [
  'Search Engine',
  'Social Media',
  'Friend / Family',
  'Google Ads',
  'Influencer / Blogger',
  'Event / Conference',
  'Online Forum / Community',
  'Other',
] as const;

type HearOption = (typeof HEAR_OPTIONS)[number];

type FormData = {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  subject: string;
  howDidYouHear: HearOption;
  referrer: string;
  message: string;
};

const MAX_MESSAGE_LENGTH = 500;

function isValidHearOption(value: string): value is HearOption {
  return (HEAR_OPTIONS as readonly string[]).includes(value);
}

// Define proper types for gtag function
interface GtagFunction {
  (command: string, eventName: string, parameters?: {
    event_category?: string;
    event_label?: string;
    [key: string]: unknown;
  }): void;
}

interface WindowWithGtag extends Window {
  gtag?: GtagFunction;
}

export const EnquiryForm: React.FC<EnquiryFormProps> = ({
  onSubmitSuccess,
  onSubmitError,
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    preferredName: '',
    email: '',
    phone: '',
    subject: 'Website Enquiry',
    howDidYouHear: HEAR_OPTIONS[0],
    referrer: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [messageLength, setMessageLength] = useState(0);
  const [serverError, setServerError] = useState<string>('');

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('enquiryForm');
      if (savedData) {
        const parsed = JSON.parse(savedData) as Partial<FormData>;
        const merged: FormData = {
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          preferredName: parsed.preferredName || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          subject: parsed.subject || 'Website Enquiry',
          howDidYouHear: isValidHearOption(parsed.howDidYouHear || '')
            ? (parsed.howDidYouHear as HearOption)
            : HEAR_OPTIONS[0],
          referrer: parsed.referrer || '',
          message: parsed.message || '',
        };
        setFormData(merged);
        setMessageLength(merged.message.length);
      }
    } catch {
      localStorage.removeItem('enquiryForm');
    }

    const firstInput = document.getElementById('firstName');
    firstInput?.focus();
  }, []);

  const validateForm = (data: FormData = formData) => {
    const newErrors: Record<string, string> = {};

    if (!data.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!data.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!data.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (data.message.length > MAX_MESSAGE_LENGTH) {
      newErrors.message = `Message must be ${MAX_MESSAGE_LENGTH} characters or less`;
    }

    if (!isValidHearOption(data.howDidYouHear)) {
      newErrors.howDidYouHear = 'Please select a valid option';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (serverError) {
      setServerError('');
    }

    try {
      const newData = { ...formData, [name]: value } as FormData;
      localStorage.setItem('enquiryForm', JSON.stringify(newData));
    } catch {
      // ignore
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, message: value }));
    setMessageLength(value.length);

    if (errors.message) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.message;
        return newErrors;
      });
    }

    try {
      const newData = { ...formData, message: value } as FormData;
      localStorage.setItem('enquiryForm', JSON.stringify(newData));
    } catch {
      // ignore
    }
  };

  const getUtmParam = (key: string): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    return new URLSearchParams(window.location.search).get(key) || undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setServerError('');

    try {
      // Properly type gtag calls
      if (typeof window !== 'undefined') {
        const windowWithGtag = window as WindowWithGtag;
        if (windowWithGtag.gtag) {
          windowWithGtag.gtag('event', 'form_start', {
            event_category: 'engagement',
            event_label: 'Enquiry Form',
          });
        }
      }

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        preferredName: formData.preferredName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject,
        howDidYouHear: formData.howDidYouHear,
        referrer: formData.referrer.trim(),
        message: formData.message.trim(),
        utm_source: getUtmParam('utm_source'),
        utm_medium: getUtmParam('utm_medium'),
        utm_campaign: getUtmParam('utm_campaign'),
      };

      console.log('Submitting enquiry:', payload);

      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          firstName: '',
          lastName: '',
          preferredName: '',
          email: '',
          phone: '',
          subject: 'Website Enquiry',
          howDidYouHear: HEAR_OPTIONS[0],
          referrer: '',
          message: '',
        });
        setMessageLength(0);
        localStorage.removeItem('enquiryForm');
        onSubmitSuccess?.();

        // Properly type gtag calls for successful submission
        if (typeof window !== 'undefined') {
          const windowWithGtag = window as WindowWithGtag;
          if (windowWithGtag.gtag) {
            windowWithGtag.gtag('event', 'form_submit', {
              event_category: 'engagement',
              event_label: 'Enquiry Form',
            });
          }
        }

        setTimeout(() => {
          setSubmitStatus('idle');
        }, 5000);
      } else {
        const errorData: { error?: string; message?: string } = await response.json().catch(() => ({}));
        console.error('Server responded with error:', errorData);
        
        setServerError(
          errorData.error || 
          errorData.message || 
          `Server error: ${response.status}`
        );
        setSubmitStatus('error');
        onSubmitError?.();
      }
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit form. Please check your connection and try again.';
      setServerError(errorMessage);
      setSubmitStatus('error');
      onSubmitError?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.form}
      aria-describedby="form-description"
      noValidate
    >
      <div id="form-description" className={styles.srOnly}>
        Required fields are marked with an asterisk (*)
      </div>

      <div className={styles.formGrid}>
        <div className={styles.leftColumn}>
          <div className={styles.subTitle}>Your details</div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.label}>
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className={`${styles.input} ${errors.firstName ? styles.invalid : ''}`}
                placeholder="Jane"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                autoComplete="given-name"
              />
              {errors.firstName && (
                <span id="firstName-error" className={styles.errorText}>
                  {errors.firstName}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.label}>
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className={`${styles.input} ${errors.lastName ? styles.invalid : ''}`}
                placeholder="Doe"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                autoComplete="family-name"
              />
              {errors.lastName && (
                <span id="lastName-error" className={styles.errorText}>
                  {errors.lastName}
                </span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="preferredName" className={styles.label}>
              Preferred Name <span className={styles.optionalLabel}>(optional)</span>
            </label>
            <input
              type="text"
              id="preferredName"
              name="preferredName"
              value={formData.preferredName}
              onChange={handleChange}
              className={styles.input}
              placeholder="Janey"
              autoComplete="nickname"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`${styles.input} ${errors.email ? styles.invalid : ''}`}
                placeholder="jane@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
              />
              {errors.email && (
                <span id="email-error" className={styles.errorText}>
                  {errors.email}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.label}>
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={styles.input}
                placeholder="+1 (555) 123-4567"
                autoComplete="tel"
              />
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.subTitle}>Your enquiry</div>

          <div className={styles.formGroup}>
            <label htmlFor="subject" className={styles.label}>
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={styles.input}
            >
              <option value="Website Enquiry">General Enquiry</option>
              <option value="Meal Plan">Meal Plan Information</option>
              <option value="Pricing">Pricing Question</option>
              <option value="Delivery">Delivery Inquiry</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="howDidYouHear" className={styles.label}>
              How Did You Hear About Us
            </label>
            <select
              id="howDidYouHear"
              name="howDidYouHear"
              value={formData.howDidYouHear}
              onChange={handleChange}
              className={`${styles.input} ${errors.howDidYouHear ? styles.invalid : ''}`}
              aria-invalid={!!errors.howDidYouHear}
              aria-describedby={errors.howDidYouHear ? 'howDidYouHear-error' : undefined}
            >
              {HEAR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.howDidYouHear && (
              <span id="howDidYouHear-error" className={styles.errorText}>
                {errors.howDidYouHear}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="referrer" className={styles.label}>
              Referrer
            </label>
            <input
              type="text"
              id="referrer"
              name="referrer"
              value={formData.referrer}
              onChange={handleChange}
              className={styles.input}
              placeholder="Who referred you?"
            />
            <div className={styles.helperText}>Send your referrer a thank you gift</div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message" className={styles.label}>
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleMessageChange}
              required
              rows={6}
              className={`${styles.textarea} ${errors.message ? styles.invalid : ''}`}
              placeholder="Tell us how we can help you..."
              aria-invalid={!!errors.message}
              aria-describedby={
                errors.message ? 'message-error' : undefined
              }
            />
            <div className={styles.charCounter}>
              {messageLength}/{MAX_MESSAGE_LENGTH} characters
            </div>
            {errors.message && (
              <span id="message-error" className={styles.errorText}>
                {errors.message}
              </span>
            )}
          </div>

          <div className={styles.rightActions}>
            {submitStatus === 'success' && (
              <div className={styles.successMessage} role="alert">
                Thank you! Your enquiry has been sent successfully. We&apos;ll get back
                to you soon.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className={styles.errorMessage} role="alert">
                <div style={{ marginBottom: '8px' }}>
                  {serverError || 'Sorry, there was an error sending your enquiry. Please try again.'}
                </div>
                <div className={styles.errorHelp}>
                  If the problem persists, please contact us directly at{' '}
                  <a 
                    href="mailto:hello@balancekitchen.com" 
                    style={{ color: '#991b1b', fontWeight: 600 }}
                  >
                    hello@balancekitchen.com
                  </a>
                </div>
              </div>
            )}

            <CTAButton
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              aria-label="Send enquiry"
            >
              {isSubmitting ? 'Sending...' : 'Send Enquiry'}
            </CTAButton>
          </div>
        </div>
      </div>
    </form>
  );
};

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './AccountManagerStep.module.css';
import { CTAButton } from 'components/ui/CTAButton/CTAButton';
import { Link } from 'lucide-react';

/* -----------------------------------------------------------------
   1️⃣  Chat data
   ----------------------------------------------------------------- */
type Message = {
  who: 'customer' | 'manager';
  text: string;
};

const mobileChat: Message[] = [
  { who: 'customer', text: 'Hi! I’m interested in a weekly plan.' },
  { who: 'manager',  text: 'Great! I’ll ask a few quick questions.' },
  { who: 'customer', text: 'Sure, go ahead.' },
];

/* -----------------------------------------------------------------
   2️⃣  Typing indicator
   ----------------------------------------------------------------- */
const TypingIndicator = () => (
  <div className={styles.typingIndicator}>
    <span />
    <span />
    <span />
  </div>
);

/* -----------------------------------------------------------------
   3️⃣  Device component (with typing animation)
   ----------------------------------------------------------------- */
type DeviceProps = {
  className: string;
  chat: Message[];
  frameSrc: string;
  businessName?: string;
  startChat: boolean;
  isVisible: boolean;
};

type MessageState = {
  status: 'waiting' | 'typing' | 'typed';
  typedText: string;
  showCaret: boolean;
};

const Device = ({ 
  className, 
  chat, 
  frameSrc, 
  businessName = "Balance Kitchen",
  startChat,
  isVisible
}: DeviceProps) => {
  const [messages, setMessages] = useState<MessageState[]>(
    chat.map(() => ({
      status: 'waiting',
      typedText: '',
      showCaret: false
    }))
  );

  useEffect(() => {
    if (!startChat) return;

    const timers: NodeJS.Timeout[] = [];

    // Handle first message typing
    const firstMessageTimer = setTimeout(() => {
      setMessages(prev => {
        const next = [...prev];
        next[0] = { 
          status: 'typed', 
          typedText: '', 
          showCaret: true 
        };
        return next;
      });

      // Type out the first message character by character
      let charIndex = 0;
      const typeNextChar = () => {
        if (charIndex < chat[0].text.length) {
          setMessages(prev => {
            const next = [...prev];
            next[0] = { 
              ...next[0], 
              typedText: chat[0].text.substring(0, charIndex + 1)
            };
            return next;
          });
          charIndex++;
          setTimeout(typeNextChar, 50); // 50ms per character
        } else {
          // Hide caret when done
          const hideCaretTimer = setTimeout(() => {
            setMessages(prev => {
              const next = [...prev];
              next[0] = { ...next[0], showCaret: false };
              return next;
            });
          }, 300);
          timers.push(hideCaretTimer);
        }
      };
      typeNextChar();
    }, 500); // Start first message after 500ms
    timers.push(firstMessageTimer);

    // Handle subsequent messages
    chat.forEach((msg, i) => {
      if (i === 0) return;

      // Show typing indicator after delay
      const typingTimer = setTimeout(() => {
        setMessages(prev => {
          const next = [...prev];
          next[i] = { status: 'typing', typedText: '', showCaret: false };
          return next;
        });
      }, i * 3000 + 500); // 3 seconds between each message sequence + 500ms offset
      timers.push(typingTimer);

      // Start typing the message
      const typeMessageTimer = setTimeout(() => {
        setMessages(prev => {
          const next = [...prev];
          next[i] = { 
            status: 'typed', 
            typedText: '', 
            showCaret: true 
          };
          return next;
        });

        // Type out the message character by character
        let charIndex = 0;
        const typeNextChar = () => {
          if (charIndex < msg.text.length) {
            setMessages(prev => {
              const next = [...prev];
              next[i] = { 
                ...next[i], 
                typedText: msg.text.substring(0, charIndex + 1)
              };
              return next;
            });
            charIndex++;
            setTimeout(typeNextChar, 50); // 50ms per character
          } else {
            // Hide caret when done
            const hideCaretTimer = setTimeout(() => {
              setMessages(prev => {
                const next = [...prev];
                next[i] = { ...next[i], showCaret: false };
                return next;
              });
            }, 300);
            timers.push(hideCaretTimer);
          }
        };
        typeNextChar();
      }, i * 3000 + 1500); // 1 second after typing indicator + 500ms offset
      timers.push(typeMessageTimer);
    });

    return () => timers.forEach(clearTimeout);
  }, [startChat, chat]);

  // Simple SVG icons
  const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.chatInputIcon}>
      <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
      <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
    </svg>
  );

  const PaperclipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.chatInputIcon}>
      <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 0-1.06-1.06l-7.693 7.693a2.25 2.25 0 1 1-3.182-3.182L15.859 3.66a2.25 2.25 0 0 1 3.182 0Zm-15.227 15.227a.75.75 0 0 0 1.06 0L18.97 5.71a.75.75 0 0 0-1.06-1.06L4.743 17.819a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" />
    </svg>
  );

  const SendIcon = () => (
    <Image
      src="/assets/icons/arrow-up.svg"
      alt="Send message"
      width={16}
      height={16}
      className={styles.chatSendIcon}
    />
  );

  return (
    <div className={`${styles.deviceWrapper} ${className} ${isVisible ? styles.deviceVisible : ''}`}>
      <Image
        src={frameSrc}
        alt="Device frame"
        fill
        className={styles.frameImg}
        priority
      />

      <div className={styles.chatOverlay}>
        <div className={styles.chatHeader}>
          <Image
            src="/assets/manager-avatar.svg"
            alt={`${businessName} avatar`}
            width={32}
            height={32}
            className={styles.chatHeaderAvatar}
          />
          <h3 className={styles.chatHeaderTitle}>{businessName}</h3>
        </div>

        <div className={styles.chatWrapper}>
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`${styles.messageRow} ${
                msg.who === 'customer' ? styles.customerRow : styles.managerRow
              }`}
            >
              {/* Avatar - only show when typing or typed */}
              {messages[i].status !== 'waiting' ? (
                <div>
                  <Image
                    src={
                      msg.who === 'customer'
                        ? '/assets/customer-avatar.svg'
                        : '/assets/manager-avatar.svg'
                    }
                    alt={msg.who}
                    width={22}
                    height={22}
                    className={styles.avatar}
                  />
                </div>
              ) : (
                <div style={{ width: 22, height: 22, visibility: 'hidden' }} />
              )}

              <div>
                {messages[i].status === 'typed' ? (
                  // Show message with bubble and typing animation
                  <div
                    className={`${styles.bubble} ${
                      msg.who === 'customer'
                        ? styles.bubbleCustomer
                        : styles.bubbleManager
                    }`}
                  >
                    <span className={styles.typingLine}>
                      {messages[i].typedText}
                      {messages[i].showCaret && (
                        <span className={styles.typingCaret} />
                      )}
                    </span>
                  </div>
                ) : messages[i].status === 'typing' ? (
                  // Show typing indicator WITHOUT bubble
                  <div>
                    <TypingIndicator />
                  </div>
                ) : (
                  // Hide completely when waiting
                  <div style={{ display: 'none' }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input Box - Illustrative Only */}
        <div className={styles.chatInputContainer}>
          <div className={styles.chatInputWrapper}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Type a message..."
              value="" // Keep empty for illustration
              readOnly
            />
          </div>
          <div className={styles.chatIconsGroup}>
            <button className={styles.iconButton} aria-label="Voice message">
              <MicIcon />
            </button>
            <button className={styles.iconButton} aria-label="Attach file">
              <PaperclipIcon />
            </button>
          </div>
          <button className={styles.chatSendButton} aria-label="Send message">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

/* -----------------------------------------------------------------
   4️⃣  User Avatar Component with entrance animation
   ----------------------------------------------------------------- */
type UserAvatarProps = {
  src: string;
  alt: string;
  className?: string;
  isVisible: boolean;
};

const UserAvatar = ({ src, alt, className, isVisible }: UserAvatarProps) => (
  <div 
    className={`${styles.userAvatar} ${className} ${isVisible ? styles.avatarVisible : ''}`}
  >
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      loading="lazy"
      className={styles.userAvatarImage}
    />
  </div>
);

/* -----------------------------------------------------------------
   5️⃣  Main component with entrance animations
   ----------------------------------------------------------------- */
export const AccountManagerStep = () => {
  const [chatStarted, setChatStarted] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Detect when section comes into viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          // Start chat after a small delay to allow entrance animations to complete
          setTimeout(() => {
            setChatStarted(true);
          }, 800);
        }
      },
      { threshold: 0.2 } // Trigger when 20% of section is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section 
      className={`${styles.stepContainer} ${sectionVisible ? styles.sectionVisible : ''}`}
      ref={sectionRef}
    >
      {/* ----- TEXT CONTENT (Left side) ----- */}
      <div className={`${styles.textContent} ${sectionVisible ? styles.textVisible : ''}`}>
        <h2 className={`${styles.stepTitle} ${sectionVisible ? styles.titleVisible : ''}`}>
          Step 1 – Your Account Manager
        </h2>
        <p className={`${styles.stepCopy} ${sectionVisible ? styles.copyVisible : ''}`}>
          When you sign up, a dedicated Balance Kitchen Account Manager
          reaches out within 24 hours. They&apos;ll ask a few quick questions,
          suggest the perfect macro-balanced plan and help you set up
          your first delivery. <a href="#"> Learn more</a>
        </p>
        <div className={sectionVisible ? styles.buttonVisible : ''}>
          <CTAButton onClick={() => setChatStarted(true)}>Chat with an Account Manager</CTAButton>
        </div>
      </div>

      {/* ----- MOBILE DEVICE WITH USER AVATARS (Right side) ----- */}
      <div className={`${styles.devicesSection} ${sectionVisible ? styles.devicesVisible : ''}`}>
        <div className={styles.devicesOverlapContainer}>
          {/* User Avatars with staggered entrance */}
          <UserAvatar 
            src="/images/message-users/user1.jpg" 
            alt="User 1" 
            className={styles.user1}
            isVisible={sectionVisible}
          />
          <UserAvatar 
            src="/images/message-users/user2.jpg" 
            alt="User 2" 
            className={styles.user2}
            isVisible={sectionVisible}
          />
          <UserAvatar 
            src="/images/message-users/user3.jpg" 
            alt="User 3" 
            className={styles.user3}
            isVisible={sectionVisible}
          />
          <UserAvatar 
            src="/images/message-users/user4.jpg" 
            alt="User 4" 
            className={styles.user4}
            isVisible={sectionVisible}
          />
          <UserAvatar 
            src="/images/message-users/user5.jpg" 
            alt="User 5" 
            className={styles.user5}
            isVisible={sectionVisible}
          />

          {/* Mobile Device */}
          <Device
            className={styles.mobile}
            chat={mobileChat}
            frameSrc="/assets/mobile-1.svg"
            businessName="Balance Kitchen"
            startChat={chatStarted}
            isVisible={sectionVisible}
          />
        </div>
      </div>
    </section>
  );
};

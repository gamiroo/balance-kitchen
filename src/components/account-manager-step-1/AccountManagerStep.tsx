'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  Variants,
  useAnimation,
  useInView,
} from 'framer-motion';
import Image from 'next/image';
import styles from './AccountManagerStep.module.css';
import { CTAButton } from 'components/CTAButton';

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

const tabletChat: Message[] = [
  {
    who: 'customer',
    text: 'Hey – can you tell me about the macro options?',
  },
  {
    who: 'manager',
    text: 'Absolutely! We have 30 % protein, 40 % carbs, 30 % fibre.',
  },
  { who: 'customer', text: 'Sounds perfect. How do I get started?' },
];

const desktopChat: Message[] = [
  { who: 'customer', text: 'Do you offer a personal‑chef service?' },
  {
    who: 'manager',
    text: 'Yes – for premium packs we assign a chef for extra customisation.',
  },
  { who: 'customer', text: 'Awesome, I’ll add that to my order.' },
];

/* -----------------------------------------------------------------
   2️⃣  Framer-Motion variants
   ----------------------------------------------------------------- */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.5, when: 'beforeChildren' },
  },
};

const bubbleVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const letterVariant: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.05 } },
};

const typingLineVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.04,
    },
  },
};

/* -----------------------------------------------------------------
   3️⃣  Typing indicator
   ----------------------------------------------------------------- */
const TypingIndicator = () => (
  <div className={styles.typingIndicator}>
    <span />
    <span />
    <span />
  </div>
);

/* -----------------------------------------------------------------
   4️⃣  Device component
   ----------------------------------------------------------------- */
type DeviceProps = {
  className: string;
  chat: Message[];
  frameSrc: string;
  businessName?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
};

type BubbleInfo = {
  status: 'waiting' | 'typing' | 'typed';
  caret: boolean;
};

const Device = ({ 
  className, 
  chat, 
  frameSrc, 
  businessName = "Balance Kitchen",
  deviceType
}: DeviceProps) => {
  const [bubbles, setBubbles] = useState<BubbleInfo[]>(
    chat.map((_, i) => ({
      status: i === 0 ? 'typed' : 'waiting',
      caret: i === 0,
    }))
  );

  const hideCaret = (idx: number, length: number) => {
    const duration = length * 50 + 300;
    setTimeout(() => {
      setBubbles((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], caret: false };
        return next;
      });
    }, duration);
  };

  useEffect(() => {
    hideCaret(0, chat[0].text.length);
  }, [chat]);

  useEffect(() => {
    const totalSlot = 3500;
    const typingPause = 500;

    const timers: NodeJS.Timeout[] = [];

    chat.forEach((_msg, i) => {
      if (i === 0) return;
      const start = i * totalSlot;

      const toTyping = setTimeout(() => {
        setBubbles((prev) => {
          const next = [...prev];
          next[i] = { status: 'typing', caret: false };
          return next;
        });
      }, start);
      timers.push(toTyping);

      const toTyped = setTimeout(() => {
        setBubbles((prev) => {
          const next = [...prev];
          next[i] = { status: 'typed', caret: true };
          return next;
        });
        hideCaret(i, chat[i].text.length);
      }, start + typingPause);
      timers.push(toTyped);
    });

    return () => timers.forEach(clearTimeout);
  }, [chat]);

  return (
    <div className={`${styles.deviceWrapper} ${className} ${styles[deviceType]}`}>
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {chat.map((msg, i) => (
              <div
                key={i}
                className={`${styles.messageRow} ${
                  msg.who === 'customer' ? styles.customerRow : styles.managerRow
                }`}
              >
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

                <motion.div
                  className={`${styles.bubble} ${
                    msg.who === 'customer'
                      ? styles.bubbleCustomer
                      : styles.bubbleManager
                  }`}
                  variants={bubbleVariants}
                >
                  {bubbles[i].status === 'typed' ? (
                    <motion.span
                      className={styles.typingLine}
                      variants={typingLineVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {msg.text.split('').map((ch, idx) => (
                        <motion.span key={idx} variants={letterVariant}>
                          {ch}
                        </motion.span>
                      ))}
                      {bubbles[i].caret && (
                        <span className={styles.typingCaret} />
                      )}
                    </motion.span>
                  ) : bubbles[i].status === 'typing' ? (
                    <TypingIndicator />
                  ) : null}
                </motion.div>
              </div>
            ))}

            <motion.div
              className={styles.typing}
              variants={bubbleVariants}
              initial="hidden"
              animate="visible"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* -----------------------------------------------------------------
   5️⃣  Main component
   ----------------------------------------------------------------- */
export const AccountManagerStep = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.2, once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) void controls.start('visible');
  }, [inView, controls]);

  return (
    <section className={styles.stepContainer} ref={containerRef}>
      {/* ----- TEXT CONTENT (Left side) ----- */}
      <div className={styles.textContent}>
        <h2 className={styles.stepTitle}>Step 1 – Your Account Manager</h2>
        <p className={styles.stepCopy}>
          When you sign up, a dedicated Balance Kitchen Account Manager
          reaches out within 24 hours. They&apos;ll ask a few quick questions,
          suggest the perfect macro-balanced plan and help you set up
          your first delivery.
        </p>
        <p className={styles.stepCopy}>
          See how the conversation flows seamlessly across all your devices –
          from mobile to desktop, your account manager is always available.
        </p>
        <CTAButton>Speak to an Account Manager</CTAButton>
      </div>

      {/* ----- OVERLAPPING DEVICES SECTION (Right side) ----- */}
      <div className={styles.devicesSection}>
        <div className={styles.devicesOverlapContainer}>
          <Device
            className={styles.desktop}
            chat={desktopChat}
            frameSrc="/assets/desktop-1.svg"
            businessName="Balance Kitchen"
            deviceType="desktop"
          />
          <Device
            className={styles.tablet}
            chat={tabletChat}
            frameSrc="/assets/tablet-1.svg"
            businessName="Balance Kitchen"
            deviceType="tablet"
          />
          <Device
            className={styles.mobile}
            chat={mobileChat}
            frameSrc="/assets/mobile-1.svg"
            businessName="Balance Kitchen"
            deviceType="mobile"
          />
        </div>
      </div>
    </section>
  );
};

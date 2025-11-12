'use client';

import { useState, useEffect, JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../menu/page.module.css';
import legalStyles from './legalContent.module.css';

/* -----------------------------------------------------------------
   1️⃣  Copy‑paste the pure‑HTML of each document **as a JSX fragment**.
   ----------------------------------------------------------------- */
const privacyContent = (
  <>
    <h1>Privacy Policy</h1>

  <p>Effective date: <strong>9 October 2025</strong></p>

  <h2>1. Who we are</h2>
  <p>
    Balance Kitchen Pty Ltd (ABN <strong>xx xxx xxx xxx</strong>)  
    24 Network Place, Richlands QLD 4077, Australia (the “Company”, “we”, “our”, “us”).  
    Our contact details: <a href="mailto:privacy@balancekitchen.com.au">privacy@balancekitchen.com.au</a> | Phone: 07 xxx xxx xxx.
  </p>

  <h2>2. What personal information we collect</h2>
  <p>We may collect, store, and use the following categories of personal information about you:</p>
  <ul>
    <li><strong>Identity data:</strong> name, date of birth, gender.</li>
    <li><strong>Contact data:</strong> email address, phone number, postal address.</li>
    <li><strong>Transaction data:</strong> order details, payment card information (only the last 4 digits are stored), delivery preferences.</li>
    <li><strong>Behavioural data:</strong> browsing activity on our site (pages visited, clicks, search terms) via cookies and analytics.</li>
    <li><strong>Health‑related data (optional):</strong> any dietary restrictions, allergies, macro‑tracking information you voluntarily provide to customise meals.</li>
  </ul>

  <h2>3. How we collect information</h2>
  <ul>
    <li>When you create or update an account on <strong>balancekitchen.com.au</strong>.</li>
    <li>When you place an order (including checkout, payment and delivery details).</li>
    <li>Through our mobile app or chatbot (if applicable).</li>
    <li>Via cookies, web‑beacons and similar technologies (see our <Link href="/legal#cookies"  className={styles.link}>Cookie Policy</Link>).</li>
    <li>When you contact us (e‑mail, phone, live‑chat, social media).</li>
  </ul>

  <h2>4. Why we use your personal information</h2>
  <p>We use the information for the following purposes (identified as “APP 6” purposes under Australian law):</p>
  <ol>
    <li>Process and fulfil your orders (including delivery, invoicing and customer support).</li>
    <li>Personalise meal recommendations, macro tracking, and dietary advice.</li>
    <li>Send transactional communications (order confirmations, shipping updates, receipts).</li>
    <li>Send marketing and promotional material (only if you have opted‑in). You can unsubscribe at any time via the link in each email.</li>
    <li>Improve our website, services and product development (analytics, A/B testing, surveys).</li>
    <li>Comply with legal obligations (tax, customs, anti‑money‑laundering, health‑regulation).</li>
    <li>Detect, prevent, or address fraud, security breaches, or technical issues.</li>
  </ol>

  <h2>5. Legal bases for processing (GDPR)</h2>
  <p>If you are located in the European Economic Area (EEA), we rely on the following lawful bases:</p>
  <ul>
    <li><strong>Contract performance:</strong> to fulfil the meal‑delivery contract you entered into.</li>
    <li><strong>Legitimate interests:</strong> to improve our services, fraud prevention, and market research (balanced against your rights).</li>
    <li><strong>Consent:</strong> for any marketing communications you explicitly opt‑in to receive.</li>
  </ul>

  <h2>6. Disclosure of personal information</h2>
  <p>We may disclose your personal information to:</p>
  <ul>
    <li>Service providers that process orders on our behalf (payment gateway, courier partners, cloud hosting, email‑marketing platforms). All such parties are required to maintain the same level of privacy protection.</li>
    <li>Government agencies, regulators, or law‑enforcement when required by law (e.g., tax, food‑safety, or criminal investigations).</li>
    <li>Potential buyers or investors in the event of a merger, acquisition or sale of assets, provided they agree to maintain the same privacy obligations.</li>
  </ul>

  <h2>7. International data transfers</h2>
  <p>Some service providers are located outside Australia (e.g., cloud services in the United States, payment processors in the EU). We ensure that any cross‑border transfer is protected by:</p>
  <ul>
    <li>Standard contractual clauses approved by the Australian OAIC, or</li>
    <li>Privacy Shield‑equivalent frameworks, or</li>
    <li>Explicit consent from you (for marketing‑related transfers).</li>
  </ul>

  <h2>8. Data security</h2>
  <p>We implement technical and organisational measures to protect your data, including:</p>
  <ul>
    <li>SSL/TLS encryption for all data transmitted between your browser and our servers.</li>
    <li>Encrypted storage of payment data (PCI‑DSS compliant).</li>
    <li>Restricted access – only authorised staff can view personal information, and they are bound by confidentiality agreements.</li>
    <li>Regular security audits and vulnerability testing.</li>
  </ul>

  <h2>9. Data retention</h2>
  <p>We retain personal information only as long as necessary:</p>
  <ul>
    <li>Order‑related data – retained for a minimum of 7 years to satisfy tax and accounting requirements.</li>
    <li>Marketing database – retained until you unsubscribe or request deletion.</li>
    <li>Health‑related preferences – retained for 3 years after the last order, unless you ask us to delete them sooner.</li>
  </ul>

  <h2>10. Your rights</h2>
  <p>Under the Australian Privacy Principles (and the EU GDPR, where applicable) you have the right to:</p>
  <ul>
    <li>Access the personal information we hold about you.</li>
    <li>Correct any inaccurate or incomplete information.</li>
    <li>Request deletion (subject to legal obligations to keep certain records).</li>
    <li>Object to direct marketing (you can opt‑out by clicking the “unsubscribe” link in any marketing email).</li>
    <li>Withdraw consent for processing that relies on consent.</li>
    <li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC) if you think we have breached the Privacy Act.</li>
  </ul>
  <p>To exercise any of these rights, please email us at <a href="mailto:privacy@balancekitchen.com.au">privacy@balancekitchen.com.au</a>.</p>

  <h2>11. Cookies & tracking technologies</h2>
  <p>Our site uses cookies to improve your experience and for analytics. Please see our separate <a href="/cookie-policy">Cookie Policy</a> for full details.</p>

  <h2>12. Changes to this Privacy Policy</h2>
  <p>We may update this policy from time to time. The “Effective date” at the top will be revised, and a notice will be posted on our website. We encourage you to review it periodically.</p>

  <h2>13. Contact us</h2>
  <p>If you have any questions or concerns about this Privacy Policy, please contact our Privacy Officer:</p>
  <address>
    Balance Kitchen Pty Ltd – Privacy Officer<br />
    24 Network Place, Richlands QLD 4077, Australia<br />
    Email: <a href="mailto:privacy@balancekitchen.com.au">privacy@balancekitchen.com.au</a><br />
    Phone: 07 xxx xxx xxx
  </address>
  </>
) as JSX.Element;

const termsContent = (
  <>
    <h1>Terms & Conditions</h1>

<p>Effective date: <strong>9 October 2025</strong></p>

<h2>1. Introduction</h2>
<p>These Terms & Conditions (“Terms”) govern your use of the website <strong>balancekitchen.com.au</strong> (the “Site”) and any services, meals, or products you order from Balance Kitchen Pty Ltd (ABN xx xxx xxx xxx, “Balance Kitchen”, “we”, “us”, “our”). By accessing the Site or placing an order you agree to be bound by these Terms.</p>

<h2>2. Eligibility</h2>
<p>You must be at least 18 years old and capable of entering into a legally binding contract to use our services. By ordering you confirm that you meet these requirements.</p>

<h2>3. Orders & Pricing</h2>
<ul>
  <li>All prices are shown in Australian Dollars (A$) and include GST unless otherwise stated.</li>
  <li>Prices are subject to change at any time, but any price change will not affect orders that have already been confirmed.</li>
  <li>We reserve the right to cancel or refuse any order for reasons including but not limited to: insufficient stock, suspected fraud, or violation of these Terms.</li>
  <li>Custom meals (“CustomPack” options) are priced on a per‑meal basis and may vary depending on chosen ingredients; the total price will be displayed before checkout.</li>
</ul>

<h2>4. Payment</h2>
<ul>
  <li>We accept major credit cards (Visa, Mastercard, American Express) and PayPal. All payments are processed securely via a PCI‑DSS compliant gateway.</li>
  <li>Payment is collected at the time of order placement.</li>
  <li>If a payment is declined, we will contact you to arrange an alternative method. Unpaid orders may be cancelled.</li>
</ul>

<h2>5. Delivery</h2>
<ul>
  <li>Delivery windows are Sunday – Thursday, with a maximum of two deliveries per week per customer. Delivery dates and times are displayed at checkout.</li>
  <li>We deliver within a 30 km radius of 24 Network Place, Richlands QLD 4077 (≈30,000 households). Delivery outside this zone is not currently offered.</li>
  <li>All meals are delivered chilled (≤ 5 °C) in insulated, compostable packaging. You must store the meals in a refrigerator (≤ 4 °C) and consume them within the “use‑by” date printed on the label.</li>
  <li>If a delivery fails because the recipient was not home, gave an incorrect address, or refused the package, a re‑delivery fee of A$15 may apply.</li>
</ul>

<h2>6. Subscription & Cancellation</h2>
<ul>
  <li>Most of our products are sold on a subscription basis (weekly or fortnightly). You may pause, skip, or cancel your subscription at any time via your account dashboard.</li>
  <li>To cancel a delivery, you must do so at least <strong>24 hours</strong> before the scheduled dispatch time. Cancellations made after that point will be charged in full.</li>
  <li>When you cancel, any prepaid balance will be retained as a credit toward a future order, unless you request a refund (see Section 9).</li>
</ul>

<h2>7. Refunds & Returns</h2>
<ul>
  <li>All meals are **non‑returnable** for health‑safety reasons. If you receive a damaged or incorrect order, contact us within <strong>48 hours</strong> of receipt and we will either (a) re‑ship the missing items at no cost, or (b) issue a full refund for the affected meals.</li>
  <li>Refunds are processed to the original payment method within 5‑10 business days.</li>
  <li>Cancellation of a subscription before the first delivery will be refunded in full (minus any administration fee of A$10, if applicable).</li>
</ul>

<h2>8. Health & Dietary Information</h2>
<ul>
  <li>All meals are prepared according to the nutrition specifications provided by our in‑house dietitian. However, we do not guarantee that meals are free from allergens unless explicitly marked “Allergen‑Free”.</li>
  <li>It is the customer’s responsibility to inform us of any food allergies, intolerances, or medical conditions that could be affected by the meals. We will make reasonable efforts to accommodate, but cannot guarantee absolute safety.</li>
  <li>The information on macro‑tracking and nutritional content is for general guidance only and should not replace professional medical advice.</li>
</ul>

<h2>9. Intellectual Property</h2>
<ul>
  <li>All content on the Site (text, images, logos, designs, recipe database, software) is owned by Balance Kitchen or licensed to us and is protected by Australian and international copyright, trademark, and other IP laws.</li>
  <li>You may use the Site for personal, non‑commercial purposes only. Re‑selling, copying, or distributing any of our content without written permission is prohibited.</li>
</ul>

<h2>10. Limitation of Liability</h2>
<ul>
  <li>To the maximum extent permitted by law, Balance Kitchen shall not be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of profit, revenue, data or use, arising out of or related to your use of the Site or our services.</li>
  <li>Our total liability for any claim shall not exceed the amount you paid for the specific meals giving rise to the claim.</li>
  <li>This limitation applies whether the claim is based on contract, tort (including negligence), statutory duty, or any other legal theory.</li>
</ul>

<h2>11. Indemnity</h2>
<p>You agree to indemnify, defend and hold harmless Balance Kitchen, its directors, officers, employees, and agents from any third‑party claim, loss, liability or expense (including reasonable legal fees) arising out of your breach of these Terms, your misuse of the Site, or your violation of any law.</p>

<h2>12. Governing Law & Dispute Resolution</h2>
<ul>
  <li>These Terms are governed by the laws of Queensland, Australia, and the parties submit to the exclusive jurisdiction of the Queensland Courts.</li>
  <li>Any dispute shall first be attempted to be resolved through good‑faith negotiation. If unresolved within 30 days, the parties may agree to mediation administered by the Australian Centre for International Commercial Arbitration (ACICA) before proceeding to court.</li>
</ul>

<h2>13. Changes to the Terms</h2>
<p>We may update these Terms from time to time. The most recent version will be posted on the Site with a revised “Effective date”. Continued use of the Site after such changes constitutes acceptance of the new Terms.</p>

<h2>14. Contact Details</h2>
<p>If you have any questions about these Terms, please contact us at:</p>
<address>
  Balance Kitchen Pty Ltd – Customer Relations<br />
  24 Network Place, Richlands QLD 4077, Australia<br />
  Email: <a href="mailto:support@balancekitchen.com.au">support@balancekitchen.com.au</a><br />
  Phone: 07 xxx xxx xxx
</address>

  </>
) as JSX.Element;

const cookieContent = (
  <>
    <h1>Cookie Policy</h1>

<p><strong>Effective date:</strong> <strong>9 October 2025</strong></p>

<h2>1. What are cookies?</h2>
<p>
  Cookies are small text files that are stored on your device (computer, tablet or phone) when you visit a website. They allow the site to remember information about your visit (e.g., language preference, login status, items in a shopping basket) and help us improve the service you receive.
</p>

<h2>2. Types of cookies we use</h2>
<ul>
  <li>
    <strong>Essential / strictly necessary cookies</strong> – enable basic functions such as page navigation, secure login and the checkout process. Without these cookies the site would not work correctly.
  </li>
  <li>
    <strong>Performance & analytics cookies</strong> – let us see how visitors use Balance Kitchen (e.g., which pages are most popular, how long a session lasts). We use <em>Google Analytics 4</em> for this purpose. All data is anonymised; we never store personal identifiers.
  </li>
  <li>
    <strong>Functionality cookies</strong> – remember your preferences (e.g., chosen language, the last delivery postcode you entered) so you don’t have to re‑enter them each visit.
  </li>
  <li>
    <strong>Advertising / targeting cookies</strong> – are set by third‑party platforms (Google Ads, Facebook/Meta, TikTok, etc.) when you click on an ad that leads to our site. They help measure the effectiveness of marketing campaigns and may show you personalised ads on other sites.
  </li>
</ul>

<h2>3. How we store and access cookies</h2>
<p>
  The first time you land on <code>balancekitchen.com.au</code> we place a short “consent banner”. Until you make a choice, only the **essential** cookies are set. When you click **“Accept all”** we also enable the performance, functionality and advertising cookies. You can always change your preferences later via the link in the footer.
</p>

<h2>4. Third‑party cookies</h2>
<p>
  We embed content from the following external services that may set their own cookies:
</p>
<ul>
  <li>Google (Analytics, Tag Manager, reCAPTCHA)</li>
  <li>Facebook / Meta (Pixel)</li>
  <li>Instagram / TikTok (embedded posts)</li>
  <li>Stripe (payment checkout)</li>
</ul>
<p>
  These providers have their own privacy policies; we do not control how they use the cookies they set.
</p>

<h2>5. Your choices</h2>
<p>You can manage cookies in three ways:</p>
<ol>
  <li><strong>Via the banner</strong> – click “Accept all”, “Reject non‑essential”, or “Manage preferences”.</li>
  <li><strong>Through your browser settings</strong> – every modern browser lets you block, delete, or view cookies. See:
    <ul>
      <li>Chrome: Settings → Privacy & security → Cookies and other site data</li>
      <li>Firefox: Preferences → Privacy & Security → Cookies and Site Data</li>
      <li>Safari: Preferences → Privacy → Cookies and website data</li>
      <li>Edge: Settings → Cookies & site permissions → Manage and delete cookies</li>
    </ul>
  </li>
  <li><strong>By using the “Do Not Track” (DNT) header</strong> – our analytics platform respects DNT and will not set performance cookies when that flag is sent.</li>
</ol>

<h2>6. How long we keep cookies</h2>
<p>
  <strong>Session cookies</strong> (essential) expire when you close the browser.  
  <strong>Persistent cookies</strong> (analytics, advertising, functionality) have a lifespan of 30 days to 2 years, depending on the purpose.
</p>

<h2>7. Changes to this Cookie Policy</h2>
<p>
  We may update this policy from time to time. Any changes will be posted on this page with a new “Effective date”. If we introduce a new category of cookie we will update the banner to obtain fresh consent.
</p>

<h2>8. Contact us</h2>
<p>
  If you have any questions about our use of cookies, please get in touch: <br />
  <strong>[Company Name] – Balance Kitchen Pty Ltd</strong> <br />
  ABN <strong>[ABN]</strong> <br />
  <strong>[Address – street, suburb, QLD, postcode]</strong> <br />
  Phone: <strong>[Phone]</strong> <br />
  Email: <a href="mailto:privacy@balancekitchen.com.au">privacy@balancekitchen.com.au</a>
</p>

  </>
) as JSX.Element;

const refundContent = (
  <>
    <h1>Refund &amp; Delivery Policy</h1>

<p><strong>Effective date:</strong> <strong>9 October 2025</strong></p>

<h2>1. Overview</h2>
<p>
  This policy explains how Balance Kitchen (ABN <strong>[ABN]</strong>) handles order cancellations, refunds, and the delivery of our prepared meals. By placing an order you agree to the terms set out below.
</p>

<h2>2. Delivery Area & Schedule</h2>
<ul>
  <li>
    <strong>Coverage:</strong> We deliver to any address within a <strong>30 km radius</strong> of our kitchen at <strong>24 Network Place, Richlands QLD 4077</strong> (approximately 30,000 households). If you are outside this zone you can still use our “pick‑up” option at the kitchen.
  </li>
  <li>
    <strong>Delivery days:</strong> Orders are dispatched <strong>Sunday – Thursday evenings</strong>. The exact time window (e.g., 5‑pm – 7‑pm) is shown at checkout and confirmed in the order confirmation email.
  </li>
  <li>
    <strong>Delivery method:</strong> Insulated, temperature‑controlled vans owned by Balance Kitchen. If a route becomes over‑booked we may partner with a third‑party courier (e.g., Dasher or local courier) – the service level remains the same.
  </li>
</ul>

<h2>3. Order Confirmation & Tracking</h2>
<p>
  After you complete checkout you will receive an order confirmation email containing:
</p>
<ul>
  <li>Order number</li>
  <li>Items, quantities, and total price</li>
  <li>Scheduled delivery date & time‑window</li>
  <li>Live tracking link (via our partner “TrackMyMeal” system)</li>
</ul>
<p>
  Please check the details carefully. If any information is wrong, contact us <strong>within 2 hours</strong> of receiving the email so we can amend the dispatch.
</p>

<h2>4. Cancellation & Pausing Subscriptions</h2>
<ol>
  <li>
    <strong>Standard subscription (weekly / fortnightly):</strong> You may pause or cancel any upcoming delivery <strong>up to 24 hours before the scheduled dispatch</strong>. After that cutoff the order will be processed and billed.
  </li>
  <li>
    <strong>One‑off / à‑la‑carte orders:</strong> Can be cancelled <strong>up to 2 hours before dispatch</strong>. After that the order is considered final.
  </li>
  <li>
    <strong>How to cancel / pause:</strong> Log in to your account → “My Subscriptions” → “Cancel / Pause”. You will receive a confirmation email.
  </li>
  <li>
    <strong>Refunds for cancelled subscriptions:</strong> If you cancel before the dispatch cutoff, the prepaid amount for the pending delivery is refunded to the original payment method within 5‑10 business days. No refund is issued for meals that have already been dispatched.
  </li>
</ol>

<h2>5. Refunds for Faulty / Incorrect Orders</h2>
<p>
  We take food safety and quality very seriously. If you receive a meal that is damaged, the wrong item, or appears unsafe:
</p>
<ol>
  <li>Contact us **within 48 hours** of delivery via <a href="mailto:support@balancekitchen.com.au">support@balancekitchen.com.au</a> or the “Help” button in the app.</li>
  <li>Provide the order number, a brief description of the issue, and (if possible) a photo of the problem.</li>
  <li>We will investigate and, if the claim is valid, either (a) re‑ship the correct meals free of charge, or (b) issue a full refund for the affected items.</li>
</ol>
<p>
  Refunds are processed to the original payment method and should appear within 5‑10 business days.
</p>

<h2>6. Late or Missed Deliveries</h2>
<ul>
  <li>
    <strong>Typical delivery window:</strong> 1‑2 hours. If a driver is delayed due to traffic or weather, you will receive an SMS/email update with a revised window.
  </li>
  <li>
    <strong>Missed delivery (no one at the address):</strong> The driver will leave the package in a safe, insulated location (e.g., a porch, garage) and record a photo proof. If you truly cannot receive the order (e.g., you were away for the whole window), contact us within 24 hours to arrange a redelivery or a refund for the undelivered meals.
  </li>
  <li>
    <strong>Extreme weather or force‑majeure:</strong> In the event of a natural disaster, severe storm, or any circumstance beyond our reasonable control, delivery may be delayed or temporarily suspended. We will notify affected customers as soon as possible and offer a pro‑rated refund or a credit for the missed delivery.
  </li>
</ul>

<h2>7. Food Safety & Storage</h2>
<p>
  All meals are prepared, chilled, and packed in compliance with the Brisbane City Council HACCP plan. Upon receipt:
</p>
<ol>
  <li>Check the packaging for any visible damage.</li>
  <li>Refrigerate the meals immediately (≤ 4 °C).</li>
  <li>Consume or freeze the meals before the “use‑by” date printed on each container.</li>
</ol>
<p>
  We are not responsible for food spoilage caused by improper storage after delivery.
</p>

<h2>8. Returns (non‑food items)</h2>
<p>
  Occasionally we include reusable accessories (e.g., insulated tote, glass container). These items may be returned within **30 days** of receipt if they are in their original condition. Return shipping is on the customer, unless the item was sent in error.
</p>

<h2>9. Changes to this Policy</h2>
<p>
  Balance Kitchen may revise this Refund & Delivery Policy from time to time. Any material change will be posted on this page with a new “Effective date”. Continuing to place orders after the change constitutes acceptance of the updated policy.
</p>

<h2>10. Contact us</h2>
<p>
  For any questions about deliveries, cancellations, or refunds, please contact our Customer Service team: <br />
  <strong>Balance Kitchen Pty Ltd</strong> <br />
  ABN <strong>[ABN]</strong> <br />
  <strong>[Address – street, suburb, QLD, postcode]</strong> <br />
  Phone: <strong>[Phone]</strong> <br />
  Email: <a href="mailto:support@balancekitchen.com.au">support@balancekitchen.com.au</a>
</p>

  </>
) as JSX.Element;

/* -----------------------------------------------------------------
   2️⃣  Tab definition – title + JSX content
   ----------------------------------------------------------------- */
const tabs = [
  { id: 'privacy', label: 'Privacy Policy', content: privacyContent },
  { id: 'terms', label: 'Terms & Conditions', content: termsContent },
  { id: 'cookies', label: 'Cookie Policy', content: cookieContent },
  { id: 'refund', label: 'Refund & Delivery', content: refundContent },
];



/* -----------------------------------------------------------------
   3️⃣  Main component
   ----------------------------------------------------------------- */
export default function LegalPage() {
  const router = useRouter();


  /* -------------------------------------------------
     Initialise from the current hash (if any) and listen
     for subsequent hash changes (clicking links inside the
     page does NOT remount the component).
     ------------------------------------------------- */
  const [activeId, setActiveId] = useState<string>(tabs[0].id); // default to first tab

     
  useEffect(() => {
    const startHash = window.location.hash.replace('#', '');
    if (startHash && tabs.some((t) => t.id === startHash)) {
      setActiveId(startHash);
    }
  }, []);

    // Also listen for future hash changes (e.g. user clicks a link)
    useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && tabs.some((t) => t.id === hash)) {
        setActiveId(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // clean up
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);


    useEffect(() => {
    const onPopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && tabs.some((t) => t.id === hash)) {
        setActiveId(hash);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /* -------------------------------------------------
     Animation variants (fade‑in / slide‑up)
     ------------------------------------------------- */
  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

   return (
    <section className={legalStyles.legalContainer}>
      <div className={legalStyles.contentWrapper}>
        {/* ---------- Tab Buttons ---------- */}
        <div className={styles.tabsContainer} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeId === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`${styles.tabButton} ${
                activeId === tab.id ? styles.tabButtonActive : ''
              }`}
              onClick={() => {
                setActiveId(tab.id);
                // Update the URL hash without a full navigation – we also fire a router event
                router.replace(`#${tab.id}`, { scroll: false });
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ---------- Animated Panel ---------- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            id={activeId}   
            role="tabpanel"
            aria-labelledby={`tab-${activeId}`}
            className={styles.dishesGridContainer}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <article className={legalStyles.fadeIn}>
              {tabs.find((t) => t.id === activeId)!.content}
            </article>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

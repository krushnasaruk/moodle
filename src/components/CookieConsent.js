'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './CookieConsent.module.css';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('sutras_cookie_consent');
    if (!consent) {
      // Small delay so the banner slides in after page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('sutras_cookie_consent', JSON.stringify({
      essential: true,
      analytics: true,
      advertising: true,
      timestamp: new Date().toISOString(),
    }));
    setVisible(false);
    // Enable Google AdSense / Analytics after consent
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      // Ads will load automatically once consent is given
    }
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('sutras_cookie_consent', JSON.stringify({
      essential: true,
      analytics: false,
      advertising: false,
      timestamp: new Date().toISOString(),
    }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.banner}>
        <div className={styles.content}>
          <div className={styles.icon}>🍪</div>
          <div className={styles.text}>
            <h3 className={styles.title}>We Value Your Privacy</h3>
            <p className={styles.description}>
              We use cookies to enhance your browsing experience, serve personalized ads, and analyze our traffic. 
              By clicking &quot;Accept All&quot;, you consent to our use of cookies. Read our{' '}
              <Link href="/privacy-policy" className={styles.link}>Privacy Policy</Link> and{' '}
              <Link href="/cookie-policy" className={styles.link}>Cookie Policy</Link> for more information.
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnEssential} onClick={handleEssentialOnly}>
            Essential Only
          </button>
          <button className={styles.btnAccept} onClick={handleAcceptAll}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

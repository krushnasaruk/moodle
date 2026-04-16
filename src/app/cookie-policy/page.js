import styles from '../legal.module.css';
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy — Sutras',
  description: 'Learn about how Sutras uses cookies and similar tracking technologies.',
};

export default function CookiePolicyPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalContainer}>
        <div className={styles.legalHeader}>
          <span className={styles.legalTag}>🍪 Legal</span>
          <h1 className={styles.legalTitle}>Cookie Policy</h1>
          <p className={styles.legalDate}>Last updated: April 12, 2026</p>
        </div>

        <div className={styles.legalContent}>
          <section className={styles.legalSection}>
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit a website. They are widely 
              used to make websites work more efficiently, provide a better browsing experience, and give information 
              to the owners of the site. Cookies can be &quot;persistent&quot; (they remain on your device until deleted) or 
              &quot;session&quot; (they are deleted when you close your browser).
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>2. How We Use Cookies</h2>
            <p>Sutras uses cookies for the following purposes:</p>

            <h3>2.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They enable basic features like 
              user authentication, session management, and security. You cannot opt out of essential cookies.
            </p>
            <div className={styles.cookieTable}>
              <div className={styles.cookieRow}>
                <div className={styles.cookieName}>Firebase Auth</div>
                <div className={styles.cookiePurpose}>Manages user login sessions and authentication</div>
                <div className={styles.cookieDuration}>Session / Persistent</div>
              </div>
              <div className={styles.cookieRow}>
                <div className={styles.cookieName}>Cookie Consent</div>
                <div className={styles.cookiePurpose}>Stores your cookie preference choices</div>
                <div className={styles.cookieDuration}>1 Year</div>
              </div>
              <div className={styles.cookieRow}>
                <div className={styles.cookieName}>Theme Preference</div>
                <div className={styles.cookiePurpose}>Remembers your light/dark mode preference</div>
                <div className={styles.cookieDuration}>Persistent</div>
              </div>
            </div>

            <h3>2.2 Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with our website by collecting information 
              anonymously. This helps us improve our platform and content.
            </p>
            <div className={styles.cookieTable}>
              <div className={styles.cookieRow}>
                <div className={styles.cookieName}>Usage Analytics</div>
                <div className={styles.cookiePurpose}>Tracks page views, navigation patterns, and feature usage</div>
                <div className={styles.cookieDuration}>2 Years</div>
              </div>
            </div>

            <h3>2.3 Advertising Cookies</h3>
            <p>
              These cookies are used by Google AdSense and other advertising partners to deliver relevant 
              advertisements. They track your browsing activity across websites to build a profile of your 
              interests and show you targeted ads.
            </p>
            <div className={styles.cookieTable}>
              <div className={styles.cookieRow}>
                <div className={styles.cookieName}>Google AdSense</div>
                <div className={styles.cookiePurpose}>Serves personalized ads based on browsing history</div>
                <div className={styles.cookieDuration}>Varies (up to 2 years)</div>
              </div>
              <div className={styles.cookieRow}>
                <div className={styles.cookieName}>DoubleClick (DSID)</div>
                <div className={styles.cookiePurpose}>Used by Google for ad personalization and measurement</div>
                <div className={styles.cookieDuration}>2 Weeks</div>
              </div>
            </div>
          </section>

          <section className={styles.legalSection}>
            <h2>3. Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services that appear on our pages. We do not control these 
              cookies. The main third-party services we use include:
            </p>
            <ul>
              <li><strong>Google Firebase:</strong> Authentication and data services</li>
              <li><strong>Google AdSense:</strong> Advertisement delivery and personalization</li>
              <li><strong>Google Analytics:</strong> Website traffic analysis (if implemented)</li>
            </ul>
            <p>
              For more information about third-party cookies, please visit the respective privacy policies of 
              these providers.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>4. Managing Cookies</h2>
            <p>You have several options for managing cookies:</p>

            <h3>4.1 Cookie Consent Banner</h3>
            <p>
              When you first visit Sutras, a cookie consent banner will appear allowing you to accept all 
              cookies or only essential cookies. You can change your preference at any time by clearing your 
              browser&apos;s local storage and revisiting the site.
            </p>

            <h3>4.2 Browser Settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. You can set your browser 
              to block or delete cookies. However, doing so may affect the functionality of our website.
            </p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>Chrome Cookie Settings</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>Firefox Cookie Settings</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>Safari Cookie Settings</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>Edge Cookie Settings</a></li>
            </ul>

            <h3>4.3 Opt-Out of Personalized Ads</h3>
            <p>
              You can opt out of personalized advertising by visiting:
            </p>
            <ul>
              <li><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>Google Ads Settings</a></li>
              <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>Digital Advertising Alliance Opt-Out</a></li>
              <li><a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>Your Online Choices (EU)</a></li>
            </ul>
          </section>

          <section className={styles.legalSection}>
            <h2>5. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, law, or 
              our business operations. Any changes will be posted on this page with an updated &quot;Last updated&quot; date.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>6. Contact Us</h2>
            <p>If you have any questions about our use of cookies, please contact us:</p>
            <div className={styles.contactBox}>
              <p><strong>Sutras Team</strong></p>
              <p>📧 Email: privacy@sutras.com</p>
              <p>🌐 Website: sutras.com</p>
            </div>
          </section>
        </div>

        <div className={styles.legalFooter}>
          <Link href="/" className={styles.backLink}>← Back to Home</Link>
          <div className={styles.legalFooterLinks}>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

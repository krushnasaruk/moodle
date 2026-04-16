import styles from '../legal.module.css';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Sutras',
  description: 'Learn how Sutras collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalContainer}>
        <div className={styles.legalHeader}>
          <span className={styles.legalTag}>📄 Legal</span>
          <h1 className={styles.legalTitle}>Privacy Policy</h1>
          <p className={styles.legalDate}>Last updated: April 12, 2026</p>
        </div>

        <div className={styles.legalContent}>
          <section className={styles.legalSection}>
            <h2>1. Introduction</h2>
            <p>
              Welcome to Sutras (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information 
              and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you visit our website and use our services.
            </p>
            <p>
              By accessing or using Sutras, you agree to this Privacy Policy. If you do not agree with the terms of this 
              policy, please do not access the site.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Personal Information</h3>
            <p>We may collect the following personal information when you create an account or interact with our platform:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, profile picture (via Google Sign-In or custom upload)</li>
              <li><strong>Academic Information:</strong> College name, branch/major, year of study, enrolled subjects</li>
              <li><strong>Usage Data:</strong> Files uploaded, downloads, points earned, leaderboard rankings</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <p>When you visit our website, we automatically collect certain information, including:</p>
            <ul>
              <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
              <li><strong>Log Data:</strong> IP address, access times, pages viewed, referring URL</li>
              <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to track activity on our service. See our <Link href="/cookie-policy" className={styles.inlineLink}>Cookie Policy</Link> for details.</li>
            </ul>
          </section>

          <section className={styles.legalSection}>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li>To provide, operate, and maintain our platform</li>
              <li>To personalize your experience and deliver recommended content</li>
              <li>To manage your account, including authentication via Firebase</li>
              <li>To track contributions, points, and leaderboard rankings</li>
              <li>To communicate with you about updates, features, or support</li>
              <li>To display personalized advertisements through Google AdSense</li>
              <li>To analyze usage patterns and improve our platform</li>
              <li>To enforce our Terms of Service and prevent misuse</li>
            </ul>
          </section>

          <section className={styles.legalSection}>
            <h2>4. Third-Party Services</h2>
            <p>We use the following third-party services that may collect and process your data:</p>
            
            <h3>4.1 Google Firebase</h3>
            <p>
              We use Firebase for authentication (Google Sign-In), database (Firestore), and file storage. 
              Google&apos;s privacy policy applies to data processed through Firebase services. 
              See: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>Google Privacy Policy</a>
            </p>

            <h3>4.2 Google AdSense</h3>
            <p>
              We use Google AdSense to display advertisements on our platform. AdSense may use cookies and web beacons 
              to serve ads based on your prior visits to our website or other websites. You can opt out of personalized 
              advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>Google Ads Settings</a>.
            </p>

            <h3>4.3 Google Gemini AI</h3>
            <p>
              Our Exam Mode feature uses Google&apos;s Generative AI (Gemini) to generate study content. 
              Queries sent to this service may be processed by Google in accordance with their AI data policies.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>5. Data Storage and Security</h2>
            <p>
              Your data is stored using Google Firebase infrastructure, which employs industry-standard security measures 
              including encryption in transit and at rest. While we strive to use commercially acceptable means to protect 
              your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>6. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data and account</li>
              <li><strong>Opt-Out:</strong> Opt out of personalized advertising and non-essential cookies</li>
              <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at the email address provided below.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>7. Children&apos;s Privacy</h2>
            <p>
              Sutras is intended for college and university students. We do not knowingly collect personal information 
              from children under the age of 13. If we become aware that we have collected data from a child under 13, 
              we will take steps to delete such information.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
              new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this 
              policy periodically.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>9. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
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
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/cookie-policy">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

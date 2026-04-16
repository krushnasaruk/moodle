import styles from '../legal.module.css';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Sutras',
  description: 'Read the Terms of Service for using Sutras, the student resource platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalContainer}>
        <div className={styles.legalHeader}>
          <span className={styles.legalTag}>📄 Legal</span>
          <h1 className={styles.legalTitle}>Terms of Service</h1>
          <p className={styles.legalDate}>Last updated: April 12, 2026</p>
        </div>

        <div className={styles.legalContent}>
          <section className={styles.legalSection}>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Sutras (&quot;the Platform&quot;), you accept and agree to be bound by these Terms 
              of Service. If you do not agree to these terms, you must not use the Platform.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>2. Description of Service</h2>
            <p>
              Sutras is an educational resource-sharing platform that allows students to upload, share, and download 
              academic materials including notes, previous year question papers (PYQs), assignments, and AI-powered 
              exam preparation tools. The platform is designed for college and university students.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>3. User Accounts</h2>
            <ul>
              <li>You must create an account to access most features of the Platform</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must provide accurate and truthful information when creating your account</li>
              <li>You must be at least 13 years old to create an account</li>
              <li>One person may only maintain one account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
            </ul>
          </section>

          <section className={styles.legalSection}>
            <h2>4. User-Generated Content</h2>
            
            <h3>4.1 Content Ownership</h3>
            <p>
              You retain ownership of any content you upload to Sutras. By uploading content, you grant Sutras a 
              non-exclusive, worldwide, royalty-free license to use, display, distribute, and make your content 
              available to other users of the Platform.
            </p>

            <h3>4.2 Content Guidelines</h3>
            <p>You agree not to upload content that:</p>
            <ul>
              <li>Infringes on any intellectual property rights or copyrights</li>
              <li>Contains malware, viruses, or harmful code</li>
              <li>Is obscene, offensive, defamatory, or inappropriate</li>
              <li>Violates any applicable law or regulation</li>
              <li>Contains personal information of others without their consent</li>
              <li>Is misleading, fraudulent, or deceptive</li>
            </ul>

            <h3>4.3 Content Moderation</h3>
            <p>
              All uploaded content goes through an approval process. We reserve the right to remove any content 
              that violates these guidelines without prior notice. Repeated violations may result in account suspension.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>5. Points and Leaderboard System</h2>
            <p>
              Sutras features a gamification system where users earn points for contributing content. 
              Points are earned based on uploads, downloads by other users, and community engagement. 
              Points have no monetary value and cannot be exchanged for cash or any other form of payment.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>6. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to other user accounts</li>
              <li>Use automated tools (bots, scrapers) to access the Platform</li>
              <li>Upload copyrighted material without proper authorization</li>
              <li>Spam, harass, or abuse other users</li>
              <li>Circumvent any security features of the Platform</li>
              <li>Use the Platform to distribute commercial advertisements without our consent</li>
              <li>Manipulate the points or leaderboard system through illegitimate means</li>
            </ul>
          </section>

          <section className={styles.legalSection}>
            <h2>7. Intellectual Property</h2>
            <p>
              The Sutras name, logo, design, and all related branding are the property of Sutras. 
              You may not use our intellectual property without prior written consent. The platform code, 
              design, and structure are protected under applicable intellectual property laws.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>8. Advertisements</h2>
            <p>
              Sutras displays third-party advertisements through Google AdSense and potentially other advertising 
              networks. These advertisements help fund the Platform and keep it free for students. You agree that:
            </p>
            <ul>
              <li>Ads may be displayed alongside user content</li>
              <li>Ad content is determined by third-party advertisers, not Sutras</li>
              <li>We are not responsible for the content or accuracy of third-party ads</li>
              <li>You will not click on ads with the intent of inflating ad revenue</li>
            </ul>
          </section>

          <section className={styles.legalSection}>
            <h2>9. Disclaimers</h2>
            <ul>
              <li>
                Sutras is provided &quot;as is&quot; without warranties of any kind, express or implied
              </li>
              <li>
                We do not guarantee the accuracy, completeness, or quality of any user-uploaded content
              </li>
              <li>
                We are not responsible for any academic outcomes based on materials found on the Platform
              </li>
              <li>
                AI-generated content in Exam Mode is for supplementary study purposes only and may contain errors
              </li>
            </ul>
          </section>

          <section className={styles.legalSection}>
            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Sutras and its operators shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. 
              Our total liability for any claim related to the Platform shall not exceed the amount you paid to us 
              (if any) in the 12 months preceding the claim.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>11. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. Changes will be effective upon 
              posting to the Platform. Your continued use of the Platform after changes are posted constitutes 
              acceptance of the modified terms.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>12. Termination</h2>
            <p>
              We may terminate or suspend your access to the Platform immediately, without prior notice, for any 
              reason including breach of these Terms. Upon termination, your right to use the Platform will 
              immediately cease.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>13. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <div className={styles.contactBox}>
              <p><strong>Sutras Team</strong></p>
              <p>📧 Email: legal@sutras.com</p>
              <p>🌐 Website: sutras.com</p>
            </div>
          </section>
        </div>

        <div className={styles.legalFooter}>
          <Link href="/" className={styles.backLink}>← Back to Home</Link>
          <div className={styles.legalFooterLinks}>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/cookie-policy">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

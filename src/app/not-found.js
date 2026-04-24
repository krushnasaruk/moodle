import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>

      <div className={styles.content}>
        <div className={styles.errorCode}>
          <span className={styles.four}>4</span>
          <span className={styles.zero}>
            <span className={styles.bookEmoji}>📚</span>
          </span>
          <span className={styles.four}>4</span>
        </div>

        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.desc}>
          Looks like this page wandered off to another lecture. 
          Let&apos;s get you back on track.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            ← Back to Home
          </Link>
          <Link href="/notes" className={styles.secondaryBtn}>
            Browse Notes
          </Link>
        </div>

        <div className={styles.suggestions}>
          <p className={styles.suggestTitle}>Popular destinations:</p>
          <div className={styles.suggestLinks}>
            <Link href="/notes" className={styles.suggestLink}>📄 Notes</Link>
            <Link href="/pyqs" className={styles.suggestLink}>📖 PYQs</Link>
            <Link href="/community" className={styles.suggestLink}>💬 Community</Link>
            <Link href="/clubs" className={styles.suggestLink}>🏢 Clubs</Link>
            <Link href="/news" className={styles.suggestLink}>📰 News</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

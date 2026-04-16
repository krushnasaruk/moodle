'use client';
import styles from './SkeletonCard.module.css';

export default function SkeletonCard() {
    return (
        <div className={styles.skeletonCard}>
            <div className={styles.skeletonHeader}>
                <div className={`${styles.skeletonIcon} ${styles.shimmer}`}></div>
                <div className={`${styles.skeletonBadge} ${styles.shimmer}`}></div>
            </div>
            <div className={`${styles.skeletonTitle} ${styles.shimmer}`}></div>
            <div className={`${styles.skeletonTitleSmall} ${styles.shimmer}`}></div>
            <div className={`${styles.skeletonMeta} ${styles.shimmer}`}></div>
            
            <div style={{ flexGrow: 1 }}></div>
            
            <div className={styles.skeletonFooter}>
                <div className={`${styles.skeletonRating} ${styles.shimmer}`}></div>
                <div className={`${styles.skeletonButton} ${styles.shimmer}`}></div>
            </div>
        </div>
    );
}

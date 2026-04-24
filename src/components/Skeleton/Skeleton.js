'use client';

import styles from './Skeleton.module.css';

/**
 * Skeleton — Animated shimmer placeholder
 * Usage: <Skeleton width="100%" height="20px" />
 *        <Skeleton variant="circle" size={48} />
 *        <Skeleton variant="card" />
 */
export function Skeleton({ 
  width = '100%', 
  height = '16px', 
  borderRadius = 'var(--radius-sm)',
  variant,
  size,
  className = '',
  count = 1,
}) {
  if (variant === 'circle') {
    const s = size || 48;
    return (
      <div 
        className={`${styles.skeleton} ${styles.pulse} ${className}`}
        style={{ width: s, height: s, borderRadius: '50%', flexShrink: 0 }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${styles.skeletonCard} ${className}`}>
        <div className={`${styles.skeleton} ${styles.pulse}`} style={{ height: '180px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
        <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className={`${styles.skeleton} ${styles.pulse}`} style={{ height: '12px', width: '60px', borderRadius: '6px' }} />
          <div className={`${styles.skeleton} ${styles.pulse}`} style={{ height: '18px', width: '80%', borderRadius: '6px' }} />
          <div className={`${styles.skeleton} ${styles.pulse}`} style={{ height: '14px', width: '60%', borderRadius: '6px' }} />
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <div className={`${styles.skeleton} ${styles.pulse}`} style={{ height: '12px', width: '80px', borderRadius: '6px' }} />
            <div className={`${styles.skeleton} ${styles.pulse}`} style={{ height: '12px', width: '60px', borderRadius: '6px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width }}>
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i}
            className={`${styles.skeleton} ${styles.pulse}`}
            style={{ 
              height, 
              width: i === count - 1 ? '65%' : '100%', 
              borderRadius 
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'avatar-row') {
    return (
      <div className={`${styles.avatarRow} ${className}`}>
        <div className={`${styles.skeleton} ${styles.pulse}`} style={{ width: size || 40, height: size || 40, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className={`${styles.skeleton} ${styles.pulse}`} style={{ height: '14px', width: '55%', borderRadius: '6px' }} />
          <div className={`${styles.skeleton} ${styles.pulse}`} style={{ height: '12px', width: '35%', borderRadius: '6px' }} />
        </div>
      </div>
    );
  }

  // Default: simple bar
  return (
    <div 
      className={`${styles.skeleton} ${styles.pulse} ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

/**
 * SkeletonGrid — Multiple skeleton cards in a grid
 * Usage: <SkeletonGrid count={6} columns={3} />
 */
export function SkeletonGrid({ count = 6, columns = 3, gap = 'var(--space-lg)' }) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: `repeat(auto-fill, minmax(${100/columns - 2}%, 1fr))`, 
      gap 
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { awardDownloadPoints } from '@/lib/points';
import { ScrollReveal } from '@/components/Animations';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import { IconAssignment, IconUser, IconHat, IconDownload, IconStar, IconSearch, IconLock, IconFlag } from '@/components/Icons';
import styles from './page.module.css';

// Subjects with warm/playful colors
const SUBJECT_TABS = [
  { key: 'All',  label: 'All Files',   emoji: '📚', color: '#8b5cf6' },
  { key: 'BEE',  label: 'BEE',         emoji: '⚡', color: '#f59e0b' },
  { key: 'IKS',  label: 'IKS',         emoji: '🕉️', color: '#ef4444' },
  { key: 'PPS',  label: 'PPS',         emoji: '💻', color: '#06b6d4' },
  { key: 'FPL',  label: 'FPL',         emoji: '🔧', color: '#10b981' },
  { key: 'Chemistry',               label: 'Chemistry',  emoji: '🧪', color: '#22d3ee' },
  { key: 'Physics',                 label: 'Physics',    emoji: '🔭', color: '#f97316' },
  { key: 'Engineering Mathematics', label: 'Maths',      emoji: '📐', color: '#ec4899' },
  { key: 'Engineering Mechanics',   label: 'Mechanics',  emoji: '⚙️', color: '#3b82f6' },
];

export default function AssignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!db) throw new Error('Firestore not init');
        const snap = await Promise.race([
          getDocs(collection(db, 'files')),
          new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), 8000)),
        ]);
        if (cancelled) return;
        const data = snap.docs
          .map(d => { const f = d.data(); if (f.subject === 'BE') f.subject = 'BEE'; return { id: d.id, ...f }; })
          .filter(f => f.type === 'Assignment' && f.status === 'approved');
        data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        if (!cancelled) setAssignments(data);
      } catch (e) { console.error(e); if (!cancelled) setAssignments([]); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const countBySubject = useMemo(() => {
    const map = { All: assignments.length };
    assignments.forEach(a => { const k = a.subject?.trim() || 'Other'; map[k] = (map[k] || 0) + 1; });
    return map;
  }, [assignments]);

  const filtered = useMemo(() => {
    let r = assignments;
    if (activeTab !== 'All') {
      r = r.filter(a => {
        const s = a.subject?.trim() || '';
        return s === activeTab || s.toLowerCase().includes(activeTab.toLowerCase());
      });
    }
    if (search) r = r.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [assignments, activeTab, search]);

  const totalDownloads = useMemo(() => assignments.reduce((s, a) => s + (a.downloads || 0), 0), [assignments]);

  const handleDownload = async (item) => {
    if (!item.fileURL) return;
    try { await awardDownloadPoints(item.id, item.uploaderUID, user?.uid); setAssignments(prev => prev.map(a => a.id === item.id ? { ...a, downloads: (a.downloads || 0) + 1 } : a)); } catch (e) {}
    window.open(item.fileURL, '_blank');
  };

  const handleReport = async (item) => {
    if (!confirm('Flag this assignment as incorrect?')) return;
    try { await updateDoc(doc(db, 'files', item.id), { isReported: true, reportCount: increment(1) }); alert('Flagged for review.'); } catch (e) { alert('Failed.'); }
  };

  if (authLoading) return <div style={{ paddingTop: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>Authenticating...</div>;

  if (!user) return (
    <div className={styles.pageWrapper}>
      <div className={styles.lockState}>
        <div className={styles.lockEmoji}>📝</div>
        <h2 className={styles.lockTitle}>Assignment Archive</h2>
        <p className={styles.lockDesc}>Sign in to access solutions & lab manuals.</p>
        <Link href="/login" className={styles.lockBtn}>Sign In to Access</Link>
      </div>
    </div>
  );

  const activeMeta = SUBJECT_TABS.find(t => t.key === activeTab);

  return (
    <div className={styles.pageWrapper}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className="container">
          <ScrollReveal>
            <span className={styles.heroBadge}>📝 Assignments</span>
            <h1 className={styles.heroTitle}>Assignment Archive</h1>
            <p className={styles.heroSub}>Ready-to-submit solutions, lab manuals & reference work</p>
          </ScrollReveal>
        </div>
      </div>

      <div className={`container ${styles.layout}`}>
        {/* ═══ Left Sidebar ═══ */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>Subjects</h3>
            <span className={styles.sidebarCount}>{assignments.length} files</span>
          </div>

          <div className={styles.sidebarList}>
            {SUBJECT_TABS.map(t => {
              const count = countBySubject[t.key] || 0;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
                  style={isActive ? { '--active-color': t.color } : {}}
                  onClick={() => setActiveTab(t.key)}
                >
                  <span className={styles.sidebarEmoji}>{t.emoji}</span>
                  <span className={styles.sidebarLabel}>{t.label}</span>
                  {count > 0 && <span className={styles.sidebarBadge} style={isActive ? { background: t.color, color: '#fff' } : {}}>{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Quick stats */}
          <div className={styles.sidebarStats}>
            <div className={styles.miniStat}>
              <span className={styles.miniNum}>{assignments.length}</span>
              <span className={styles.miniLabel}>Files</span>
            </div>
            <div className={styles.miniStat}>
              <span className={styles.miniNum}>{totalDownloads}</span>
              <span className={styles.miniLabel}>Downloads</span>
            </div>
          </div>
        </aside>

        {/* ═══ Main Content ═══ */}
        <main className={styles.main}>
          {/* Search bar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <h2 className={styles.sectionTitle}>
                <span style={{ color: activeMeta?.color }}>{activeMeta?.emoji}</span>{' '}
                {activeMeta?.label}
              </h2>
              <span className={styles.countLabel}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.searchBox}>
              <IconSearch size={15} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Cards */}
          {loading ? (
            <div className={styles.cardGrid}>
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} variant="card" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyEmoji}>📂</div>
              <h3>No assignments found</h3>
              <p>Try another subject or search term.</p>
              <Link href="/upload" className={styles.uploadLink}>Upload one →</Link>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {filtered.map((item, i) => {
                const subMeta = SUBJECT_TABS.find(t => t.key !== 'All' && (item.subject === t.key || item.subject?.toLowerCase().includes(t.key.toLowerCase())));
                const accent = subMeta?.color || '#8b5cf6';
                return (
                  <ScrollReveal key={item.id} delay={i * 30}>
                    <div className={styles.card} style={{ '--card-accent': accent }}>
                      {/* Top stripe */}
                      <div className={styles.cardStripe} style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)` }}></div>
                      
                      <div className={styles.cardBody}>
                        <div className={styles.cardRow1}>
                          <div className={styles.cardIconWrap} style={{ background: `${accent}12`, color: accent }}>
                            <IconAssignment size={20} />
                          </div>
                          <span className={styles.subjectPill} style={{ color: accent, background: `${accent}12` }}>
                            {item.subject}
                          </span>
                        </div>

                        <h3 className={styles.cardTitle}>{item.title}</h3>

                        <div className={styles.cardMeta}>
                          <span><IconHat size={12} /> {item.branch || 'All'}</span>
                          <span><IconUser size={12} /> {item.uploader || 'Admin'}</span>
                        </div>

                        <div className={styles.cardFooter}>
                          <div className={styles.cardStats}>
                            <span><IconDownload size={13} /> {item.downloads || 0}</span>
                            <span><IconStar size={13} /> {item.rating || 'New'}</span>
                          </div>
                          <div className={styles.cardActions}>
                            <button className={styles.reportBtn} onClick={() => handleReport(item)} title="Report"><IconFlag size={14} /></button>
                            <button className={styles.getBtn} style={{ background: accent }} onClick={() => handleDownload(item)}>
                              <IconDownload size={14} /> Get
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

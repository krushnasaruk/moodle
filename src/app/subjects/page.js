'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { awardDownloadPoints } from '@/lib/points';
import { BRANCHES, YEARS, getSubjectsByYear } from '@/lib/subjectMap';
import { ScrollReveal } from '@/components/Animations';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import {
  IconNotes, IconPyq, IconAssignment, IconFolder, IconStar,
  IconDownload, IconLock, IconSearch, IconHat, IconUser, IconFlag,
} from '@/components/Icons';
import styles from './page.module.css';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getTypeIcon(type) {
  switch (type) {
    case 'Notes':      return <IconNotes size={16} />;
    case 'PYQ':        return <IconPyq size={16} />;
    case 'Assignment': return <IconAssignment size={16} />;
    default:           return <IconFolder size={16} />;
  }
}
function getTypeClass(type) {
  switch (type) {
    case 'Notes':      return styles.typeNotes;
    case 'PYQ':        return styles.typePyq;
    case 'Assignment': return styles.typeAssignment;
    default:           return styles.typeNotes;
  }
}

const TYPE_CHIPS = [
  { key: 'All',        label: 'All Types',   emoji: '📚', color: '#8b5cf6' },
  { key: 'Notes',      label: 'Notes',       emoji: '📝', color: '#3b82f6' },
  { key: 'PYQ',        label: 'PYQ',         emoji: '📄', color: '#f59e0b' },
  { key: 'Assignment', label: 'Assignments', emoji: '✏️', color: '#10b981' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function SubjectsPage() {
  const { user, loading: authLoading } = useAuth();

  const [branch, setBranch] = useState('Computer');
  const [year, setYear] = useState('1st Year');
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);

  // Drill-down state
  const [activeSubject, setActiveSubject] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');

  /* ── User prefs ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !hasLoadedPrefs) {
      if (user) {
        setBranch(user.branch || 'Computer');
        setYear(user.year || '1st Year');
      }
      setHasLoadedPrefs(true);
    }
  }, [user, authLoading, hasLoadedPrefs]);

  /* ── Fetch all files ─────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!db) throw new Error('Firestore not initialized');
        const snap = await Promise.race([
          getDocs(collection(db, 'files')),
          new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), 8000)),
        ]);
        if (cancelled) return;
        const data = snap.docs
          .map(d => { const f = d.data(); if (f.subject === 'BE') f.subject = 'BEE'; return { id: d.id, ...f }; })
          .filter(f => f.status === 'approved');
        data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        if (!cancelled) setAllFiles(data);
      } catch (e) { console.error(e); if (!cancelled) setAllFiles([]); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Derived data ────────────────────────────────────────────────────── */
  const subjects = getSubjectsByYear(branch, year);

  const subjectContent = useMemo(() => {
    const grouped = {};
    subjects.forEach(s => (grouped[s] = []));
    allFiles.forEach(file => {
      let raw = (file.subject || 'Other').trim();
      if (raw.toUpperCase() === 'BE') raw = 'BEE';
      const lowerRaw = raw.toLowerCase();
      const found = subjects.find(vs => {
        const vsL = vs.toLowerCase();
        return vsL === lowerRaw || vsL.includes(lowerRaw) || lowerRaw.includes(vsL);
      });
      const bucket = found || raw;
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(file);
    });
    return grouped;
  }, [allFiles, subjects]);

  // Landing stats
  const totalFiles = useMemo(() => Object.values(subjectContent).reduce((s, arr) => s + arr.length, 0), [subjectContent]);
  const totalDownloads = useMemo(() => allFiles.reduce((s, f) => s + (f.downloads || 0), 0), [allFiles]);

  // Drill-down filtered files
  const drillFiles = useMemo(() => {
    if (!activeSubject) return [];
    const items = subjectContent[activeSubject] || [];
    return items.filter(f => {
      if (typeFilter !== 'All' && f.type !== typeFilter) return false;
      if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeSubject, subjectContent, typeFilter, search]);

  const drillTotal = useMemo(() => (subjectContent[activeSubject] || []).length, [activeSubject, subjectContent]);

  /* ── Actions ─────────────────────────────────────────────────────────── */
  const handleDownload = async (item) => {
    if (!item.fileURL) return;
    try {
      await awardDownloadPoints(item.id, item.uploaderUID, user?.uid);
      setAllFiles(prev => prev.map(f => f.id === item.id ? { ...f, downloads: (f.downloads || 0) + 1 } : f));
    } catch (e) { console.warn(e.message); }
    window.open(item.fileURL, '_blank');
  };

  const handleReport = async (item) => {
    if (!confirm('Flag this file as incorrect?')) return;
    try {
      await updateDoc(doc(db, 'files', item.id), { isReported: true, reportCount: increment(1) });
      alert('Flagged for review.');
    } catch (e) { alert('Failed.'); }
  };

  /* ── Auth gate ───────────────────────────────────────────────────────── */
  if (authLoading) return (
    <div style={{ paddingTop: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>Authenticating...</div>
  );

  if (!user) return (
    <div className={styles.pageWrapper}>
      <div className={styles.lockState}>
        <div className={styles.lockIcon}><IconLock size={56} /></div>
        <h2 className={styles.lockTitle}>Subject Hub</h2>
        <p className={styles.lockDesc}>Sign in to browse study materials organized by subject.</p>
        <Link href="/login" className={styles.lockBtn}>Sign In to Access</Link>
      </div>
    </div>
  );

  /* ── Color accent for active subject ─────────────────────────────────── */
  const SUBJECT_COLORS = [
    '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#10b981',
    '#ec4899', '#3b82f6', '#f97316', '#22d3ee', '#a855f7',
    '#14b8a6', '#e11d48', '#6366f1', '#84cc16', '#0ea5e9',
  ];
  const activeColor = activeSubject
    ? SUBJECT_COLORS[subjects.indexOf(activeSubject) % SUBJECT_COLORS.length]
    : '#8b5cf6';

  return (
    <div className={styles.pageWrapper}>
      {/* ── Floating Orbs ───────────────────────────────────────────────── */}
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className="container">
          <ScrollReveal>
            {activeSubject ? (
              <div className={styles.breadcrumb}>
                <button className={styles.backBtn} onClick={() => { setActiveSubject(null); setSearch(''); setTypeFilter('All'); }}>
                  ← Back to Subjects
                </button>
                <span className={styles.breadSep}>›</span>
                <span className={styles.breadCurrent}>{activeSubject}</span>
              </div>
            ) : null}
            <h1 className={styles.heroTitle}>
              {activeSubject
                ? <><span className={styles.heroEmoji}>📖</span> {activeSubject}</>
                : 'Subject Hub'}
            </h1>
            <p className={styles.heroSub}>
              {activeSubject
                ? `${drillTotal} materials available • Browse notes, PYQs & assignments`
                : 'All your study materials — beautifully organized by subject'}
            </p>
          </ScrollReveal>

          {/* Stats Banner on landing only */}
          {!activeSubject && !loading && (
            <ScrollReveal delay={200}>
              <div className={styles.statsBanner}>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{totalFiles}</span>
                  <span className={styles.statLabel}>Materials</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{subjects.length}</span>
                  <span className={styles.statLabel}>Subjects</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{totalDownloads}</span>
                  <span className={styles.statLabel}>Downloads</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>SPPU</span>
                  <span className={styles.statLabel}>Pattern</span>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ═══ LANDING — Subject Cards ═════════════════════════════════ */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {!activeSubject && (
          <>
            {/* Branch / Year Filters */}
            <ScrollReveal delay={100}>
              <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                  <select className={styles.filterSelect} value={branch} onChange={e => setBranch(e.target.value)}>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select className={styles.filterSelect} value={year} onChange={e => setYear(e.target.value)}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <span className={styles.filterCount}>{subjects.length} subjects found</span>
              </div>
            </ScrollReveal>

            {loading ? (
              <div className={styles.subjectGrid}>
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} width="100%" height="220px" borderRadius="var(--radius-xl)" />
                ))}
              </div>
            ) : subjects.length > 0 ? (
              <div className={styles.subjectGrid}>
                {subjects.map((subj, i) => {
                  const content = subjectContent[subj] || [];
                  const topContent = content.slice(0, 3);
                  const accent = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                  const noteCount = content.filter(f => f.type === 'Notes').length;
                  const pyqCount = content.filter(f => f.type === 'PYQ').length;
                  const assignCount = content.filter(f => f.type === 'Assignment').length;

                  return (
                    <ScrollReveal key={subj} delay={i * 60}>
                      <button
                        className={styles.subjectCard}
                        style={{ '--accent-color': accent }}
                        onClick={() => setActiveSubject(subj)}
                      >
                        {/* Glow stripe */}
                        <div className={styles.cardGlow} style={{ background: `linear-gradient(135deg, ${accent}30, transparent)` }}></div>

                        {/* Header */}
                        <div className={styles.subjectCardHeader}>
                          <div className={styles.subjectIcon} style={{ background: `${accent}15`, borderColor: `${accent}30`, color: accent }}>
                            <IconNotes size={24} />
                          </div>
                          <div className={styles.cardBadge} style={{ color: accent, background: `${accent}15` }}>
                            {content.length} files
                          </div>
                        </div>

                        <h3 className={styles.subjectName}>{subj}</h3>

                        {/* Content preview */}
                        {topContent.length > 0 ? (
                          <div className={styles.contentList}>
                            {topContent.map(item => (
                              <div key={item.id} className={styles.contentItem}>
                                <span className={`${styles.contentType} ${getTypeClass(item.type)}`}>{getTypeIcon(item.type)} {item.type}</span>
                                <span className={styles.contentTitle}>{item.title}</span>
                                <span className={styles.contentRating}><IconStar size={12} /> {item.rating > 0 ? item.rating : 'New'}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.noContent}>
                            <p>No materials yet</p>
                            <Link href="/upload" className={styles.uploadLink} onClick={e => e.stopPropagation()}>Be the first to upload →</Link>
                          </div>
                        )}

                        {/* Bottom bar */}
                        <div className={styles.cardBottom}>
                          <div className={styles.typeCounts}>
                            {noteCount > 0 && <span className={styles.typeCount} style={{ color: '#3b82f6' }}>📝 {noteCount}</span>}
                            {pyqCount > 0 && <span className={styles.typeCount} style={{ color: '#f59e0b' }}>📄 {pyqCount}</span>}
                            {assignCount > 0 && <span className={styles.typeCount} style={{ color: '#10b981' }}>✏️ {assignCount}</span>}
                            {content.length === 0 && <span className={styles.typeCount}>No files</span>}
                          </div>
                          <span className={styles.subjectArrow} style={{ color: accent }}>
                            View All →
                          </span>
                        </div>
                      </button>
                    </ScrollReveal>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📂</div>
                <h3>Select a branch & year</h3>
                <p>Pick your branch and year to see available subjects.</p>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ═══ DRILL-DOWN — All files for a subject ═══════════════════ */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeSubject && (
          <>
            {/* Filter Bar */}
            <ScrollReveal delay={100}>
              <div className={styles.drillFilterBar}>
                <div className={styles.typeChips}>
                  {TYPE_CHIPS.map(t => (
                    <button
                      key={t.key}
                      className={`${styles.typeChip} ${typeFilter === t.key ? styles.typeChipActive : ''}`}
                      style={typeFilter === t.key ? { background: activeColor, borderColor: activeColor } : {}}
                      onClick={() => setTypeFilter(t.key)}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
                <div className={styles.searchBox}>
                  <IconSearch size={16} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search materials..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </ScrollReveal>

            <p className={styles.resultsCount}>
              Showing <strong>{drillFiles.length}</strong> of {drillTotal} materials
            </p>

            {/* Material Grid */}
            {loading ? (
              <div className={styles.materialGrid}>
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} variant="card" />)}
              </div>
            ) : drillFiles.length === 0 ? (
              <div className={styles.emptyState}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                <h3>No materials found</h3>
                <p>Try adjusting the type filter or search term.</p>
                <Link href="/upload" className={styles.uploadCta}>Upload Material →</Link>
              </div>
            ) : (
              <div className={styles.materialGrid}>
                {drillFiles.map((item, i) => {
                  const chipMeta = TYPE_CHIPS.find(t => t.key === item.type) || TYPE_CHIPS[0];
                  return (
                    <ScrollReveal key={item.id} delay={i * 35}>
                      <div className={styles.materialCard} style={{ '--accent-color': activeColor }}>
                        {/* Shimmer stripe */}
                        <div className={styles.materialShimmer} style={{ background: `linear-gradient(135deg, ${activeColor}12, transparent 60%)` }}></div>

                        <div className={styles.materialHeader}>
                          <div className={styles.materialIcon} style={{ background: `${chipMeta.color}15`, color: chipMeta.color }}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div className={styles.materialBadges}>
                            <span className={styles.materialTypeBadge} style={{ color: chipMeta.color, background: `${chipMeta.color}15` }}>
                              {chipMeta.emoji} {item.type}
                            </span>
                          </div>
                        </div>

                        <h3 className={styles.materialTitle}>{item.title}</h3>

                        <div className={styles.materialMeta}>
                          <span><IconHat size={13} /> {item.branch || 'All Branches'}</span>
                          <span><IconUser size={13} /> {item.uploader || 'Admin'}</span>
                        </div>

                        <div className={styles.materialFooter}>
                          <div className={styles.materialStats}>
                            <span title="Downloads"><IconDownload size={14} /> {item.downloads || 0}</span>
                            <span title="Rating"><IconStar size={14} /> {item.rating || 'New'}</span>
                          </div>
                          <div className={styles.materialActions}>
                            <button className={styles.reportBtn} onClick={() => handleReport(item)} title="Report">
                              <IconFlag size={14} />
                            </button>
                            <button
                              className={styles.downloadBtn}
                              style={{ background: activeColor, boxShadow: `0 4px 14px ${activeColor}44` }}
                              onClick={() => handleDownload(item)}
                            >
                              <IconDownload size={16} /> Get
                            </button>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

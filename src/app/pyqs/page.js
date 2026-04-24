'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { awardDownloadPoints } from '@/lib/points';
import { ScrollReveal } from '@/components/Animations';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import { IconPyq, IconSearch, IconLock, IconDownload, IconStar, IconHat, IconUser, IconFlag } from '@/components/Icons';
import styles from './page.module.css';

// ── Subject config ─────────────────────────────────────────────────────────
const SUBJECTS = [
  { key: 'BEE',                       label: 'Basic Electrical Engineering', short: 'BEE',      emoji: '⚡', color: '#f59e0b', grad: 'linear-gradient(135deg,#f59e0b22,#fbbf2411)' },
  { key: 'Engineering Chemistry',     label: 'Engineering Chemistry',        short: 'Chem',     emoji: '🧪', color: '#10b981', grad: 'linear-gradient(135deg,#10b98122,#34d39911)' },
  { key: 'Electronics',               label: 'Basic Electronics',            short: 'Elec',     emoji: '📡', color: '#3b82f6', grad: 'linear-gradient(135deg,#3b82f622,#60a5fa11)' },
  { key: 'Engineering Graphics',      label: 'Engineering Graphics',         short: 'EG',       emoji: '✏️', color: '#8b5cf6', grad: 'linear-gradient(135deg,#8b5cf622,#a78bfa11)' },
  { key: 'Engineering Mathematics 1', label: 'Engineering Mathematics I',    short: 'Maths I',  emoji: '📐', color: '#ef4444', grad: 'linear-gradient(135deg,#ef444422,#f8717111)' },
  { key: 'Engineering Mathematics 2', label: 'Engineering Mathematics II',   short: 'Maths II', emoji: '📏', color: '#ec4899', grad: 'linear-gradient(135deg,#ec489922,#f4728411)' },
  { key: 'Engineering Mechanics',     label: 'Engineering Mechanics',        short: 'EM',       emoji: '⚙️', color: '#06b6d4', grad: 'linear-gradient(135deg,#06b6d422,#22d3ee11)' },
  { key: 'Engineering Physics',       label: 'Engineering Physics',          short: 'Physics',  emoji: '🔭', color: '#f97316', grad: 'linear-gradient(135deg,#f9731622,#fb923c11)' },
  { key: 'PPS',                        label: 'Programming & Problem Solving',short: 'PPS',     emoji: '💻', color: '#22d3ee', grad: 'linear-gradient(135deg,#22d3ee22,#67e8f911)' },
];

// Extract readable period from filename
function parsePeriod(title) {
  const match = title.match(/(\d{4})/);
  return match ? match[1] : 'Unknown';
}

// Extract readable exam month from title
function parseExamWindow(title) {
  const t = title.toLowerCase();
  if (t.includes('nov') || t.includes('dec')) return 'Nov/Dec';
  if (t.includes('may') || t.includes('jun')) return 'May/Jun';
  if (t.includes('march') || t.includes('mar')) return 'March';
  if (t.includes('oct')) return 'October';
  if (t.includes('sep')) return 'September';
  return '';
}

export default function PyqsPage() {
  const { user, loading: authLoading } = useAuth();
  const [pyqs, setPyqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');

  // ── Fetch ──────────────────────────────────────────────────────────────────
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
          .map(d => {
            const f = d.data();
            if (f.subject === 'BE') f.subject = 'BEE';
            return { id: d.id, ...f };
          })
          .filter(f => f.type === 'PYQ' && f.status === 'approved');
        data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        if (!cancelled) setPyqs(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setPyqs([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const countBySubject = useMemo(() => {
    const map = {};
    pyqs.forEach(p => {
      const key = p.subject?.trim() || 'Other';
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [pyqs]);

  const latestBySubject = useMemo(() => {
    const map = {};
    pyqs.forEach(p => {
      const key = p.subject?.trim() || 'Other';
      if (!map[key]) map[key] = [];
      if (map[key].length < 3) map[key].push(p);
    });
    return map;
  }, [pyqs]);

  const subjectPyqs = useMemo(() => {
    if (!activeSubject) return [];
    return pyqs.filter(p => {
      const subj = p.subject?.trim() || '';
      return subj === activeSubject || subj.toLowerCase() === activeSubject.toLowerCase();
    });
  }, [pyqs, activeSubject]);

  const availableYears = useMemo(() => {
    const years = [...new Set(subjectPyqs.map(p => parsePeriod(p.title)))].sort((a, b) => b - a);
    return ['All', ...years];
  }, [subjectPyqs]);

  const filtered = useMemo(() => {
    return subjectPyqs.filter(p => {
      if (yearFilter !== 'All' && !p.title.includes(yearFilter)) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [subjectPyqs, yearFilter, search]);

  const totalDownloads = useMemo(() => pyqs.reduce((s, p) => s + (p.downloads || 0), 0), [pyqs]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDownload = async (item) => {
    if (!item.fileURL) return;
    try {
      await awardDownloadPoints(item.id, item.uploaderUID, user?.uid);
      setPyqs(prev => prev.map(p => p.id === item.id ? { ...p, downloads: (p.downloads || 0) + 1 } : p));
    } catch (e) { console.warn(e.message); }
    window.open(item.fileURL, '_blank');
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ paddingTop: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>Authenticating...</div>
  );

  if (!user) return (
    <div className={styles.pageWrapper}>
      <div className={styles.lockState}>
        <div className={styles.lockIcon}><IconLock size={56} /></div>
        <h2 className={styles.lockTitle}>Locked Vault</h2>
        <p className={styles.lockDesc}>Sign in to access Past Year Question Papers.</p>
        <Link href="/login" className={styles.lockBtn}>Sign In</Link>
      </div>
    </div>
  );

  const activeMeta = SUBJECTS.find(s => s.key === activeSubject);

  return (
    <div className={styles.pageWrapper}>
      {/* ── Floating Orbs ─────────────────────────────────────────────────── */}
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className="container">
          <ScrollReveal>
            {activeSubject ? (
              <div className={styles.breadcrumb}>
                <button className={styles.backBtn} onClick={() => { setActiveSubject(null); setSearch(''); setYearFilter('All'); }}>
                  ← Back to Subjects
                </button>
                <span className={styles.breadSep}>›</span>
                <span className={styles.breadCurrent}>{activeMeta?.label}</span>
              </div>
            ) : null}
            <h1 className={styles.heroTitle}>
              {activeSubject
                ? <><span className={styles.heroEmoji}>{activeMeta?.emoji}</span> {activeMeta?.label}</>
                : 'PYQ Vault'}
            </h1>
            <p className={styles.heroSub}>
              {activeSubject
                ? `${subjectPyqs.length} question papers available • 2019 Pattern`
                : 'Your one-stop collection for past year question papers'}
            </p>
          </ScrollReveal>

          {/* Stats Banner on landing only */}
          {!activeSubject && !loading && (
            <ScrollReveal delay={200}>
              <div className={styles.statsBanner}>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{pyqs.length}</span>
                  <span className={styles.statLabel}>Papers</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{SUBJECTS.length}</span>
                  <span className={styles.statLabel}>Subjects</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{totalDownloads}</span>
                  <span className={styles.statLabel}>Downloads</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>2019</span>
                  <span className={styles.statLabel}>Pattern</span>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ═══ LANDING — Subject Cards ════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {!activeSubject && (
          <>
            {loading ? (
              <div className={styles.subjectGrid}>
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} width="100%" height="200px" borderRadius="var(--radius-xl)" />
                ))}
              </div>
            ) : (
              <div className={styles.subjectGrid}>
                {SUBJECTS.map((s, i) => {
                  const count = countBySubject[s.key] || 0;
                  const latest = latestBySubject[s.key] || [];
                  return (
                    <ScrollReveal key={s.key} delay={i * 60}>
                      <button
                        className={styles.subjectCard}
                        style={{ '--accent-color': s.color }}
                        onClick={() => setActiveSubject(s.key)}
                      >
                        {/* Glow stripe */}
                        <div className={styles.cardGlow} style={{ background: `linear-gradient(135deg, ${s.color}30, transparent)` }}></div>
                        
                        {/* Top row */}
                        <div className={styles.cardTop}>
                          <div className={styles.subjectEmoji} style={{ background: `${s.color}15`, borderColor: `${s.color}30` }}>
                            {s.emoji}
                          </div>
                          <div className={styles.cardBadge} style={{ color: s.color, background: `${s.color}15` }}>
                            {count} papers
                          </div>
                        </div>

                        {/* Subject name */}
                        <h3 className={styles.subjectName}>{s.label}</h3>

                        {/* Latest papers preview */}
                        {latest.length > 0 && (
                          <div className={styles.latestStack}>
                            {latest.map((p, j) => (
                              <div key={p.id} className={styles.latestItem} style={{ '--i': j }}>
                                <span className={styles.latestDot} style={{ background: s.color }}></span>
                                <span className={styles.latestText}>
                                  {parseExamWindow(p.title)} {parsePeriod(p.title)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Bottom bar */}
                        <div className={styles.cardBottom}>
                          <span className={styles.subjectPattern}>2019 Pattern</span>
                          <span className={styles.subjectArrow} style={{ color: s.color }}>
                            View All →
                          </span>
                        </div>
                      </button>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ═══ DRILL-DOWN — Paper List ════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeSubject && (
          <>
            {/* ── Filter Bar (Option D) ────────────────────────────────────── */}
            <ScrollReveal delay={100}>
              <div className={styles.filterBar}>
                <div className={styles.yearChips}>
                  {availableYears.map(y => (
                    <button
                      key={y}
                      className={`${styles.yearChip} ${yearFilter === y ? styles.yearChipActive : ''}`}
                      style={yearFilter === y ? { background: activeMeta?.color, borderColor: activeMeta?.color } : {}}
                      onClick={() => setYearFilter(y)}
                    >
                      {y}
                    </button>
                  ))}
                </div>
                <div className={styles.searchBox}>
                  <IconSearch size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search papers..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </ScrollReveal>

            <p className={styles.resultsCount}>
              Showing <strong>{filtered.length}</strong> of {subjectPyqs.length} papers
            </p>

            {/* ── Paper Grid ───────────────────────────────────────────────── */}
            {loading ? (
              <div className={styles.paperGrid}>
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} variant="card" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                <h3>No papers found</h3>
                <p>Try adjusting the year filter or search term.</p>
              </div>
            ) : (
              <div className={styles.paperGrid}>
                {filtered.map((item, i) => {
                  const examWindow = parseExamWindow(item.title);
                  const yearStr = parsePeriod(item.title);
                  return (
                    <ScrollReveal key={item.id} delay={i * 35}>
                      <div className={styles.paperCard} style={{ '--accent-color': activeMeta?.color }}>
                        {/* Shimmer stripe */}
                        <div className={styles.paperShimmer} style={{ background: `linear-gradient(135deg, ${activeMeta?.color}12, transparent 60%)` }}></div>
                        
                        <div className={styles.paperHeader}>
                          <div className={styles.paperIcon} style={{ background: `${activeMeta?.color}15`, color: activeMeta?.color }}>
                            <IconPyq size={22} />
                          </div>
                          <div className={styles.paperBadges}>
                            {examWindow && (
                              <span className={styles.examBadge}>{examWindow}</span>
                            )}
                            <span className={styles.paperYear} style={{ color: activeMeta?.color, background: `${activeMeta?.color}15` }}>
                              {yearStr}
                            </span>
                          </div>
                        </div>

                        <h3 className={styles.paperTitle}>{item.title}</h3>

                        <div className={styles.paperMeta}>
                          <span><IconHat size={13} /> {item.branch || 'All Branches'}</span>
                          <span><IconUser size={13} /> {item.uploader || 'Admin'}</span>
                        </div>

                        <div className={styles.paperFooter}>
                          <div className={styles.paperStats}>
                            <span title="Downloads"><IconDownload size={14} /> {item.downloads || 0}</span>
                            <span title="Rating"><IconStar size={14} /> {item.rating || 'New'}</span>
                          </div>
                          <button
                            className={styles.downloadBtn}
                            style={{ background: activeMeta?.color, boxShadow: `0 4px 14px ${activeMeta?.color}44` }}
                            onClick={() => handleDownload(item)}
                          >
                            <IconDownload size={16} /> Download
                          </button>
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

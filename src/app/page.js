'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { awardDownloadPoints } from '@/lib/points';
import { ScrollReveal, CountUp } from '@/components/Animations';
import styles from './page.module.css';
import { IconNotes, IconPyq, IconAssignment, IconSparkles, IconUser, IconFolder, IconHat, IconStar, IconDownload } from '@/components/Icons';
import { Skeleton, SkeletonGrid } from '@/components/Skeleton/Skeleton';

function getTypeClass(type) {
  switch (type) {
    case 'Notes': return styles.typeNotes;
    case 'PYQ': return styles.typePyq;
    case 'Assignment': return styles.typeAssignment;
    default: return styles.typeNotes;
  }
}

export default function HomePage() {
  const [heroQuery, setHeroQuery] = useState('');
  const [recentFiles, setRecentFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [topContributors, setTopContributors] = useState([]);
  const [platformStats, setPlatformStats] = useState({ notes: 0, students: 0, pyqs: 0, subjects: 0 });
  const [latestNews, setLatestNews] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [clubsCount, setClubsCount] = useState(0);
  const router = useRouter();
  const { user } = useAuth();
  const heroRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const fetchRecent = async () => {
      setLoadingFiles(true);
      try {
        if (!db) throw new Error('Firestore not initialized');
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
        const fetchPromise = getDocs(collection(db, 'files'));
        const snapshot = await Promise.race([fetchPromise, timeout]);
        if (cancelled) return;
        
        const data = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(f => f.status === 'approved');
          
        let notesCount = 0;
        let pyqsCount = 0;
        const subjectsSet = new Set();
        const uploadersSet = new Set();

        data.forEach(f => {
            if (f.type === 'Notes') notesCount++;
            if (f.type === 'PYQ') pyqsCount++;
            if (f.subject) subjectsSet.add(f.subject);
            if (f.uploaderUID || f.uploader) uploadersSet.add(f.uploaderUID || f.uploader);
        });

        setPlatformStats({
            notes: notesCount > 0 ? notesCount : 1, 
            pyqs: pyqsCount > 0 ? pyqsCount : 1,
            subjects: subjectsSet.size > 0 ? subjectsSet.size : 5,
            students: uploadersSet.size > 0 ? uploadersSet.size * 2 : 10 
        });

        data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setRecentFiles(data.slice(0, 6));
      } catch (error) {
        console.error('Error fetching recent files:', error);
        if (!cancelled) setRecentFiles([]);
      }
      if (!cancelled) setLoadingFiles(false);
    };

    const fetchLeaderboard = async () => {
        try {
            const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(4));
            const snapshot = await getDocs(q);
            if (cancelled) return;
            const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setTopContributors(users);
        } catch (e) {
            console.error('Leaderboard error:', e);
        }
    };

    const fetchClubsCount = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'clubs'));
            if (cancelled) return;
            setClubsCount(snapshot.size > 0 ? snapshot.size : 12);
        } catch (e) {
            setClubsCount(12);
        }
    };

    // Live news subscription
    let unsubNews;
    try {
        const newsQ = query(collection(db, 'news'), orderBy('timestamp', 'desc'), limit(5));
        unsubNews = onSnapshot(newsQ, (snapshot) => {
            if (cancelled) return;
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            if (data.length === 0) {
                setLatestNews([
                    { id: 'n1', title: 'Midterm Schedules Released', type: 'Urgent', timestamp: { toDate: () => new Date() } },
                    { id: 'n2', title: 'Annual Tech Symposium 2026', type: 'Event', timestamp: { toDate: () => new Date(Date.now() - 86400000) } },
                    { id: 'n3', title: 'Spring Career Fair — May 15th', type: 'Event', timestamp: { toDate: () => new Date(Date.now() - 86400000 * 3) } },
                ]);
            } else {
                setLatestNews(data);
            }
        });
    } catch (e) {
        setLatestNews([
            { id: 'n1', title: 'Midterm Schedules Released', type: 'Urgent' },
            { id: 'n2', title: 'Annual Tech Symposium 2026', type: 'Event' },
        ]);
    }

    // Community posts
    let unsubPosts;
    try {
        const postsQ = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(3));
        unsubPosts = onSnapshot(postsQ, (snapshot) => {
            if (cancelled) return;
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            if (data.length === 0) {
                setCommunityPosts([
                    { id: 'p1', authorName: 'Rahul Dev', content: '🚀 Just submitted my final year project — an AI-powered campus chatbot!', likes: ['u1','u2','u3','u4'], commentsCount: 7 },
                    { id: 'p2', authorName: 'Alice Johnson', content: 'Does anyone have the notes from yesterday\'s DSA lecture?', likes: ['u1','u2'], commentsCount: 3 },
                ]);
            } else {
                setCommunityPosts(data);
            }
        });
    } catch (e) {
        setCommunityPosts([]);
    }

    fetchRecent();
    fetchLeaderboard();
    fetchClubsCount();
    return () => {
        cancelled = true;
        if (unsubNews) unsubNews();
        if (unsubPosts) unsubPosts();
    };
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      router.push(`/notes?q=${encodeURIComponent(heroQuery.trim())}`);
    }
  };

  const handleDownload = async (file) => {
    if (!file.fileURL) return;
    try {
      await awardDownloadPoints(file.id, file.uploaderUID, user?.uid);
      setRecentFiles(prev => prev.map(f => f.id === file.id ? { ...f, downloads: (f.downloads || 0) + 1 } : f));
    } catch (e) { console.warn('Could not update download count:', e.message); }
    window.open(file.fileURL, '_blank');
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatNewsDate = (timestamp) => {
    if (!timestamp?.toDate) return 'Recently';
    const d = timestamp.toDate();
    const diff = Date.now() - d;
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNewsTypeColor = (type) => {
    switch (type) {
      case 'Urgent': return '#ef4444';
      case 'Event': return '#06b6d4';
      default: return '#3b82f6';
    }
  };

  const getNewsTypeEmoji = (type) => {
    switch (type) {
      case 'Urgent': return '🚨';
      case 'Event': return '📅';
      default: return 'ℹ️';
    }
  };

  const userSubjects = user?.subjects || [];
  const userBranch = user?.branch || '';
  const userYear = user?.year || '';

  const recommended = userSubjects.length > 0
    ? recentFiles.filter(n =>
      userSubjects.some(s => n.subject?.toLowerCase().includes(s.toLowerCase())) ||
      n.branch === userBranch || n.year === userYear
    )
    : recentFiles;

  const displayFiles = recommended.length > 0 ? recommended : recentFiles;
  const sectionLabel = userSubjects.length > 0 && recommended.length > 0 ? '🎯 Recommended for You' : '📌 Recent Uploads';

  const rankEmojis = ['🥇', '🥈', '🥉', '🏅'];

  return (
    <>
      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ HERO — IMMERSIVE LANDING ═══════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.hero} ref={heroRef}>
        {/* Floating orbs */}
        <div className={styles.heroOrb1}></div>
        <div className={styles.heroOrb2}></div>
        <div className={styles.heroOrb3}></div>

        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot}></span>
            Student OS — Built for Campus Life
          </div>

          <h1 className={styles.heroTitle}>
            <span className={styles.heroLine1}>Your College,</span>
            <span className={styles.heroLine2}>
              <span className={styles.heroGradientText}>Simplified.</span>
            </span>
          </h1>

          <p className={styles.heroSubtitle}>
            Notes, PYQs, clubs, community, and campus news — beautifully organized in one platform that students actually love using.
          </p>

          <form className={styles.heroSearchBar} onSubmit={handleHeroSearch}>
            <span className={styles.heroSearchIcon}>🔍</span>
            <input
              type="text"
              className={styles.heroSearchInput}
              placeholder="Search for DBMS notes, DSA questions, Physics..."
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
            />
            <button type="submit" className={styles.heroSearchBtn}>
              Search
            </button>
          </form>

          {/* Floating stat pills */}
          <div className={styles.heroStatPills}>
            <div className={styles.heroPill}>
              <span className={styles.heroPillIcon}>📄</span>
              <span><CountUp end={platformStats.notes} suffix="+" /> Notes</span>
            </div>
            <div className={styles.heroPill}>
              <span className={styles.heroPillIcon}>👥</span>
              <span><CountUp end={platformStats.students} suffix="+" /> Students</span>
            </div>
            <div className={styles.heroPill}>
              <span className={styles.heroPillIcon}>🏢</span>
              <span><CountUp end={clubsCount} suffix="+" /> Clubs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ QUICK ACCESS — FLOATING DOCK ════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.dockSection}>
        <div className={styles.dockContainer}>
          {[
            { href: '/notes', icon: <IconNotes size={26} />, label: 'Notes', color: '#3b82f6', desc: 'Study material' },
            { href: '/assistant', icon: null, emoji: '🤖', label: 'AI Tutor', color: '#8b5cf6', desc: 'Study help' },
            { href: '/pyqs', icon: <IconPyq size={26} />, label: 'PYQs', color: '#22d3ee', desc: 'Past papers' },
            { href: '/assignments', icon: <IconAssignment size={26} />, label: 'Assignments', color: '#f472b6', desc: 'Solutions' },
            { href: '/community', icon: null, emoji: '💬', label: 'Community', color: '#06b6d4', desc: 'Discussions' },
            { href: '/clubs', icon: null, emoji: '🏢', label: 'Clubs', color: '#ef4444', desc: 'Campus clubs' },
            { href: '/news', icon: null, emoji: '📰', label: 'News', color: '#10b981', desc: 'Announcements' },
          ].map((item, i) => (
            <ScrollReveal key={item.href} delay={i * 60}>
              <Link href={item.href} className={styles.dockItem}>
                <div className={styles.dockIcon} style={{ background: `${item.color}18`, color: item.color }}>
                  {item.icon || <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>}
                </div>
                <span className={styles.dockLabel}>{item.label}</span>
                <span className={styles.dockDesc}>{item.desc}</span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ LIVE NEWS TICKER ════════════════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      {latestNews.length > 0 && (
        <section className={styles.tickerSection}>
          <div className={styles.tickerBar}>
            <div className={styles.tickerLabel}>
              <span className={styles.tickerDot}></span>
              LIVE
            </div>
            <div className={styles.tickerTrack}>
              <div className={styles.tickerSlide}>
                {[...latestNews, ...latestNews].map((item, i) => (
                  <Link href="/news" key={`${item.id}-${i}`} className={styles.tickerItem}>
                    <span style={{ color: getNewsTypeColor(item.type) }}>{getNewsTypeEmoji(item.type)}</span>
                    <span>{item.title}</span>
                    <span className={styles.tickerTime}>{formatNewsDate(item.timestamp)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ CAMPUS LIFE — MAGAZINE LAYOUT ══════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.campusSection}>
        <ScrollReveal>
          <div className={styles.campusHeader}>
            <div className={styles.campusHeaderLeft}>
              <span className={styles.campusBadge}>🏫 Beyond the classroom</span>
              <h2 className={styles.campusTitle}>Campus Life</h2>
              <p className={styles.campusSubtitle}>Connect, collaborate, and never miss what's happening on campus.</p>
            </div>
          </div>
        </ScrollReveal>

        <div className={styles.campusGrid}>
          {/* ── COMMUNITY — Hero Card ── */}
          <ScrollReveal delay={0}>
            <Link href="/community" className={`${styles.campusCard} ${styles.campusCardHero}`}>
              <div className={styles.campusCardShimmer}></div>
              <div className={styles.campusCardGradient} style={{ background: 'linear-gradient(160deg, #8b5cf630 0%, #06b6d415 100%)' }}></div>
              <div className={styles.campusCardInner}>
                <div className={styles.campusCardTop}>
                  <div className={styles.campusCardIconLg} style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
                    💬
                  </div>
                  <div className={styles.campusLiveDot}>
                    <span className={styles.campusLivePing}></span>
                    <span className={styles.campusLiveCore}></span>
                  </div>
                </div>
                <h3 className={styles.campusCardName}>Community</h3>
                <p className={styles.campusCardDesc}>
                  Real-time discussions, peer support, and campus updates from every department — your digital quad.
                </p>

                {/* Live feed preview */}
                {communityPosts.length > 0 && (
                  <div className={styles.campusFeed}>
                    {communityPosts.slice(0, 3).map((post, i) => (
                      <div key={post.id} className={styles.campusFeedItem} style={{ animationDelay: `${i * 150}ms` }}>
                        <div className={styles.campusFeedAvatar} style={{ background: ['#8b5cf6','#3b82f6','#ec4899'][i % 3] }}>
                          {post.authorName?.charAt(0) || '?'}
                        </div>
                        <div className={styles.campusFeedBody}>
                          <span className={styles.campusFeedAuthor}>{post.authorName}</span>
                          <span className={styles.campusFeedText}>{post.content?.slice(0, 55)}...</span>
                        </div>
                        <div className={styles.campusFeedMeta}>
                          ❤️ {post.likes?.length || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.campusCardAction}>
                  <span>Join the conversation</span>
                  <span className={styles.campusArrowIcon}>→</span>
                </div>
              </div>
            </Link>
          </ScrollReveal>

          {/* Right column */}
          <div className={styles.campusRight}>
            {/* ── CLUBS ── */}
            <ScrollReveal delay={120}>
              <Link href="/clubs" className={`${styles.campusCard} ${styles.campusCardClubs}`}>
                <div className={styles.campusCardShimmer}></div>
                <div className={styles.campusCardGradient} style={{ background: 'linear-gradient(160deg, #f59e0b20 0%, #ef444415 100%)' }}></div>
                <div className={styles.campusCardInner}>
                  <div className={styles.campusCardTop}>
                    <div className={styles.campusCardIconLg} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                      🏢
                    </div>
                    <div className={styles.campusCountBadge}>
                      <span className={styles.campusCountNum}>{clubsCount}+</span>
                      <span className={styles.campusCountLabel}>clubs</span>
                    </div>
                  </div>
                  <h3 className={styles.campusCardName}>Campus Clubs</h3>
                  <p className={styles.campusCardDesc}>Coding marathons, robotics, drama, debate — find your tribe.</p>

                  <div className={styles.campusTagsRow}>
                    {[
                      { label: '💻 Tech', color: '#3b82f6' },
                      { label: '🎨 Arts', color: '#ec4899' },
                      { label: '⚽ Sports', color: '#22c55e' },
                      { label: '💼 Business', color: '#f59e0b' },
                      { label: '🔬 Science', color: '#8b5cf6' },
                    ].map(tag => (
                      <span key={tag.label} className={styles.campusTag} style={{ color: tag.color, borderColor: `${tag.color}40`, background: `${tag.color}10` }}>
                        {tag.label}
                      </span>
                    ))}
                  </div>

                  <div className={styles.campusCardAction}>
                    <span>Browse all clubs</span>
                    <span className={styles.campusArrowIcon}>→</span>
                  </div>
                </div>
              </Link>
            </ScrollReveal>

            {/* ── NEWS ── */}
            <ScrollReveal delay={220}>
              <Link href="/news" className={`${styles.campusCard} ${styles.campusCardNews}`}>
                <div className={styles.campusCardShimmer}></div>
                <div className={styles.campusCardGradient} style={{ background: 'linear-gradient(160deg, #ef444420 0%, #f9731615 100%)' }}></div>
                <div className={styles.campusCardInner}>
                  <div className={styles.campusCardTop}>
                    <div className={styles.campusCardIconLg} style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
                      📰
                    </div>
                    <div className={styles.campusLiveDot}>
                      <span className={styles.campusLivePing} style={{ background: '#ef4444' }}></span>
                      <span className={styles.campusLiveCore} style={{ background: '#ef4444' }}></span>
                    </div>
                  </div>
                  <h3 className={styles.campusCardName}>College News</h3>
                  <p className={styles.campusCardDesc}>Never miss an announcement or event.</p>

                  {latestNews.length > 0 && (
                    <div className={styles.campusNewsList}>
                      {latestNews.slice(0, 3).map((item, i) => (
                        <div key={item.id} className={styles.campusNewsRow}>
                          <span className={styles.campusNewsType} style={{ background: getNewsTypeColor(item.type) }}>
                            {getNewsTypeEmoji(item.type)}
                          </span>
                          <span className={styles.campusNewsText}>{item.title}</span>
                          <span className={styles.campusNewsTime}>{formatNewsDate(item.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.campusCardAction}>
                    <span>View bulletin</span>
                    <span className={styles.campusArrowIcon}>→</span>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ RECENT UPLOADS / RECOMMENDED ════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.uploadsSection}>
        <ScrollReveal>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sectionLabel}</h2>
            <Link href="/notes" className={styles.sectionLink}>View all →</Link>
          </div>
        </ScrollReveal>
        <div className={styles.uploadsGrid}>
          {loadingFiles ? (
            <>
              {[1,2,3].map(i => (
                <Skeleton key={i} variant="card" />
              ))}
            </>
          ) : displayFiles.length === 0 ? (
            <div className={styles.emptyGrid}>
              No approved uploads yet. <Link href="/upload" style={{ color: 'var(--primary)', fontWeight: 600 }}>Be the first to upload!</Link>
            </div>
          ) : (
            displayFiles.map((note, i) => (
              <ScrollReveal key={note.id} delay={i * 80}>
                <div className={styles.uploadCard}>
                  <div className={styles.uploadCardAccent} style={{
                    background: note.type === 'Notes' ? 'var(--primary)' : note.type === 'PYQ' ? 'var(--secondary)' : 'var(--accent)'
                  }}></div>
                  <div className={styles.uploadCardBody}>
                    <span className={`${styles.uploadType} ${getTypeClass(note.type)}`}>
                      {note.type}
                    </span>
                    <h3 className={styles.uploadTitle}>{note.title}</h3>
                    <div className={styles.uploadMeta}>
                      <span><IconUser /> {note.uploader}</span>
                      <span><IconFolder /> {note.subject}</span>
                      <span><IconHat /> {note.year}</span>
                    </div>
                    <div className={styles.uploadFooter}>
                      <div className={styles.uploadRating}>
                        <IconStar /> {note.rating > 0 ? note.rating : 'New'}
                      </div>
                      <button className={styles.downloadBtn} onClick={() => handleDownload(note)}>
                        <IconDownload size={16} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ WHY SUTRAS + HOW IT WORKS (SPLIT) ══════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.whySection}>
        <ScrollReveal>
          <div className={styles.sectionHeader} style={{ justifyContent: 'center', textAlign: 'center', display: 'block' }}>
            <h2 className={styles.sectionTitle}>✨ Why Students Love Sutras</h2>
          </div>
        </ScrollReveal>
        <div className={styles.whyGrid}>
          {[
            { emoji: '🚀', title: 'Instant Access', desc: 'Premium notes and solutions on any device. No paywalls, no waiting — ever.' },
            { emoji: '🤝', title: 'Community Driven', desc: 'Upload notes, earn points, climb the leaderboard, and help juniors succeed.' },
            { emoji: '⚡', title: 'Exam Mode', desc: 'AI-powered last-night prep with unit summaries and most-asked questions.' }
          ].map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 100}>
              <div className={styles.whyCard}>
                <div className={styles.whyEmoji}>{f.emoji}</div>
                <h3 className={styles.whyCardTitle}>{f.title}</h3>
                <p className={styles.whyCardDesc}>{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* How it works — inline process */}
        <ScrollReveal delay={100}>
          <div className={styles.processBar}>
            {[
              { step: '1', title: 'Create Profile', desc: 'Sign up and select your major' },
              { step: '2', title: 'Download Materials', desc: 'Instant free access to notes' },
              { step: '3', title: 'Upload & Rank Up', desc: 'Earn rep points & badges' },
            ].map((s, i) => (
              <div key={s.step} className={styles.processStep}>
                <div className={styles.processNum}>{s.step}</div>
                <div className={styles.processInfo}>
                  <div className={styles.processTitle}>{s.title}</div>
                  <div className={styles.processDesc}>{s.desc}</div>
                </div>
                {i < 2 && <div className={styles.processConnector}></div>}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ LEADERBOARD + STATS COMBINED ════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.socialProofSection}>
        <div className={styles.socialProofGrid}>
          {/* Leaderboard */}
          <ScrollReveal delay={0}>
            <div className={styles.leaderboardCard}>
              <div className={styles.leaderboardHeader}>
                <h3>🏆 Top Contributors</h3>
                <span>Monthly</span>
              </div>
              <div className={styles.leaderboardList}>
                {topContributors.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                    {[1,2,3,4].map(i => <Skeleton key={i} variant="avatar-row" size={44} />)}
                  </div>
                ) : (
                  topContributors.map((c, i) => (
                    <div key={c.id} className={styles.leaderboardRow}>
                      <span className={styles.leaderboardRank}>{rankEmojis[i] || `#${i+1}`}</span>
                      <div className={styles.leaderboardAvatar}>
                        {c.photoURL ? <img src={c.photoURL} alt="" /> : getInitials(c.name)}
                      </div>
                      <div className={styles.leaderboardInfo}>
                        <span className={styles.leaderboardName}>{c.name}</span>
                        <span className={styles.leaderboardPts}>⭐ {c.points || 0} pts</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Stats Grid */}
          <ScrollReveal delay={100}>
            <div className={styles.statsCard}>
              <h3 className={styles.statsCardTitle}>📊 Platform at a Glance</h3>
              <div className={styles.statsInnerGrid}>
                <div className={styles.statCell}>
                  <div className={styles.statCellIcon} style={{ background: '#3b82f618', color: '#3b82f6' }}>📄</div>
                  <div className={styles.statCellNum}><CountUp end={platformStats.notes} suffix="+" /></div>
                  <div className={styles.statCellLabel}>Notes</div>
                </div>
                <div className={styles.statCell}>
                  <div className={styles.statCellIcon} style={{ background: '#22d3ee18', color: '#22d3ee' }}>👥</div>
                  <div className={styles.statCellNum}><CountUp end={platformStats.students} suffix="+" /></div>
                  <div className={styles.statCellLabel}>Students</div>
                </div>
                <div className={styles.statCell}>
                  <div className={styles.statCellIcon} style={{ background: '#f472b618', color: '#f472b6' }}>📝</div>
                  <div className={styles.statCellNum}><CountUp end={platformStats.pyqs} suffix="+" /></div>
                  <div className={styles.statCellLabel}>PYQs</div>
                </div>
                <div className={styles.statCell}>
                  <div className={styles.statCellIcon} style={{ background: '#f59e0b18', color: '#f59e0b' }}>📚</div>
                  <div className={styles.statCellNum}><CountUp end={platformStats.subjects} suffix="+" /></div>
                  <div className={styles.statCellLabel}>Subjects</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ CTA BANNER ═════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.ctaSection}>
        <ScrollReveal>
          <div className={styles.ctaCard}>
            <div className={styles.ctaOrb}></div>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Ready to level up your college experience?</h2>
              <p className={styles.ctaDesc}>
                Join thousands of students already using Sutras to ace exams, build connections, and make campus life unforgettable.
              </p>
              <div className={styles.ctaActions}>
                {!user ? (
                  <Link href="/signup" className={styles.ctaBtnPrimary}>
                    Get Started Free →
                  </Link>
                ) : (
                  <Link href="/upload" className={styles.ctaBtnPrimary}>
                    Upload Resources →
                  </Link>
                )}
                <Link href="/community" className={styles.ctaBtnSecondary}>
                  Explore Community
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ FOOTER ═════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>📚 Sutras</span>
              <p className={styles.footerTagline}>The Student OS — Built for Campus Life</p>
            </div>
            <div className={styles.footerColumns}>
              <div className={styles.footerCol}>
                <h4>Resources</h4>
                <Link href="/notes">Notes</Link>
                <Link href="/pyqs">PYQs</Link>
                <Link href="/assignments">Assignments</Link>
                <Link href="/upload">Upload</Link>
              </div>
              <div className={styles.footerCol}>
                <h4>Campus</h4>
                <Link href="/community">Community</Link>
                <Link href="/clubs">Clubs</Link>
                <Link href="/news">News</Link>
                <Link href="/exam-mode">Exam Mode</Link>
              </div>
              <div className={styles.footerCol}>
                <h4>Legal</h4>
                <Link href="/privacy-policy">Privacy Policy</Link>
                <Link href="/terms-of-service">Terms of Service</Link>
                <Link href="/cookie-policy">Cookie Policy</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 Sutras. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
}

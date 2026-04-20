'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, increment, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { awardDownloadPoints } from '@/lib/points';
import { ScrollReveal, TextReveal, CountUp } from '@/components/Animations';
import styles from './page.module.css';
import { IconNotes, IconPyq, IconAssignment, IconSparkles, IconUser, IconFolder, IconHat, IconStar, IconDownload } from '@/components/Icons';

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
        const newsQ = query(collection(db, 'news'), orderBy('timestamp', 'desc'), limit(3));
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

  return (
    <>
      <div className={styles.heroBackgroundAnimation}></div>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <ScrollReveal delay={0}>
            <span className={styles.heroTag}>🚀 Sutras — The Student OS</span>
          </ScrollReveal>

          <h1 className={styles.heroTitle}>
            <TextReveal text="Find Notes. Ace Exams." tag="span" delay={150} />
            <br />
            <span className={`${styles.heroTitleAccent} text-shimmer`}>Study Smarter.</span>
          </h1>

          <ScrollReveal delay={300}>
            <p className={styles.heroSubtitle}>
              Access premium notes, previous year questions, campus news, student clubs, and a thriving community — all beautifully organized in one place.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <form className={styles.heroSearch} onSubmit={handleHeroSearch}>
              <input
                type="text"
                className={styles.heroSearchInput}
                placeholder="Search for DBMS, DSA basics, or unit summaries..."
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
              />
              <button type="submit" className={styles.heroSearchBtn}>Search</button>
            </form>
          </ScrollReveal>
        </div>
      </section>

      {/* Quick Access */}
      <section className={styles.quickAccess}>
        <div className={`${styles.quickGrid} stagger-children`}>
          <Link href="/notes" className={`${styles.quickCard} hover-lift`}>
            <div className={`${styles.quickIcon} ${styles.quickIconNotes}`}><IconNotes size={28} /></div>
            <div className={styles.quickTitle}>Notes</div>
            <div className={styles.quickDesc}>Subject-wise study material</div>
          </Link>
          <Link href="/pyqs" className={`${styles.quickCard} hover-lift`}>
            <div className={`${styles.quickIcon} ${styles.quickIconPyqs}`}><IconPyq size={28} /></div>
            <div className={styles.quickTitle}>PYQs</div>
            <div className={styles.quickDesc}>Previous year questions</div>
          </Link>
          <Link href="/assignments" className={`${styles.quickCard} hover-lift`}>
            <div className={`${styles.quickIcon} ${styles.quickIconAssign}`}><IconAssignment size={28} /></div>
            <div className={styles.quickTitle}>Assignments</div>
            <div className={styles.quickDesc}>Ready solutions & code</div>
          </Link>
          <Link href="/exam-mode" className={`${styles.quickCard} hover-lift`}>
            <div className={`${styles.quickIcon} ${styles.quickIconExam}`}><IconSparkles size={28} /></div>
            <div className={styles.quickTitle}>Exam Mode</div>
            <div className={styles.quickDesc}>Last night prep</div>
          </Link>
        </div>
      </section>

      {/* ═══ CAMPUS LIFE — NEW SECTION ═══ */}
      <section className={styles.section}>
        <ScrollReveal>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🏫 Campus Life</h2>
            <span className={styles.sectionSubtext}>Stay connected beyond the classroom</span>
          </div>
        </ScrollReveal>

        <div className={styles.campusGrid}>
          {/* Community Card */}
          <ScrollReveal delay={0}>
            <Link href="/community" className={styles.campusCard} style={{ textDecoration: 'none' }}>
              <div className={styles.campusCardStrip} style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}></div>
              <div className={styles.campusCardBody}>
                <div className={styles.campusCardIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>💬</div>
                <h3 className={styles.campusCardTitle}>Community</h3>
                <p className={styles.campusCardDesc}>
                  Ask questions, share updates, and connect with peers across every department. Real-time discussions powered by your campus.
                </p>
                <div className={styles.campusCardMeta}>
                  {communityPosts.length > 0 && (
                    <div className={styles.campusPreviewList}>
                      {communityPosts.slice(0, 2).map(post => (
                        <div key={post.id} className={styles.campusPreviewItem}>
                          <span className={styles.campusPreviewAuthor}>{post.authorName}</span>
                          <span className={styles.campusPreviewText}>{post.content?.slice(0, 50)}...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.campusCardCta}>
                  Join the conversation <span className={styles.campusArrow}>→</span>
                </div>
              </div>
            </Link>
          </ScrollReveal>

          {/* Clubs Card */}
          <ScrollReveal delay={100}>
            <Link href="/clubs" className={styles.campusCard} style={{ textDecoration: 'none' }}>
              <div className={styles.campusCardStrip} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}></div>
              <div className={styles.campusCardBody}>
                <div className={styles.campusCardIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>🏢</div>
                <h3 className={styles.campusCardTitle}>Campus Clubs</h3>
                <p className={styles.campusCardDesc}>
                  Discover {clubsCount}+ student clubs — from coding marathons and robotics to drama, debate, and entrepreneurship. Find your tribe.
                </p>
                <div className={styles.campusCardMeta}>
                  <div className={styles.clubChips}>
                    <span className={styles.clubChip} style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>💻 Tech</span>
                    <span className={styles.clubChip} style={{ borderColor: '#ec4899', color: '#ec4899' }}>🎨 Arts</span>
                    <span className={styles.clubChip} style={{ borderColor: '#22c55e', color: '#22c55e' }}>⚽ Sports</span>
                    <span className={styles.clubChip} style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>💼 Biz</span>
                  </div>
                </div>
                <div className={styles.campusCardCta}>
                  Browse all clubs <span className={styles.campusArrow}>→</span>
                </div>
              </div>
            </Link>
          </ScrollReveal>

          {/* News Card */}
          <ScrollReveal delay={200}>
            <Link href="/news" className={styles.campusCard} style={{ textDecoration: 'none' }}>
              <div className={styles.campusCardStrip} style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}></div>
              <div className={styles.campusCardBody}>
                <div className={styles.campusCardIcon} style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>📰</div>
                <h3 className={styles.campusCardTitle}>College News</h3>
                <p className={styles.campusCardDesc}>
                  Official campus announcements, event updates, and urgent notices — never miss what matters on campus.
                </p>
                <div className={styles.campusCardMeta}>
                  {latestNews.length > 0 && (
                    <div className={styles.campusPreviewList}>
                      {latestNews.slice(0, 2).map(item => (
                        <div key={item.id} className={styles.newsPreviewItem}>
                          <span className={styles.newsPreviewDot} style={{ background: getNewsTypeColor(item.type) }}></span>
                          <span className={styles.newsPreviewTitle}>{item.title}</span>
                          <span className={styles.newsPreviewTime}>{formatNewsDate(item.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.campusCardCta}>
                  View bulletin <span className={styles.campusArrow}>→</span>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Why Choose Sutras? */}
      <section className={styles.section}>
        <ScrollReveal>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>✨ Why Choose Sutras?</h2>
          </div>
        </ScrollReveal>
        <div className={styles.featuresGrid}>
          <ScrollReveal delay={0}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🚀</div>
              <h3 className={styles.featureTitle}>Instant Access anywhere</h3>
              <p className={styles.featureDesc}>Get high-quality PDF notes and solutions on your phone, tablet or laptop instantly. No paywalls, no waiting.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤝</div>
              <h3 className={styles.featureTitle}>Community Driven</h3>
              <p className={styles.featureDesc}>Contribute to the platform by uploading your own notes. Earn points, climb the leaderboard, and help your juniors succeed.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚡</div>
              <h3 className={styles.featureTitle}>Last Night Exam Mode</h3>
              <p className={styles.featureDesc}>Stressed about tomorrow's exam? Use our exclusive AI-powered Exam Mode to study unit-wise summaries and the most frequently asked questions.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.section} style={{ borderRadius: 'var(--radius-xl)', padding: '40px' }}>
        <ScrollReveal>
          <div className={styles.sectionHeader} style={{ textAlign: 'center', display: 'block', marginBottom: '40px' }}>
            <h2 className={styles.sectionTitle}>⚙️ How It Works</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Join the system in 3 easy steps</p>
          </div>
        </ScrollReveal>
        <div className={styles.featuresGrid}>
          <ScrollReveal delay={0}>
            <div className={styles.featureCard} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <div className={styles.statNumber} style={{ color: 'var(--primary-light)' }}>1</div>
              <h3 className={styles.featureTitle}>Create Profile</h3>
              <p className={styles.featureDesc}>Sign up and select your major, college, and current semester.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className={styles.featureCard} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <div className={styles.statNumber} style={{ color: 'var(--secondary)' }}>2</div>
              <h3 className={styles.featureTitle}>Download Materials</h3>
              <p className={styles.featureDesc}>Get instant, free access to notes curated exactly for your subjects.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className={styles.featureCard} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
             <div className={styles.statNumber} style={{ color: 'var(--accent)' }}>3</div>
              <h3 className={styles.featureTitle}>Upload & Rank Up</h3>
              <p className={styles.featureDesc}>Share your own files. Earn rep points and become a Top Contributor.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Personalized / Recent Uploads */}
      <section className={styles.section}>
        <ScrollReveal>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sectionLabel}</h2>
            <Link href="/notes" className={styles.sectionLink}>View all →</Link>
          </div>
        </ScrollReveal>
        <div className={styles.recentGrid}>
          {loadingFiles ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              Loading recent uploads...
            </div>
          ) : displayFiles.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              No approved uploads yet. <Link href="/upload" style={{ color: 'var(--primary)', fontWeight: 600 }}>Be the first to upload!</Link>
            </div>
          ) : (
            displayFiles.map((note, i) => (
              <ScrollReveal key={note.id} delay={i * 100}>
                <div className={`${styles.noteCard} hover-lift`}>
                  <div className={styles.noteCardBody}>
                    <span className={`${styles.noteCardType} ${getTypeClass(note.type)}`}>
                      {note.type}
                    </span>
                    <h3 className={styles.noteCardTitle}>{note.title}</h3>
                    <div className={styles.noteCardMeta}>
                      <span><IconUser /> {note.uploader}</span>
                      <span><IconFolder /> {note.subject}</span>
                      <span><IconHat /> {note.year}</span>
                    </div>
                    <div style={{ flexGrow: 1 }}></div>
                    <div className={styles.noteCardFooter}>
                      <div className={styles.noteCardRating}>
                        <IconStar /> {note.rating > 0 ? note.rating : 'New'}
                      </div>
                      <button className={styles.downloadBtn} onClick={() => handleDownload(note)}>
                        <IconDownload size={18} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))
          )}
        </div>
      </section>

      {/* ═══ LIVE NEWS TICKER — NEW ═══ */}
      {latestNews.length > 0 && (
        <section className={styles.newsTicker}>
          <ScrollReveal>
            <div className={styles.newsTickerInner}>
              <div className={styles.newsTickerLabel}>
                <span className={styles.newsTickerDot}></span>
                LIVE UPDATES
              </div>
              <div className={styles.newsTickerTrack}>
                <div className={styles.newsTickerContent}>
                  {[...latestNews, ...latestNews].map((item, i) => (
                    <Link href="/news" key={`${item.id}-${i}`} className={styles.newsTickerItem}>
                      <span style={{ color: getNewsTypeColor(item.type) }}>{getNewsTypeEmoji(item.type)}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* Top Contributors */}
      <section className={styles.section}>
        <ScrollReveal>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🏆 Top Contributors</h2>
            <div className={styles.sectionLink}>Monthly Leaderboard</div>
          </div>
        </ScrollReveal>
        <div className={styles.contributorsGrid}>
          {topContributors.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                Building leaderboard...
            </div>
          ) : (
            topContributors.map((contributor, index) => (
              <ScrollReveal key={contributor.id} delay={index * 100}>
                <div className={styles.contributorCard}>
                  <div className={styles.contributorRank}>#{index + 1}</div>
                  <div className={styles.contributorAvatar}>
                      {contributor.photoURL ? <img src={contributor.photoURL} alt="" /> : getInitials(contributor.name)}
                  </div>
                  <div className={styles.contributorInfo}>
                    <div className={styles.contributorName}>{contributor.name}</div>
                    <div className={styles.contributorPoints}>⭐ {contributor.points || 0} Points</div>
                  </div>
                </div>
              </ScrollReveal>
            ))
          )}
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <ScrollReveal>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}><CountUp end={platformStats.notes} suffix="+" /></div>
              <div className={styles.statLabel}>Notes Uploaded</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}><CountUp end={platformStats.students} suffix="+" /></div>
              <div className={styles.statLabel}>Students Active</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}><CountUp end={platformStats.pyqs} suffix="+" /></div>
              <div className={styles.statLabel}>PYQs Available</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}><CountUp end={platformStats.subjects} suffix="+" /></div>
              <div className={styles.statLabel}>Subjects Covered</div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ CTA BANNER — NEW ═══ */}
      <section className={styles.ctaBanner}>
        <ScrollReveal>
          <div className={styles.ctaInner}>
            <div className={styles.ctaGlow}></div>
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

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>📚 Sutras</div>
          <div className={styles.footerLinks}>
            <Link href="/notes" className={styles.footerLink}>Notes</Link>
            <Link href="/pyqs" className={styles.footerLink}>PYQs</Link>
            <Link href="/assignments" className={styles.footerLink}>Assignments</Link>
            <Link href="/community" className={styles.footerLink}>Community</Link>
            <Link href="/clubs" className={styles.footerLink}>Clubs</Link>
            <Link href="/news" className={styles.footerLink}>News</Link>
            <Link href="/upload" className={styles.footerLink}>Upload</Link>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/privacy-policy" className={styles.footerLink}>Privacy Policy</Link>
            <Link href="/terms-of-service" className={styles.footerLink}>Terms of Service</Link>
            <Link href="/cookie-policy" className={styles.footerLink}>Cookie Policy</Link>
          </div>
          <div className={styles.footerLink}>© 2026 Sutras. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}

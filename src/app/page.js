'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, increment, query, orderBy, limit } from 'firebase/firestore';
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

    fetchRecent();
    fetchLeaderboard();
    return () => { cancelled = true; };
    return () => { cancelled = true; };
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
              Access premium notes, previous year questions, and unit-wise exam prep — all beautifully organized in one place.
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

      {/* How It Works (New Section) */}
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

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>📚 Sutras</div>
          <div className={styles.footerLinks}>
            <Link href="/notes" className={styles.footerLink}>Notes</Link>
            <Link href="/pyqs" className={styles.footerLink}>PYQs</Link>
            <Link href="/assignments" className={styles.footerLink}>Assignments</Link>
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

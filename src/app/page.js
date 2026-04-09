'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { IconNotes, IconPyq, IconAssignment, IconSparkles, IconUser, IconFolder, IconHat, IconStar, IconDownload } from '@/components/Icons';

const SAMPLE_NOTES = [
  { id: 1, title: 'DBMS Complete Notes - Unit 1 to 5', type: 'Notes', subject: 'DBMS', branch: 'Computer', year: '2nd Year', uploader: 'Rahul S.', rating: 4.8, downloads: 234 },
  { id: 2, title: 'Operating Systems PYQ 2024', type: 'PYQ', subject: 'OS', branch: 'Computer', year: '2nd Year', uploader: 'Priya K.', rating: 4.5, downloads: 189 },
  { id: 3, title: 'Data Structures Assignment 3 Solution', type: 'Assignment', subject: 'DSA', branch: 'Computer', year: '2nd Year', uploader: 'Amit R.', rating: 4.2, downloads: 156 },
  { id: 4, title: 'Computer Networks Unit 3 Summary', type: 'Notes', subject: 'CN', branch: 'Computer', year: '3rd Year', uploader: 'Neha M.', rating: 4.9, downloads: 312 },
  { id: 5, title: 'Mathematics-III Important Questions', type: 'PYQ', subject: 'Maths', branch: 'All', year: '2nd Year', uploader: 'Vikram T.', rating: 4.7, downloads: 445 },
  { id: 6, title: 'Software Engineering Lab Manual', type: 'Assignment', subject: 'SE', branch: 'Computer', year: '3rd Year', uploader: 'Sara J.', rating: 4.3, downloads: 201 },
];

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
  const router = useRouter();
  const { user } = useAuth();

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      router.push(`/notes?q=${encodeURIComponent(heroQuery.trim())}`);
    }
  };

  // Personalized filtering
  const userSubjects = user?.subjects || [];
  const userBranch = user?.branch || '';
  const userYear = user?.year || '';

  const recommended = userSubjects.length > 0
    ? SAMPLE_NOTES.filter(n =>
      userSubjects.some(s => n.subject.toLowerCase().includes(s.toLowerCase())) ||
      n.branch === userBranch ||
      n.year === userYear
    )
    : SAMPLE_NOTES;

  const sectionLabel = userSubjects.length > 0 ? '🎯 Recommended for You' : '📌 Recent Uploads';

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroTag}>🚀 Your college companion</span>
          <h1 className={styles.heroTitle}>
            Find Notes. Ace Exams.{' '}
            <span className={styles.heroTitleAccent}>Study Smarter.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Access notes, previous year questions, assignments, and exam prep — all in one place. Built by students, for students.
          </p>
          <form className={styles.heroSearch} onSubmit={handleHeroSearch}>
            <input
              type="text"
              className={styles.heroSearchInput}
              placeholder="Search for DBMS notes, OS PYQs, DSA assignments..."
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
            />
            <button type="submit" className={styles.heroSearchBtn}>Search</button>
          </form>
        </div>
      </section>

      {/* Quick Access */}
      <section className={styles.quickAccess}>
        <div className={styles.quickGrid}>
          <Link href="/notes" className={styles.quickCard}>
            <div className={`${styles.quickIcon} ${styles.quickIconNotes}`}><IconNotes size={28} /></div>
            <div className={styles.quickTitle}>Notes</div>
            <div className={styles.quickDesc}>Subject-wise study material</div>
          </Link>
          <Link href="/pyqs" className={styles.quickCard}>
            <div className={`${styles.quickIcon} ${styles.quickIconPyqs}`}><IconPyq size={28} /></div>
            <div className={styles.quickTitle}>PYQs</div>
            <div className={styles.quickDesc}>Previous year questions</div>
          </Link>
          <Link href="/assignments" className={styles.quickCard}>
            <div className={`${styles.quickIcon} ${styles.quickIconAssign}`}><IconAssignment size={28} /></div>
            <div className={styles.quickTitle}>Assignments</div>
            <div className={styles.quickDesc}>Ready solutions & code</div>
          </Link>
          <Link href="/exam-mode" className={styles.quickCard}>
            <div className={`${styles.quickIcon} ${styles.quickIconExam}`}><IconSparkles size={28} /></div>
            <div className={styles.quickTitle}>Exam Mode</div>
            <div className={styles.quickDesc}>Last night prep</div>
          </Link>
        </div>
      </section>

      {/* Personalized / Recent Uploads */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{sectionLabel}</h2>
          <Link href="/notes" className={styles.sectionLink}>View all →</Link>
        </div>
        <div className={styles.recentGrid}>
          {recommended.map((note) => (
            <div key={note.id} className={styles.noteCard}>
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
                    <IconStar /> {note.rating}
                  </div>
                  <button className={styles.downloadBtn}>
                    <IconDownload size={18} /> Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>2,500+</div>
            <div className={styles.statLabel}>Notes Uploaded</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>1,200+</div>
            <div className={styles.statLabel}>Students Active</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>500+</div>
            <div className={styles.statLabel}>PYQs Available</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>50+</div>
            <div className={styles.statLabel}>Subjects Covered</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>📚 StudyHub</div>
          <div className={styles.footerLinks}>
            <Link href="/notes" className={styles.footerLink}>Notes</Link>
            <Link href="/pyqs" className={styles.footerLink}>PYQs</Link>
            <Link href="/assignments" className={styles.footerLink}>Assignments</Link>
            <Link href="/upload" className={styles.footerLink}>Upload</Link>
          </div>
          <div className={styles.footerLink}>© 2026 StudyHub. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}

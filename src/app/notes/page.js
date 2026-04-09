'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';
import { IconNotes, IconUser, IconFolder, IconHat, IconDownload, IconStar, IconHeart, IconSearch } from '@/components/Icons';

const BRANCHES = ['All', 'Computer', 'IT', 'Mechanical', 'Civil', 'Electrical', 'Electronics'];
const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];
const SUBJECTS_MAP = {
    'Computer': ['DBMS', 'OS', 'DSA', 'CN', 'SE', 'TOC', 'AI', 'ML'],
    'IT': ['DBMS', 'OS', 'Web Tech', 'CN', 'Cloud Computing'],
    'All': ['Mathematics', 'Physics', 'Chemistry', 'English'],
};

// Sample data for demo (will be replaced by Firebase data)
const SAMPLE_NOTES = [
    { id: '1', title: 'DBMS Complete Notes - Unit 1 to 5', subject: 'DBMS', branch: 'Computer', year: '2nd Year', uploader: 'Rahul S.', rating: 4.8, downloads: 234, createdAt: '2026-04-05' },
    { id: '2', title: 'Operating Systems Process Scheduling', subject: 'OS', branch: 'Computer', year: '2nd Year', uploader: 'Priya K.', rating: 4.5, downloads: 189, createdAt: '2026-04-04' },
    { id: '3', title: 'Data Structures - Trees & Graphs', subject: 'DSA', branch: 'Computer', year: '2nd Year', uploader: 'Amit R.', rating: 4.7, downloads: 302, createdAt: '2026-04-03' },
    { id: '4', title: 'Computer Networks - Unit 3 Detailed', subject: 'CN', branch: 'Computer', year: '3rd Year', uploader: 'Neha M.', rating: 4.9, downloads: 312, createdAt: '2026-04-02' },
    { id: '5', title: 'Software Engineering Design Patterns', subject: 'SE', branch: 'Computer', year: '3rd Year', uploader: 'Vikram T.', rating: 4.6, downloads: 178, createdAt: '2026-04-01' },
    { id: '6', title: 'Theory of Computation - Regular Languages', subject: 'TOC', branch: 'Computer', year: '3rd Year', uploader: 'Sara J.', rating: 4.4, downloads: 145, createdAt: '2026-03-30' },
    { id: '7', title: 'Engineering Mathematics III', subject: 'Mathematics', branch: 'All', year: '2nd Year', uploader: 'Karan P.', rating: 4.8, downloads: 445, createdAt: '2026-03-28' },
    { id: '8', title: 'Machine Learning Basics', subject: 'ML', branch: 'Computer', year: '4th Year', uploader: 'Ankit D.', rating: 4.3, downloads: 167, createdAt: '2026-03-25' },
];

function NotesContent() {
    const searchParams = useSearchParams();
    const urlQuery = searchParams.get('q') || '';

    const [notes, setNotes] = useState(SAMPLE_NOTES);
    const [branch, setBranch] = useState('All');
    const [year, setYear] = useState('All');
    const [search, setSearch] = useState(urlQuery);
    const [liked, setLiked] = useState({});

    const filtered = notes.filter((n) => {
        if (branch !== 'All' && n.branch !== branch && n.branch !== 'All') return false;
        if (year !== 'All' && n.year !== year) return false;
        if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.subject.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const toggleLike = (id) => {
        setLiked(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                <ScrollReveal>
                    <div className={styles.pageHeader}>
                        <h1 className={styles.pageTitle}><IconNotes size={40} /> Notes</h1>
                        <p className={styles.pageDesc}>Browse and download study notes organized by subject, branch, and year.</p>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={100}>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <select className={styles.filterSelect} value={branch} onChange={(e) => setBranch(e.target.value)}>
                                {BRANCHES.map(b => <option key={b} value={b}>{b === 'All' ? '🏫 All Branches' : b}</option>)}
                            </select>
                            <select className={styles.filterSelect} value={year} onChange={(e) => setYear(e.target.value)}>
                                {YEARS.map(y => <option key={y} value={y}>{y === 'All' ? '🎓 All Years' : y}</option>)}
                            </select>
                        </div>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search notes by title or subject..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </ScrollReveal>

                {filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><IconSearch size={64} /></div>
                        <div className={styles.emptyText}>No notes found</div>
                        <div className={styles.emptySubtext}>Try adjusting your filters or search query</div>
                    </div>
                ) : (
                    <div className={styles.listContainer}>
                        {filtered.map((note, i) => (
                            <ScrollReveal key={note.id} delay={i * 80}>
                                <div className={`${styles.rowCard} hover-lift`}>
                                    <div className={styles.cardIconArea}>
                                        <IconNotes size={32} className={styles.fileIcon} />
                                        <span className={`${styles.cardBadge} ${styles.badgeNotes}`}>Notes</span>
                                    </div>

                                    <div className={styles.cardMain}>
                                        <h3 className={styles.cardTitle}>{note.title}</h3>
                                        <div className={styles.cardMeta}>
                                            <span className={styles.metaItem}><IconUser /> <strong>{note.uploader}</strong></span>
                                            <span className={styles.metaItem}><IconFolder /> {note.subject}</span>
                                            <span className={styles.metaItem}><IconHat /> {note.year}</span>
                                            <span className={styles.metaItem}><IconDownload /> {note.downloads} dls</span>
                                        </div>
                                    </div>

                                    <div className={styles.cardActions}>
                                        <div className={styles.rating}><IconStar /> {note.rating}</div>
                                        <div className={styles.actionRow}>
                                            <button
                                                className={styles.likeBtn}
                                                onClick={() => toggleLike(note.id)}
                                                title="Like this note"
                                            >
                                                <IconHeart fill={liked[note.id] ? "#ef4444" : "none"} stroke={liked[note.id] ? "#ef4444" : "currentColor"} />
                                            </button>
                                            <button className={styles.downloadBtn}>
                                                <IconDownload size={18} /> Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}

export default function NotesPage() {
    return (
        <Suspense fallback={<div style={{ padding: '120px 24px', textAlign: 'center' }}>Loading...</div>}>
            <NotesContent />
        </Suspense>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import styles from '../notes/page.module.css';
import { IconPyq, IconUser, IconFolder, IconCalendar, IconPen, IconDownload, IconStar, IconSearch, IconLock } from '@/components/Icons';

const EXAM_YEARS = ['All', '2025', '2024', '2023', '2022'];
const SUBJECTS = ['All', 'DBMS', 'OS', 'DSA', 'CN', 'SE', 'TOC', 'Mathematics'];

export default function PYQsPage() {
    const { user, loading: authLoading } = useAuth();
    const [pyqs, setPyqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [examYear, setExamYear] = useState('All');
    const [subject, setSubject] = useState('All');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;
        const fetchPyqs = async () => {
            setLoading(true);
            try {
                if (!db) throw new Error('Firestore not initialized');
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
                const fetchPromise = getDocs(collection(db, 'files'));
                const snapshot = await Promise.race([fetchPromise, timeout]);
                if (cancelled) return;
                const data = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(f => f.type === 'PYQ' && f.status === 'approved');
                data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                setPyqs(data);
            } catch (error) {
                console.error('Error fetching PYQs:', error);
                if (!cancelled) setPyqs([]);
            }
            if (!cancelled) setLoading(false);
        };
        fetchPyqs();
        return () => { cancelled = true; };
    }, []);

    const filtered = pyqs.filter((p) => {
        if (examYear !== 'All' && p.year !== examYear) return false;
        if (subject !== 'All' && p.subject !== subject) return false;
        if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.subject.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const handleDownload = async (pyq) => {
        if (!pyq.fileURL) return;
        try {
            await updateDoc(doc(db, 'files', pyq.id), { downloads: increment(1) });
            setPyqs(prev => prev.map(p => p.id === pyq.id ? { ...p, downloads: (p.downloads || 0) + 1 } : p));
        } catch (e) { console.warn('Could not update download count:', e.message); }
        window.open(pyq.fileURL, '_blank');
    };

    if (authLoading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Authenticating...</div>;
    }

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', maxWidth: '440px', margin: 'var(--space-3xl) auto', backdropFilter: 'blur(20px)' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: 'var(--space-lg)' }}><IconLock size={64} /></div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>Sign in to Access</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>You must be logged in to download Past Year Questions.</p>
                        <Link href="/login" style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 700, textDecoration: 'none', transition: 'all 0.3s ease' }}>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                <ScrollReveal>
                    <div className={styles.pageHeader}>
                        <h1 className={styles.pageTitle}><IconPyq size={40} /> Previous Year Questions</h1>
                        <p className={styles.pageDesc}>Practice with actual exam papers organized by subject and year.</p>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={100}>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <select className={styles.filterSelect} value={subject} onChange={(e) => setSubject(e.target.value)}>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s === 'All' ? '📁 All Subjects' : s}</option>)}
                            </select>
                            <select className={styles.filterSelect} value={examYear} onChange={(e) => setExamYear(e.target.value)}>
                                {EXAM_YEARS.map(y => <option key={y} value={y}>{y === 'All' ? '📅 All Years' : y}</option>)}
                            </select>
                        </div>
                        <input type="text" className={styles.searchInput} placeholder="Search PYQs..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </ScrollReveal>

                {loading ? (
                    <div className={styles.emptyState}><div className={styles.emptyText}>Loading PYQs...</div></div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><IconSearch size={64} /></div>
                        <div className={styles.emptyText}>No PYQs found</div>
                        <div className={styles.emptySubtext}>{pyqs.length === 0 ? 'No approved PYQs yet. Upload some!' : 'Try adjusting your filters'}</div>
                    </div>
                ) : (
                    <div className={styles.listContainer}>
                        {filtered.map((pyq, i) => (
                            <ScrollReveal key={pyq.id} delay={i * 80}>
                                <div className={`${styles.rowCard} hover-lift`}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardIconArea}>
                                            <IconPyq size={24} className={styles.fileIcon} />
                                            <span className={`${styles.cardBadge} ${styles.badgePyq}`}>PYQ</span>
                                        </div>
                                        <div className={styles.rating}><IconStar size={16} /> {pyq.rating > 0 ? pyq.rating : 'New'}</div>
                                    </div>
                                    <div className={styles.cardMain}>
                                        <h3 className={styles.cardTitle}>{pyq.title}</h3>
                                        <div className={styles.cardMeta}>
                                            <span className={styles.metaItem}><IconUser size={14}/> <strong>{pyq.uploader}</strong></span>
                                            <span className={styles.metaItem}><IconFolder size={14}/> {pyq.subject}</span>
                                            <span className={styles.metaItem}><IconCalendar size={14}/> {pyq.year}</span>
                                            {pyq.marks && <span className={styles.metaItem}><IconPen size={14}/> {pyq.marks}</span>}
                                            <span className={styles.metaItem}><IconDownload size={14}/> {pyq.downloads || 0}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <div className={styles.actionRow}>
                                            <button className={styles.downloadBtn} onClick={() => handleDownload(pyq)}>
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
        </div>
    );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { awardDownloadPoints } from '@/lib/points';
import { ScrollReveal } from '@/components/Animations';
import styles from '../notes/page.module.css';
import { IconAssignment, IconUser, IconFolder, IconHat, IconDownload, IconStar, IconHeart, IconSearch, IconLock, IconFlag } from '@/components/Icons';

const SUBJECTS = ['All', 'DBMS', 'DSA', 'OS', 'CN', 'SE', 'ML', 'Mathematics'];

export default function AssignmentsPage() {
    const { user, loading: authLoading } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subject, setSubject] = useState('All');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;
        const fetchAssignments = async () => {
            setLoading(true);
            try {
                if (!db) throw new Error('Firestore not initialized');
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
                const fetchPromise = getDocs(collection(db, 'files'));
                const snapshot = await Promise.race([fetchPromise, timeout]);
                if (cancelled) return;
                const data = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(f => f.type === 'Assignment' && f.status === 'approved');
                data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                setAssignments(data);
            } catch (error) {
                console.error('Error fetching assignments:', error);
                if (!cancelled) setAssignments([]);
            }
            if (!cancelled) setLoading(false);
        };
        fetchAssignments();
        return () => { cancelled = true; };
    }, []);

    const filtered = assignments.filter(a => {
        if (subject !== 'All' && a.subject !== subject) return false;
        if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const handleDownload = async (item) => {
        if (!item.fileURL) return;
        try {
            await awardDownloadPoints(item.id, item.uploaderUID, user?.uid);
            setAssignments(prev => prev.map(a => a.id === item.id ? { ...a, downloads: (a.downloads || 0) + 1 } : a));
        } catch (e) { console.warn('Count err:', e.message); }
        window.open(item.fileURL, '_blank');
    };

    const handleReport = async (item) => {
        if (!confirm('Flag this assignment as misplaced or incorrect? Admins will be notified.')) return;
        try {
            await updateDoc(doc(db, 'files', item.id), { 
                isReported: true, 
                reportCount: increment(1) 
            });
            alert('Thank you! This assignment has been flagged for admin review.');
        } catch (e) { 
            console.warn('Report err:', e.message); 
            alert('Failed to report file. Please try again.');
        }
    };

    if (authLoading) {
        return <div className="container" style={{ paddingTop: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>Authenticating...</div>;
    }

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={`container ${styles.stateWrapper} glass-panel`}>
                    <div className={styles.stateIcon}><IconLock size={64} /></div>
                    <h2 className={styles.stateTitle}>Locked Vault</h2>
                    <p className={styles.stateDesc}>You must be signed in to access the assignments archive.</p>
                    <Link href="/login" className="btn btn-primary">Authenticate Now</Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.heroBanner}>
                <div className="container">
                    <ScrollReveal>
                        <h1 className={styles.heroTitle}>Assignments Archive</h1>
                        <p className={styles.heroSubtitle}>Premium ready-to-submit solutions and lab manuals.</p>
                    </ScrollReveal>
                </div>
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <ScrollReveal delay={100}>
                    <div className={styles.filterBar}>
                        <div className={styles.filterGroup}>
                            <select className={styles.filterSelect} value={subject} onChange={(e) => setSubject(e.target.value)}>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
                            </select>
                        </div>
                        <div className={styles.searchWrapper}>
                            <IconSearch size={18} className={styles.searchIcon} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search assignments..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </ScrollReveal>

                {loading ? (
                    <div className={`container ${styles.stateWrapper}`}>
                        <div style={{ color: 'var(--text-muted)' }}>Synchronizing databases...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`container ${styles.stateWrapper} glass-panel`}>
                        <div className={styles.stateIcon}><IconSearch size={64} /></div>
                        <h3 className={styles.stateTitle}>No documents found</h3>
                        <p className={styles.stateDesc}>We couldn't find any resources matching those exact filters.</p>
                    </div>
                ) : (
                    <div className={styles.gridContainer}>
                        {filtered.map((item, i) => (
                            <ScrollReveal key={item.id} delay={i * 40}>
                                <div className={`${styles.glassCard} glass-panel`}>
                                    
                                    <div className={styles.cardHeader}>
                                        <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, rgba(255, 0, 127, 0.2), rgba(138, 43, 226, 0.1))', color: 'var(--accent)' }}>
                                            <IconAssignment size={26} />
                                        </div>
                                        <div className={styles.typeBadge} style={{ color: 'var(--accent)' }}>Assignment</div>
                                    </div>

                                    <div className={styles.cardMain}>
                                        <h3 className={styles.cardTitle}>{item.title}</h3>
                                        <div className={styles.cardSubject} style={{ color: 'var(--accent)' }}>{item.subject}</div>
                                        
                                        <div className={styles.cardMeta}>
                                            <div className={styles.metaItem}>
                                                <IconHat size={16} color="var(--text-muted)" />
                                                <strong>{item.branch}</strong> • {item.year}
                                            </div>
                                            <div className={styles.metaItem}>
                                                <IconUser size={16} color="var(--text-muted)" />
                                                <strong>{item.uploader}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.statGroup}>
                                            <div className={styles.statItem} title="Downloads">
                                                <IconDownload size={16} color="var(--accent)" />
                                                {item.downloads || 0}
                                            </div>
                                            <div className={styles.statItem} title="Rating">
                                                <IconStar size={16} color="var(--primary-light)" />
                                                {item.rating || 'New'}
                                            </div>
                                        </div>
                                        
                                        <div className={styles.actionGroup}>
                                            <button 
                                                className={styles.btnAction} 
                                                onClick={() => handleReport(item)}
                                                title="Report Misplaced File"
                                            >
                                                <IconFlag size={18} />
                                            </button>
                                            <button 
                                                className={styles.btnDownload} 
                                                onClick={() => handleDownload(item)}
                                                style={{ background: 'var(--gradient-premium)' }}
                                            >
                                                <IconDownload size={18} /> Get
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

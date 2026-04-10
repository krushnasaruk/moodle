'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import styles from '../notes/page.module.css';
import { IconAssignment, IconUser, IconFolder, IconHat, IconDownload, IconStar, IconSearch, IconLock } from '@/components/Icons';

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
            await updateDoc(doc(db, 'files', item.id), { downloads: increment(1) });
            setAssignments(prev => prev.map(a => a.id === item.id ? { ...a, downloads: (a.downloads || 0) + 1 } : a));
        } catch (e) { console.warn('Could not update download count:', e.message); }
        window.open(item.fileURL, '_blank');
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
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>You must be logged in to download Assignments.</p>
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
                        <h1 className={styles.pageTitle}><IconAssignment size={40} /> Assignments</h1>
                        <p className={styles.pageDesc}>Ready-to-submit assignments with solutions — code and PDFs.</p>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={100}>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <select className={styles.filterSelect} value={subject} onChange={(e) => setSubject(e.target.value)}>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s === 'All' ? '📁 All Subjects' : s}</option>)}
                            </select>
                        </div>
                        <input type="text" className={styles.searchInput} placeholder="Search assignments..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </ScrollReveal>

                {loading ? (
                    <div className={styles.emptyState}><div className={styles.emptyText}>Loading assignments...</div></div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><IconSearch size={64} /></div>
                        <div className={styles.emptyText}>No assignments found</div>
                        <div className={styles.emptySubtext}>{assignments.length === 0 ? 'No approved assignments yet. Upload some!' : 'Try adjusting your filters'}</div>
                    </div>
                ) : (
                    <div className={styles.listContainer}>
                        {filtered.map((item, i) => (
                            <ScrollReveal key={item.id} delay={i * 80}>
                                <div className={`${styles.rowCard} hover-lift`}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardIconArea}>
                                            <IconAssignment size={24} className={styles.fileIcon} />
                                            <span className={`${styles.cardBadge} ${styles.badgeAssignment}`}>Assignment</span>
                                        </div>
                                        <div className={styles.rating}><IconStar size={16} /> {item.rating > 0 ? item.rating : 'New'}</div>
                                    </div>
                                    <div className={styles.cardMain}>
                                        <h3 className={styles.cardTitle}>{item.title}</h3>
                                        <div className={styles.cardMeta}>
                                            <span className={styles.metaItem}><IconUser size={14}/> <strong>{item.uploader}</strong></span>
                                            <span className={styles.metaItem}><IconFolder size={14}/> {item.subject}</span>
                                            <span className={styles.metaItem}><IconHat size={14}/> {item.year}</span>
                                            <span className={styles.metaItem}><IconDownload size={14}/> {item.downloads || 0}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <div className={styles.actionRow}>
                                            <button className={styles.downloadBtn} onClick={() => handleDownload(item)}>
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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { BRANCHES, YEARS, getSubjectsByYear } from '@/lib/subjectMap';
import { ScrollReveal } from '@/components/Animations';
import { IconNotes, IconPyq, IconAssignment, IconFolder, IconStar, IconDownload, IconLock } from '@/components/Icons';
import styles from './page.module.css';

function getTypeIcon(type) {
    switch (type) {
        case 'Notes': return <IconNotes size={16} />;
        case 'PYQ': return <IconPyq size={16} />;
        case 'Assignment': return <IconAssignment size={16} />;
        default: return <IconFolder size={16} />;
    }
}

function getTypeClass(type) {
    switch (type) {
        case 'Notes': return styles.typeNotes;
        case 'PYQ': return styles.typePyq;
        case 'Assignment': return styles.typeAssignment;
        default: return styles.typeNotes;
    }
}

export default function SubjectsPage() {
    const { user, loading: authLoading } = useAuth();

    const [branch, setBranch] = useState('Computer');
    const [year, setYear] = useState('1st Year');
    const [subjectContent, setSubjectContent] = useState({});
    const [loading, setLoading] = useState(true);
    const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);

    useEffect(() => {
        if (!authLoading && !hasLoadedPrefs) {
            if (user) {
                setBranch(user.branch || 'Computer');
                setYear(user.year || '1st Year');
            }
            setHasLoadedPrefs(true);
        }
    }, [user, authLoading, hasLoadedPrefs]);

    const subjects = getSubjectsByYear(branch, year);

    useEffect(() => {
        let cancelled = false;
        const fetchContent = async () => {
            setLoading(true);
            try {
                if (!db) throw new Error('Firestore not initialized');
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
                const fetchPromise = getDocs(collection(db, 'files'));
                const snapshot = await Promise.race([fetchPromise, timeout]);
                if (cancelled) return;
                const allFiles = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(f => f.status === 'approved');
                const availableSubjsForRoute = getSubjectsByYear(branch, year) || [];
                const grouped = {};
                availableSubjsForRoute.forEach(s => grouped[s] = []);

                allFiles.forEach(file => {
                    let rawSubj = (file.subject || 'Other').trim();
                    let matchedBucket = rawSubj;

                    // Hardcoded Alias Routing for legacy uploads
                    if (rawSubj.toUpperCase() === 'BE') {
                        rawSubj = 'BEE';
                    }

                    // Intelligent fuzzy/case-insensitive routing
                    const lowerRaw = rawSubj.toLowerCase();
                    const found = availableSubjsForRoute.find(vs => {
                        const vsLower = vs.toLowerCase();
                        return vsLower === lowerRaw || vsLower.includes(lowerRaw) || lowerRaw.includes(vsLower);
                    });

                    if (found) {
                        matchedBucket = found;
                    }

                    if (!grouped[matchedBucket]) grouped[matchedBucket] = [];
                    grouped[matchedBucket].push(file);
                });
                setSubjectContent(grouped);
            } catch (error) {
                console.error('Error fetching subject content:', error);
                if (!cancelled) setSubjectContent({});
            }
            if (!cancelled) setLoading(false);
        };
        fetchContent();
        return () => { cancelled = true; };
    }, []);

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', maxWidth: '440px', margin: 'var(--space-3xl) auto', backdropFilter: 'blur(20px)' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: 'var(--space-lg)' }}><IconLock size={64} /></div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>Sign in to Access</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>You must be logged in to view Syllabus and Subject Content.</p>
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
                        <h1 className={styles.pageTitle}><IconFolder size={32} /> Subjects</h1>
                        <p className={styles.pageSubtitle}>Browse study material organized by subject</p>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={100}>
                    <div className={styles.filterBar}>
                        <select className={styles.filterSelect} value={branch} onChange={(e) => setBranch(e.target.value)}>
                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select className={styles.filterSelect} value={year} onChange={(e) => setYear(e.target.value)}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </ScrollReveal>

                {subjects.length > 0 ? (
                    <div className={styles.subjectGrid}>
                        {subjects.map((subj, i) => {
                            const content = subjectContent[subj] || [];
                            const topContent = content.slice(0, 3);
                            return (
                                <ScrollReveal key={subj} delay={i * 80}>
                                    <div className={`${styles.subjectCard} hover-lift`} style={{ animationDelay: `${i * 0.05}s` }}>
                                        <div className={styles.subjectCardHeader}>
                                            <div className={styles.subjectIcon}><IconNotes size={24} /></div>
                                            <h3 className={styles.subjectName}>{subj}</h3>
                                        </div>

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
                                                <Link href="/upload" className={styles.uploadLink}>Be the first to upload →</Link>
                                            </div>
                                        )}

                                        <Link href={`/notes?q=${encodeURIComponent(subj)}`} className={styles.viewAllLink}>
                                            View all {subj} materials →
                                        </Link>
                                    </div>
                                </ScrollReveal>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <IconFolder size={48} />
                        <p>Select a semester to see subjects</p>
                    </div>
                )}
            </div>
        </div>
    );
}

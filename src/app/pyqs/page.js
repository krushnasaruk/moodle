'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { awardDownloadPoints } from '@/lib/points';
import { ScrollReveal } from '@/components/Animations';
import styles from '../notes/page.module.css';
import { IconPyq, IconSearch, IconLock, IconDownload, IconStar, IconHat, IconUser, IconFlag } from '@/components/Icons';
import SkeletonCard from '@/components/SkeletonCard/SkeletonCard';

const BRANCHES = ['All', 'Computer', 'IT', 'Mechanical', 'Civil', 'Electrical', 'Electronics'];
const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function PyqsPage() {
    const { user, loading: authLoading } = useAuth();
    const [pyqs, setPyqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branch, setBranch] = useState('All');
    const [year, setYear] = useState('All');
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
                    .map(d => {
                        const fileData = d.data();
                        if (fileData.subject === 'BE') fileData.subject = 'BEE';
                        return { id: d.id, ...fileData };
                    })
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

    const filtered = pyqs.filter(p => {
        if (branch !== 'All' && p.branch !== branch && p.branch !== 'All') return false;
        if (year !== 'All' && p.year !== year) return false;
        if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const handleDownload = async (item) => {
        if (!item.fileURL) return;
        try {
            await awardDownloadPoints(item.id, item.uploaderUID, user?.uid);
            setPyqs(prev => prev.map(p => p.id === item.id ? { ...p, downloads: (p.downloads || 0) + 1 } : p));
        } catch (e) { console.warn('Could not update download count:', e.message); }
        window.open(item.fileURL, '_blank');
    };

    const handleReport = async (item) => {
        if (!confirm('Flag this PYQ as misplaced or incorrect? Admins will be notified.')) return;
        try {
            await updateDoc(doc(db, 'files', item.id), { 
                isReported: true, 
                reportCount: increment(1) 
            });
            alert('Thank you! This PYQ has been flagged for admin review.');
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
                    <p className={styles.stateDesc}>You must be signed in to access Past Year Question Papers.</p>
                    <Link href="/login" className="btn btn-primary">Authenticate Now</Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            {/* Massive Desktop Header */}
            <div className={styles.heroBanner}>
                <div className="container">
                    <ScrollReveal>
                        <h1 className={styles.heroTitle}>PYQ Vault</h1>
                        <p className={styles.heroSubtitle}>Premium past year question papers for strategic insight.</p>
                    </ScrollReveal>
                </div>
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                {/* Sleek inline filter bar */}
                <ScrollReveal delay={100}>
                    <div className={styles.filterBar}>
                        <div className={styles.filterGroup}>
                            <select className={styles.filterSelect} value={branch} onChange={(e) => setBranch(e.target.value)}>
                                {BRANCHES.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
                            </select>
                            <span style={{ color: 'var(--border)' }}>|</span>
                            <select className={styles.filterSelect} value={year} onChange={(e) => setYear(e.target.value)}>
                                {YEARS.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
                            </select>
                        </div>
                        <div className={styles.searchWrapper}>
                            <IconSearch size={18} className={styles.searchIcon} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search PYQs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </ScrollReveal>

                {loading ? (
                    <div className={styles.gridContainer}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <SkeletonCard key={i} />
                        ))}
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
                                        <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(138, 43, 226, 0.1))', color: 'var(--secondary)' }}>
                                            <IconPyq size={26} />
                                        </div>
                                        <div className={styles.typeBadge} style={{ color: 'var(--secondary)' }}>PYQ Paper</div>
                                    </div>

                                    <div className={styles.cardMain}>
                                        <h3 className={styles.cardTitle}>{item.title}</h3>
                                        <div className={styles.cardSubject} style={{ color: 'var(--secondary)' }}>{item.subject}</div>
                                        
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
                                                <IconDownload size={16} color="var(--secondary)" />
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
                                                style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)' }}
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

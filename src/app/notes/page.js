'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { awardDownloadPoints } from '@/lib/points';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';
import { IconNotes, IconUser, IconFolder, IconHat, IconDownload, IconStar, IconHeart, IconSearch, IconLock, IconFlag } from '@/components/Icons';

const BRANCHES = ['All', 'Computer', 'IT', 'Mechanical', 'Civil', 'Electrical', 'Electronics'];
const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];

function NotesContent() {
    const searchParams = useSearchParams();
    const urlQuery = searchParams.get('q') || '';
    const { user, loading: authLoading } = useAuth();

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branch, setBranch] = useState('All');
    const [year, setYear] = useState('All');
    const [search, setSearch] = useState(urlQuery);
    const [liked, setLiked] = useState({});

    useEffect(() => {
        let cancelled = false;
        const fetchNotes = async () => {
            setLoading(true);
            try {
                if (!db) throw new Error('Firestore not initialized');
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
                const fetchPromise = getDocs(collection(db, 'files'));
                const snapshot = await Promise.race([fetchPromise, timeout]);

                if (cancelled) return;

                const data = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(f => f.type === 'Notes' && f.status === 'approved');
                data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                setNotes(data);
            } catch (error) {
                console.error('Error fetching notes:', error);
                if (!cancelled) setNotes([]);
            }
            if (!cancelled) setLoading(false);
        };
        fetchNotes();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (user?.savedNotes) {
            const likedMap = {};
            user.savedNotes.forEach(id => { likedMap[id] = true; });
            setLiked(likedMap);
        }
    }, [user]);

    const filtered = notes.filter((n) => {
        if (branch !== 'All' && n.branch !== branch && n.branch !== 'All') return false;
        if (year !== 'All' && n.year !== year) return false;
        if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.subject.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const toggleLike = async (id) => {
        setLiked(prev => ({ ...prev, [id]: !prev[id] }));
        if (user && db) {
            try {
                const userRef = doc(db, 'users', user.uid);
                const currentSaved = user.savedNotes || [];
                const newSaved = currentSaved.includes(id)
                    ? currentSaved.filter(sid => sid !== id)
                    : [...currentSaved, id];
                await updateDoc(userRef, { savedNotes: newSaved });
            } catch (e) { console.warn('Could not save like:', e.message); }
        }
    };

    const handleDownload = async (note) => {
        if (!note.fileURL) return;
        try {
            await awardDownloadPoints(note.id, note.uploaderUID, user?.uid);
            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, downloads: (n.downloads || 0) + 1 } : n));
        } catch (e) { console.warn('Count err:', e.message); }
        window.open(note.fileURL, '_blank');
    };

    const handleReport = async (note) => {
        if (!confirm('Flag this note as misplaced or incorrect? Admins will be notified.')) return;
        try {
            await updateDoc(doc(db, 'files', note.id), { 
                isReported: true, 
                reportCount: increment(1) 
            });
            alert('Thank you! This note has been flagged for admin review.');
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
                    <p className={styles.stateDesc}>You must be signed in to access the premium notes repository.</p>
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
                        <h1 className={styles.heroTitle}>Notes Repository</h1>
                        <p className={styles.heroSubtitle}>Premium study materials, beautifully organized.</p>
                    </ScrollReveal>
                </div>
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
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
                                placeholder="Search by title or subject..."
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
                        {filtered.map((note, i) => (
                            <ScrollReveal key={note.id} delay={i * 40}>
                                <div className={`${styles.glassCard} glass-panel`}>
                                    
                                    <div className={styles.cardHeader}>
                                        <div className={styles.iconWrapper}>
                                            <IconNotes size={26} />
                                        </div>
                                        <div className={styles.typeBadge}>Notes</div>
                                    </div>

                                    <div className={styles.cardMain}>
                                        <h3 className={styles.cardTitle}>{note.title}</h3>
                                        <div className={styles.cardSubject}>{note.subject}</div>
                                        
                                        <div className={styles.cardMeta}>
                                            <div className={styles.metaItem}>
                                                <IconHat size={16} color="var(--text-muted)" />
                                                <strong>{note.branch}</strong> • {note.year}
                                            </div>
                                            <div className={styles.metaItem}>
                                                <IconUser size={16} color="var(--text-muted)" />
                                                <strong>{note.uploader}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.statGroup}>
                                            <div className={styles.statItem} title="Downloads">
                                                <IconDownload size={16} color="var(--primary-light)" />
                                                {note.downloads || 0}
                                            </div>
                                            <div className={styles.statItem} title="Rating">
                                                <IconStar size={16} color="var(--accent)" />
                                                {note.rating || 'New'}
                                            </div>
                                        </div>
                                        
                                        <div className={styles.actionGroup}>
                                            <button 
                                                className={styles.btnAction} 
                                                onClick={() => handleReport(note)}
                                                title="Report Misplaced File"
                                            >
                                                <IconFlag size={18} />
                                            </button>
                                            <button 
                                                className={styles.btnAction} 
                                                onClick={() => toggleLike(note.id)}
                                                title="Save Note"
                                                style={{ color: liked[note.id] ? 'var(--accent)' : 'inherit' }}
                                            >
                                                <IconHeart size={20} fill={liked[note.id] ? "currentColor" : "none"} />
                                            </button>
                                            <button 
                                                className={styles.btnDownload} 
                                                onClick={() => handleDownload(note)}
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

export default function NotesPage() {
    return (
        <Suspense fallback={<div className="container" style={{ paddingTop: '200px', textAlign: 'center' }}>Loading Module...</div>}>
            <NotesContent />
        </Suspense>
    );
}

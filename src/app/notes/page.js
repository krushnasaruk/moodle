'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';
import { IconNotes, IconUser, IconFolder, IconHat, IconDownload, IconStar, IconHeart, IconSearch, IconFlag, IconLock } from '@/components/Icons';

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

    // Fetch approved Notes from Firestore
    useEffect(() => {
        let cancelled = false;
        const fetchNotes = async () => {
            setLoading(true);
            try {
                if (!db) throw new Error('Firestore not initialized');

                // Use simple getDocs on the whole collection to avoid composite index requirement
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

    // Load saved liked state from user if available
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
            } catch (e) {
                console.warn('Could not save like:', e.message);
            }
        }
    };

    const handleDownload = async (note) => {
        if (!note.fileURL) return;
        try {
            await updateDoc(doc(db, 'files', note.id), {
                downloads: increment(1)
            });
            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, downloads: (n.downloads || 0) + 1 } : n));
        } catch (e) {
            console.warn('Could not update download count:', e.message);
        }
        window.open(note.fileURL, '_blank');
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
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>You must be logged in to explore the Notes library.</p>
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

                {loading ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyText}>Loading notes...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><IconSearch size={64} /></div>
                        <div className={styles.emptyText}>No notes found</div>
                        <div className={styles.emptySubtext}>{notes.length === 0 ? 'No approved notes yet. Be the first to upload!' : 'Try adjusting your filters or search query'}</div>
                    </div>
                ) : (
                    <div className={styles.listContainer}>
                        {filtered.map((note, i) => (
                            <ScrollReveal key={note.id} delay={i * 80}>
                                <div className={`${styles.rowCard} hover-lift`}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardIconArea}>
                                            <IconNotes size={24} className={styles.fileIcon} />
                                            <span className={`${styles.cardBadge} ${styles.badgeNotes}`}>Notes</span>
                                        </div>
                                        <div className={styles.rating}><IconStar size={16} /> {note.rating > 0 ? note.rating : 'New'}</div>
                                    </div>

                                    <div className={styles.cardMain}>
                                        <h3 className={styles.cardTitle}>{note.title}</h3>
                                        <div className={styles.cardMeta}>
                                            <span className={styles.metaItem}><IconUser size={14}/> <strong>{note.uploader}</strong></span>
                                            <span className={styles.metaItem}><IconFolder size={14}/> {note.subject}</span>
                                            <span className={styles.metaItem}><IconHat size={14}/> {note.year}</span>
                                            <span className={styles.metaItem}><IconDownload size={14}/> {note.downloads || 0}</span>
                                        </div>
                                    </div>

                                    <div className={styles.cardActions}>
                                        <div className={styles.actionRow}>
                                            <button
                                                className={styles.likeBtn}
                                                onClick={() => toggleLike(note.id)}
                                                title="Save this note"
                                            >
                                                <IconHeart size={18} fill={liked[note.id] ? "#ef4444" : "none"} stroke={liked[note.id] ? "#ef4444" : "currentColor"} />
                                            </button>
                                            <button className={styles.downloadBtn} onClick={() => handleDownload(note)}>
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

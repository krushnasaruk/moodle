/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';

const TYPE_META = {
    Urgent: { emoji: '🚨', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    Event: { emoji: '📅', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
    General: { emoji: 'ℹ️', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
};

const FILTER_TYPES = ['All', 'Urgent', 'Event', 'General'];

export default function NewsPage() {
    const { user } = useAuth();
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [viewPending, setViewPending] = useState(false);
    useEffect(() => {
        const q = query(collection(db, 'news'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNewsItems(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching news:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredNews = useMemo(() => {
        let filtered = newsItems;
        if (viewPending) {
            filtered = newsItems.filter(item => item.status === 'pending');
        } else {
            // Default: show approved or ones without status (backwards compat)
            filtered = newsItems.filter(item => !item.status || item.status === 'approved');
        }

        if (activeFilter !== 'All') {
            filtered = filtered.filter(item => item.type === activeFilter);
        }
        return filtered;
    }, [newsItems, activeFilter, viewPending]);

    const stats = useMemo(() => {
        const approvedOnly = newsItems.filter(n => !n.status || n.status === 'approved');
        return {
            total: approvedOnly.length,
            urgent: approvedOnly.filter(n => n.type === 'Urgent').length,
            events: approvedOnly.filter(n => n.type === 'Event').length,
            pending: newsItems.filter(n => n.status === 'pending').length
        };
    }, [newsItems]);

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const d = timestamp.toDate();
        const now = new Date();
        const diff = now - d;
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getTagClass = (type) => {
        switch (type?.toLowerCase()) {
            case 'urgent': return styles.tagUrgent;
            case 'event': return styles.tagEvent;
            default: return styles.tagGeneral;
        }
    };

    const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'teacher';

    const handleApprove = async (id) => {
        if (!isAdminOrTeacher) return;
        try {
            await updateDoc(doc(db, 'news', id), { status: 'approved' });
            alert("News approved successfully!");
        } catch (err) {
            console.error("Error approving news:", err);
            alert("Failed to approve news.");
        }
    };

    const handleReject = async (id) => {
        if (!isAdminOrTeacher) return;
        if (!confirm("Are you sure you want to reject and delete this news request?")) return;
        try {
            await deleteDoc(doc(db, 'news', id));
        } catch (err) {
            console.error("Error rejecting news:", err);
            alert("Failed to reject news.");
        }
    };

    if (loading) return (
        <div className={styles.loadingWrapper}>
            <div className={styles.loadingOrb}></div>
            <p className={styles.loadingText}>Loading bulletin...</p>
        </div>
    );

    return (
        <div className={styles.pageWrapper}>
            {/* Ambient background orbs */}
            <div className={styles.bgOrb1}></div>
            <div className={styles.bgOrb2}></div>

            <div className={styles.container}>

                {/* ── HERO HEADER ── */}
                <ScrollReveal>
                    <div className={styles.heroSection}>
                        <div className={styles.heroBadge}>
                            <span className={styles.heroBadgeDot}></span>
                            Campus Bulletin Board
                        </div>
                        <h1 className={styles.heroTitle}>
                            Stay <span className={styles.heroAccent}>Informed.</span>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Official campus announcements, upcoming events, and important updates — all in one place.
                        </p>

                        {/* Stats strip */}
                        <div className={styles.statsStrip}>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.total}</span>
                                <span className={styles.statLbl}>Bulletins</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.urgent}</span>
                                <span className={styles.statLbl}>Urgent</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.events}</span>
                                <span className={styles.statLbl}>Events</span>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ── ADMIN CONTROLS ── */}
                {isAdminOrTeacher && (
                    <ScrollReveal delay={50}>
                        <div className={styles.adminControls} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>📢 You have permission to post & moderate news.</div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button 
                                    className={`${styles.postNewsBtn} ${viewPending ? styles.filterChipActive : ''}`}
                                    onClick={() => setViewPending(!viewPending)}
                                    style={{ background: viewPending ? 'var(--accent)' : 'transparent', border: '1px solid var(--border)', color: viewPending ? '#fff' : 'var(--text-primary)' }}
                                >
                                    {viewPending ? 'Viewing Pending' : `Pending Verification (${stats.pending})`}
                                </button>
                                <Link href="/news/create" className={styles.postNewsBtn} style={{ textDecoration: 'none' }}>
                                    + Post Announcement
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                {/* ── CATEGORY FILTERS ── */}
                <ScrollReveal delay={100}>
                    <div className={styles.filterBar}>
                        {FILTER_TYPES.map(type => (
                            <button
                                key={type}
                                className={`${styles.filterChip} ${activeFilter === type ? styles.filterChipActive : ''}`}
                                onClick={() => setActiveFilter(type)}
                            >
                                {type !== 'All' && TYPE_META[type]?.emoji} {type}
                            </button>
                        ))}
                    </div>
                </ScrollReveal>

                {/* ── NEWS GRID ── */}
                {filteredNews.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyEmoji}>📭</div>
                        <h3 className={styles.emptyTitle}>No announcements found</h3>
                        <p className={styles.emptyDesc}>
                            {activeFilter !== 'All' ? 'Try selecting a different category.' : 'Check back later for updates.'}
                        </p>
                    </div>
                ) : (
                    <div className={styles.newsList}>
                        {filteredNews.map((item, index) => {
                            const isFeatured = index === 0 && item.type === 'Urgent';
                            const meta = TYPE_META[item.type] || TYPE_META.General;

                            return (
                                <div
                                    key={item.id}
                                    className={`${styles.newsCard} ${isFeatured && !viewPending ? styles.featuredCard : ''}`}
                                    style={{
                                        animationDelay: `${(index % 6) * 60}ms`,
                                        '--card-accent': viewPending ? '#f59e0b' : meta.color,
                                    }}
                                >
                                    {/* Top accent strip */}
                                    <div className={styles.cardTopStrip} style={{ background: viewPending ? '#f59e0b' : meta.gradient }}></div>

                                    <div className={styles.newsTop}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span className={getTagClass(item.type)}>{item.type || 'General'}</span>
                                            {item.status === 'pending' && (
                                                <span className={styles.tagUrgent} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        <span className={styles.newsDate}>{formatDate(item.timestamp)}</span>
                                    </div>
                                    <div className={styles.newsContent}>
                                        <h3 className={styles.newsTitle} style={{ fontSize: isFeatured && !viewPending ? '2rem' : undefined }}>{item.title}</h3>
                                        <p className={styles.newsBody}>{item.content}</p>
                                    </div>
                                    <div className={styles.newsFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {viewPending && isAdminOrTeacher ? (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleApprove(item.id)} style={{ padding: '4px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Approve</button>
                                                <button onClick={() => handleReject(item.id)} style={{ padding: '4px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Reject</button>
                                            </div>
                                        ) : (
                                            <span className={styles.readMore}>
                                                Read more <span className={styles.readMoreArrow}>→</span>
                                            </span>
                                        )}
                                        {item.authorName && (
                                            <span className={styles.newsAuthor}>By {item.authorName}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

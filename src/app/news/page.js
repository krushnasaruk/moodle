'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
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

    useEffect(() => {
        const q = query(collection(db, 'news'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            if (data.length === 0) {
                setNewsItems([
                    { id: 'mock1', title: 'Midterm Schedules Released', content: 'The preliminary schedules for all midterms have now been published. Please check your dashboard for individual timings and venue allocations. Contact your department coordinator for any conflicts.', type: 'Urgent', authorName: 'Academic Office', timestamp: { toDate: () => new Date() } },
                    { id: 'mock2', title: 'Annual Tech Symposium 2026', content: 'Join us next Friday at the main auditorium for our biggest tech event of the year featuring guest speakers from Google and Microsoft. Registration is open now — limited seats available!', type: 'Event', authorName: 'Tech Committee', timestamp: { toDate: () => new Date(Date.now() - 86400000) } },
                    { id: 'mock3', title: 'Library Renovation Update', content: 'The second floor of the campus library will be closed starting Monday for the new studying commons renovation. Alternative study spaces are available in the Student Center.', type: 'General', authorName: 'Facilities Dept.', timestamp: { toDate: () => new Date(Date.now() - 86400000 * 2) } },
                    { id: 'mock4', title: 'Spring Career Fair — May 15th', content: 'Over 50 companies will be on campus for the Spring Career Fair. Bring your updated resume and dress professionally. Pre-registration opens April 25th on the career portal.', type: 'Event', authorName: 'Placement Cell', timestamp: { toDate: () => new Date(Date.now() - 86400000 * 3) } },
                    { id: 'mock5', title: 'New Wi-Fi Hotspots on Campus', content: 'IT Services has installed 12 new high-speed Wi-Fi access points across hostels and common areas. Connect using your student credentials — speeds up to 200 Mbps.', type: 'General', authorName: 'IT Services', timestamp: { toDate: () => new Date(Date.now() - 86400000 * 5) } },
                ]);
            } else {
                setNewsItems(data);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching news:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredNews = useMemo(() => {
        if (activeFilter === 'All') return newsItems;
        return newsItems.filter(item => item.type === activeFilter);
    }, [newsItems, activeFilter]);

    const stats = useMemo(() => ({
        total: newsItems.length,
        urgent: newsItems.filter(n => n.type === 'Urgent').length,
        events: newsItems.filter(n => n.type === 'Event').length,
    }), [newsItems]);

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
                        <div className={styles.adminControls}>
                            <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>📢 You have permission to post official news.</div>
                            <Link href="/news/create" className={styles.postNewsBtn} style={{ textDecoration: 'none' }}>
                                + Post Announcement
                            </Link>
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
                                    className={`${styles.newsCard} ${isFeatured ? styles.featuredCard : ''}`}
                                    style={{
                                        animationDelay: `${(index % 6) * 60}ms`,
                                        '--card-accent': meta.color,
                                    }}
                                >
                                    {/* Top accent strip */}
                                    <div className={styles.cardTopStrip} style={{ background: meta.gradient }}></div>

                                    <div className={styles.newsTop}>
                                        <span className={getTagClass(item.type)}>{item.type || 'General'}</span>
                                        <span className={styles.newsDate}>{formatDate(item.timestamp)}</span>
                                    </div>
                                    <div className={styles.newsContent}>
                                        <h3 className={styles.newsTitle} style={{ fontSize: isFeatured ? '2rem' : undefined }}>{item.title}</h3>
                                        <p className={styles.newsBody}>{item.content}</p>
                                    </div>
                                    <div className={styles.newsFooter}>
                                        <span className={styles.readMore}>
                                            Read more <span className={styles.readMoreArrow}>→</span>
                                        </span>
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

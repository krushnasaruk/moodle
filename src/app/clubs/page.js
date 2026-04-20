'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';


const CATEGORIES = ['All', 'Tech', 'Engineering', 'Arts & Media', 'Academic', 'Business', 'Sports', 'Social'];

const CATEGORY_META = {
    Tech: { emoji: '💻', color: '#3b82f6' },
    Engineering: { emoji: '⚙️', color: '#f59e0b' },
    'Arts & Media': { emoji: '🎨', color: '#ec4899' },
    Academic: { emoji: '📚', color: '#10b981' },
    Business: { emoji: '💼', color: '#8b5cf6' },
    Sports: { emoji: '⚽', color: '#22c55e' },
    Social: { emoji: '🤝', color: '#f97316' },
};

export default function ClubsPage() {
    const { user } = useAuth();
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'clubs'));
                const clubsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClubs(clubsData);
            } catch (error) {
                console.error('Error fetching clubs', error);
                setClubs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchClubs();
    }, []);

    const filteredClubs = useMemo(() => {
        let result = clubs;
        if (activeCategory !== 'All') {
            result = result.filter(c => c.category === activeCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.category?.toLowerCase().includes(q) ||
                c.tags?.some(t => t.toLowerCase().includes(q))
            );
        }
        return result;
    }, [clubs, activeCategory, searchQuery]);

    const featuredClubs = useMemo(() => clubs.filter(c => c.featured), [clubs]);

    const stats = useMemo(() => ({
        total: clubs.length,
        members: clubs.reduce((sum, c) => sum + (c.membersCount || c.members?.length || 0), 0),
        categories: new Set(clubs.map(c => c.category)).size,
    }), [clubs]);

    if (loading) return (
        <div className={styles.loadingWrapper}>
            <div className={styles.loadingOrb}></div>
            <p className={styles.loadingText}>Loading clubs...</p>
        </div>
    );

    return (
        <div className={styles.pageWrapper}>
            {/* Ambient background orbs */}
            <div className={styles.bgOrb1}></div>
            <div className={styles.bgOrb2}></div>
            <div className={styles.bgOrb3}></div>

            <div className={styles.container}>

                {/* ── HERO HEADER ── */}
                <ScrollReveal>
                    <div className={styles.heroSection}>
                        <div className={styles.heroBadge}>
                            <span className={styles.heroBadgeDot}></span>
                            {clubs.length} Active Clubs on Campus
                        </div>
                        <h1 className={styles.heroTitle}>
                            Find Your <span className={styles.heroAccent}>Tribe.</span>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Discover student clubs, join communities, attend events, and build friendships that last beyond graduation.
                        </p>

                        {/* Stats strip */}
                        <div className={styles.statsStrip}>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.total}</span>
                                <span className={styles.statLbl}>Clubs</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.members.toLocaleString()}+</span>
                                <span className={styles.statLbl}>Members</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.categories}</span>
                                <span className={styles.statLbl}>Categories</span>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ── FEATURED CLUBS SPOTLIGHT ── */}
                {featuredClubs.length > 0 && (
                    <ScrollReveal delay={100}>
                        <div className={styles.featuredSection}>
                            <div className={styles.sectionLabel}>⚡ Featured Clubs</div>
                            <div className={styles.featuredGrid}>
                                {featuredClubs.map((club, i) => (
                                    <Link
                                        key={club.id}
                                        href={`/clubs/${club.id}`}
                                        className={styles.featuredCard}
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className={styles.featuredCardBg} style={{ background: club.gradient }}></div>
                                        <div className={styles.featuredCardInner}>
                                            <div className={styles.featuredEmoji}>{club.emoji}</div>
                                            <div className={styles.featuredBadge}>Featured</div>
                                            <div className={styles.featuredCategory}>{club.category}</div>
                                            <h2 className={styles.featuredName}>{club.name}</h2>
                                            <p className={styles.featuredDesc}>{club.description.slice(0, 100)}...</p>
                                            <div className={styles.featuredMeta}>
                                                <span className={styles.featuredMembers}>👥 {club.membersCount} members</span>
                                                {club.upcomingEvent && (
                                                    <span className={styles.featuredEvent}>📅 {club.upcomingEvent}</span>
                                                )}
                                            </div>
                                            <div className={styles.featuredTags}>
                                                {club.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag} className={styles.featuredTag}>{tag}</span>
                                                ))}
                                            </div>
                                            <div className={styles.featuredCTA}>
                                                Explore Club <span className={styles.featuredArrow}>→</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                {/* ── SEARCH + FILTER BAR ── */}
                <ScrollReveal delay={150}>
                    <div className={styles.controlBar}>
                        <div className={styles.searchBox}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search clubs, tags, categories..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className={styles.searchClear} onClick={() => setSearchQuery('')}>✕</button>
                            )}
                        </div>

                        {user && (
                            <Link href="/clubs/create" className={styles.createBtn}>
                                <span>+</span> Start a Club
                            </Link>
                        )}
                    </div>
                </ScrollReveal>

                {/* ── CATEGORY FILTERS ── */}
                <ScrollReveal delay={200}>
                    <div className={styles.categoryBar}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`${styles.catChip} ${activeCategory === cat ? styles.catChipActive : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat !== 'All' && CATEGORY_META[cat]?.emoji} {cat}
                            </button>
                        ))}
                    </div>
                </ScrollReveal>

                {/* ── RESULTS COUNT ── */}
                <div className={styles.resultsRow}>
                    <span className={styles.resultsCount}>
                        {filteredClubs.length} {filteredClubs.length === 1 ? 'club' : 'clubs'} found
                        {activeCategory !== 'All' && ` in ${activeCategory}`}
                        {searchQuery && ` for "${searchQuery}"`}
                    </span>
                </div>

                {/* ── CLUBS GRID ── */}
                {filteredClubs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyEmoji}>🔍</div>
                        <h3 className={styles.emptyTitle}>No clubs found</h3>
                        <p className={styles.emptyDesc}>Try a different search or category filter.</p>
                        <button className={styles.emptyReset} onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className={styles.clubsGrid}>
                        {filteredClubs.map((club, i) => (
                            <Link
                                key={club.id}
                                href={`/clubs/${club.id}`}
                                className={styles.clubCard}
                                style={{ animationDelay: `${(i % 6) * 60}ms`, '--card-color': club.color || '#3b82f6' }}
                            >
                                {/* Card glow top strip */}
                                <div className={styles.cardTopStrip} style={{ background: club.gradient || 'var(--gradient-brand)' }}></div>

                                <div className={styles.cardBody}>
                                    {/* Header row */}
                                    <div className={styles.cardHeader}>
                                        <div className={styles.clubEmojiWrap} style={{ background: club.gradient }}>
                                            <span className={styles.clubEmoji}>{club.emoji || club.name.charAt(0)}</span>
                                        </div>
                                        <div className={styles.cardHeaderRight}>
                                            <span className={styles.catTag}>
                                                {club.category || 'General'}
                                            </span>
                                            <span className={styles.activeLabel}>
                                                <span className={styles.activeDot}></span>
                                                {club.lastActive || 'Active'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Club name & desc */}
                                    <h3 className={styles.clubName}>{club.name}</h3>
                                    <p className={styles.clubDesc}>{club.description}</p>

                                    {/* Tags */}
                                    {club.tags && (
                                        <div className={styles.tagRow}>
                                            {club.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className={styles.tag}>{tag}</span>
                                            ))}
                                            {club.tags.length > 3 && <span className={styles.tagMore}>+{club.tags.length - 3}</span>}
                                        </div>
                                    )}

                                    {/* Upcoming event */}
                                    {club.upcomingEvent && (
                                        <div className={styles.upcomingEvent}>
                                            <span className={styles.upcomingIcon}>📅</span>
                                            <span className={styles.upcomingText}>{club.upcomingEvent}</span>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className={styles.cardFooter}>
                                        <div className={styles.memberStack}>
                                            {[...Array(Math.min(3, club.members?.length || 0))].map((_, j) => (
                                                <div key={j} className={styles.memberBubble} style={{ background: club.gradient, left: `${j * 18}px` }}></div>
                                            ))}
                                            <span className={styles.memberCountText} style={{ marginLeft: `${Math.min(3, club.members?.length || 0) * 18 + 8}px` }}>
                                                👥 {club.membersCount || club.members?.length || 0} members
                                            </span>
                                        </div>
                                        <span className={styles.viewBtn}>View →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';

const DUMMY_CLUBS = [
    {
        id: 'mock1',
        name: 'Computer Science Society',
        category: 'Tech',
        emoji: '💻',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        description: 'A vibrant community of developers, designers & tech enthusiasts. Weekly hackathons, coding sprints, and industry mentor sessions. Build real projects that matter.',
        membersCount: 124,
        members: ['u1','u2','u3','u4','u5','u6','u7','u8'],
        tags: ['Hackathons', 'Web Dev', 'AI/ML', 'Open Source'],
        featured: true,
        upcomingEvent: 'CodeStorm 2026 — May 3rd',
        lastActive: 'Today',
        adminName: 'Prof. Kumar',
    },
    {
        id: 'mock2',
        name: 'Robotics Club',
        category: 'Engineering',
        emoji: '🤖',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        description: 'Design and build autonomous robots for national competitions. Wednesday meets in the Engineering Lab. From line-followers to full AI bots — all majors welcome.',
        membersCount: 45,
        members: ['u1','u2','u3'],
        tags: ['Arduino', 'ROS', 'Competitions', 'CAD'],
        featured: false,
        upcomingEvent: 'Robowar Regional — May 15th',
        lastActive: 'Yesterday',
        adminName: 'Dr. Patel',
    },
    {
        id: 'mock3',
        name: 'Photography Guild',
        category: 'Arts & Media',
        emoji: '📸',
        color: '#ec4899',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        description: 'For students who love capturing moments. Weekend photo walks across campus, Lightroom editing tutorials, and monthly gallery exhibitions in the Main Hall.',
        membersCount: 89,
        members: ['u1','u2'],
        tags: ['Portrait', 'Street', 'Lightroom', 'Exhibition'],
        featured: false,
        upcomingEvent: 'Monsoon Photo Walk — Apr 28th',
        lastActive: '2 days ago',
        adminName: 'Sarah M.',
    },
    {
        id: 'mock4',
        name: 'Debate & MUN Society',
        category: 'Academic',
        emoji: '🎤',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        description: 'Sharpen your critical thinking and public speaking. We compete in MUNs across the country and host inter-college debate tournaments every semester.',
        membersCount: 67,
        members: ['u1','u2','u3','u4'],
        tags: ['MUN', 'Public Speaking', 'Policy', 'Debate'],
        featured: false,
        upcomingEvent: 'SIMMUN 2026 — June 10th',
        lastActive: '3 days ago',
        adminName: 'Ananya R.',
    },
    {
        id: 'mock5',
        name: 'Entrepreneurship Cell',
        category: 'Business',
        emoji: '🚀',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        description: 'From idea to IPO — E-Cell connects students with startup founders, VCs, and incubators. Pitch competitions, workshops, and a thriving startup community.',
        membersCount: 203,
        members: ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10'],
        tags: ['Startups', 'Pitch', 'Networking', 'Innovation'],
        featured: true,
        upcomingEvent: 'IdeaVault Pitch Night — May 8th',
        lastActive: 'Today',
        adminName: 'Karan M.',
    },
    {
        id: 'mock6',
        name: 'Football Club',
        category: 'Sports',
        emoji: '⚽',
        color: '#22c55e',
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        description: 'The college football team competing in zonal tournaments. We also organize inter-department friendlies and fitness camps. Tryouts open every semester.',
        membersCount: 38,
        members: ['u1','u2','u3'],
        tags: ['Tournaments', 'Fitness', 'Teamwork', 'Zonal'],
        featured: false,
        upcomingEvent: 'Zonal Cup — May 20th',
        lastActive: 'Today',
        adminName: 'Coach Ravi',
    },
    {
        id: 'mock7',
        name: 'Music & Band Club',
        category: 'Arts & Media',
        emoji: '🎸',
        color: '#f97316',
        gradient: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
        description: 'Rock, jazz, classical, or EDM — all genres welcome. Regular jam sessions, performance workshops, and we headline every college fest. No experience needed to join.',
        membersCount: 56,
        members: ['u1','u2','u3','u4'],
        tags: ['Jam Sessions', 'Fests', 'Live Music', 'Recording'],
        featured: false,
        upcomingEvent: 'Sounds of Spring Fest — May 1st',
        lastActive: 'Yesterday',
        adminName: 'DJ Mehta',
    },
    {
        id: 'mock8',
        name: 'Cybersecurity Club',
        category: 'Tech',
        emoji: '🔐',
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        description: 'Hack legally, defend aggressively. CTF competitions, ethical hacking workshops, bug bounty guidance, and a private lab for practising penetration testing.',
        membersCount: 72,
        members: ['u1','u2','u3','u4','u5'],
        tags: ['CTF', 'Pentesting', 'Bug Bounty', 'Networking'],
        featured: false,
        upcomingEvent: 'National CTF Qualifier — May 12th',
        lastActive: 'Today',
        adminName: 'Aditi K.',
    },
    {
        id: 'mock9',
        name: 'Drama & Theatre Society',
        category: 'Arts & Media',
        emoji: '🎭',
        color: '#a855f7',
        gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        description: 'From street plays to full-scale productions — we do it all. Annual drama fest, improv nights, and acting/direction workshops with industry professionals.',
        membersCount: 44,
        members: ['u1','u2'],
        tags: ['Theatre', 'Improv', 'Street Plays', 'Direction'],
        featured: false,
        upcomingEvent: 'Annual Play — June 5th',
        lastActive: '4 days ago',
        adminName: 'Meera S.',
    },
    {
        id: 'mock10',
        name: 'Data Science Club',
        category: 'Tech',
        emoji: '📊',
        color: '#0ea5e9',
        gradient: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
        description: 'Kaggle competitions, research paper reading groups, ML project sprints and speaker sessions from data scientists at top companies. Python-first community.',
        membersCount: 91,
        members: ['u1','u2','u3','u4','u5','u6'],
        tags: ['Kaggle', 'Python', 'ML', 'Research'],
        featured: false,
        upcomingEvent: 'Kaggle Sprint — Apr 30th',
        lastActive: 'Today',
        adminName: 'Prof. Nair',
    },
    {
        id: 'mock11',
        name: 'Literary Club',
        category: 'Academic',
        emoji: '📖',
        color: '#84cc16',
        gradient: 'linear-gradient(135deg, #84cc16 0%, #10b981 100%)',
        description: 'Book clubs, poetry slams, creative writing workshops and publishing the college literary magazine "Quill". We believe every student has a story worth telling.',
        membersCount: 33,
        members: ['u1','u2'],
        tags: ['Book Club', 'Poetry', 'Creative Writing', 'Magazine'],
        featured: false,
        upcomingEvent: 'Poetry Slam Night — May 5th',
        lastActive: '5 days ago',
        adminName: 'Pooja T.',
    },
    {
        id: 'mock12',
        name: 'Environment Club',
        category: 'Social',
        emoji: '🌱',
        color: '#16a34a',
        gradient: 'linear-gradient(135deg, #16a34a 0%, #84cc16 100%)',
        description: 'Sustainability drives, campus tree-planting campaigns, e-waste collection and climate-awareness workshops. Making our campus greener one initiative at a time.',
        membersCount: 58,
        members: ['u1','u2','u3'],
        tags: ['Sustainability', 'Drives', 'Climate', 'Green Campus'],
        featured: false,
        upcomingEvent: 'Earth Day Drive — Apr 22nd',
        lastActive: '2 days ago',
        adminName: 'Rahul G.',
    },
];

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
                setClubs(clubsData.length === 0 ? DUMMY_CLUBS : [...DUMMY_CLUBS, ...clubsData]);
            } catch (error) {
                setClubs(DUMMY_CLUBS);
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

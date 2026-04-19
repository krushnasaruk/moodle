'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
    doc, getDoc, updateDoc, deleteDoc,
    arrayUnion, arrayRemove, collection, addDoc,
    query, where, orderBy, onSnapshot, serverTimestamp,
    increment, getDocs,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

// ─── RICH MOCK DATA ────────────────────────────────────────────────────────
const MOCK_CLUBS = {
    mock1: {
        id: 'mock1', name: 'Computer Science Society', category: 'Tech', emoji: '💻',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        color: '#3b82f6',
        description: 'A hub for all CS enthusiasts — from competitive coding to cutting-edge research. Whether you are debugging your first program or deploying production-grade systems, there is a place for you here.',
        adminId: 'admin1', adminName: 'Dr. Ravi Kumar',
        members: ['admin1', 'u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'],
        membersCount: 124,
        tags: ['Coding', 'AI/ML', 'Web Dev', 'Open Source', 'Hackathons'],
        meetSchedule: 'Every Friday, 5:00 PM — Room 204, CS Block',
        discord: 'discord.gg/css-sutraverse',
        joiningLink: 'https://forms.google.com/css-join',
        whatsapp: 'chat.whatsapp.com/abc123',
        upcomingEvent: 'CodeStorm 2026 — May 3rd',
        supervisorName: 'Prof. Nair', supervisorEmail: 'nair@college.edu',
        lastActive: 'Today', featured: true,
    },
    mock2: {
        id: 'mock2', name: 'Photography Club', category: 'Arts & Media', emoji: '📸',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
        color: '#ec4899',
        description: 'Capture moments, tell stories. We explore portrait, street, landscape, and astrophotography. Monthly photo walks, critique sessions, and college magazine contributions.',
        adminId: 'admin2', adminName: 'Sneha Iyer',
        members: ['admin2', 'u1', 'u2', 'u3'],
        membersCount: 67,
        tags: ['Portrait', 'Street Photography', 'Editing', 'Instagram'],
        meetSchedule: 'Every Sunday, 7:00 AM — College Front Gate',
        discord: 'discord.gg/photoclubsutras',
        joiningLink: 'https://forms.google.com/photo-join',
        whatsapp: 'chat.whatsapp.com/photo123',
        upcomingEvent: 'Golden Hour Shoot — Apr 28th',
        supervisorName: 'Prof. Mehra', supervisorEmail: 'mehra@college.edu',
        lastActive: '2 hours ago', featured: true,
    },
    mock3: {
        id: 'mock3', name: 'Robotics & IoT Club', category: 'Engineering', emoji: '🤖',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
        color: '#f59e0b',
        description: 'Build autonomous robots, smart home systems, and IoT devices. We compete in national robotics competitions and organise hands-on Arduino & Raspberry Pi workshops.',
        adminId: 'admin3', adminName: 'Arjun Mehta',
        members: ['admin3', 'u1', 'u2'],
        membersCount: 89,
        tags: ['Arduino', 'Raspberry Pi', 'Automation', 'IoT', 'Robotics'],
        meetSchedule: 'Tuesday & Thursday, 4:30 PM — Electronics Lab',
        discord: 'discord.gg/robotics-sutras',
        joiningLink: 'https://forms.google.com/robotics-join',
        whatsapp: 'chat.whatsapp.com/robot123',
        upcomingEvent: 'RoboWar Championship — May 10th',
        supervisorName: 'Prof. Singh', supervisorEmail: 'singh@college.edu',
        lastActive: 'Yesterday', featured: false,
    },
    mock4: {
        id: 'mock4', name: 'Drama & Theatre Club', category: 'Arts & Media', emoji: '🎭',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        color: '#8b5cf6',
        description: 'Stage captivating performances, explore improvisation, scriptwriting, and direction. Annual inter-college theatre competition participants.',
        adminId: 'admin4', adminName: 'Priya Desai',
        members: ['admin4', 'u1'],
        membersCount: 45,
        tags: ['Theatre', 'Improv', 'Scriptwriting', 'Direction'],
        meetSchedule: 'Monday & Wednesday, 6:00 PM — Auditorium',
        discord: 'discord.gg/drama-sutras',
        joiningLink: 'https://forms.google.com/drama-join',
        whatsapp: 'chat.whatsapp.com/drama123',
        upcomingEvent: 'Annual Play — May 20th',
        supervisorName: 'Prof. Sharma', supervisorEmail: 'sharma@college.edu',
        lastActive: '3 days ago', featured: false,
    },
};

const MOCK_MEMBERS = {
    mock1: [
        { id: 'admin1', name: 'Dr. Ravi Kumar', role: 'Admin', branch: 'CSE', year: 'Faculty', emoji: '👨‍💻' },
        { id: 'u1', name: 'Aditya Verma', role: 'Core Team', branch: 'CSE', year: '3rd Year', emoji: '🚀' },
        { id: 'u2', name: 'Kavita Nair', role: 'Core Team', branch: 'ECE', year: '2nd Year', emoji: '💡' },
        { id: 'u3', name: 'Rahul Sharma', role: 'Member', branch: 'ECE', year: '2nd Year', emoji: '🎯' },
        { id: 'u4', name: 'Meera Patel', role: 'Member', branch: 'IT', year: '1st Year', emoji: '🌟' },
        { id: 'u5', name: 'Suresh Babu', role: 'Member', branch: 'CSE', year: '4th Year', emoji: '🔥' },
    ],
    default: [
        { id: 'admin', name: 'Club Admin', role: 'Admin', branch: 'CSE', year: 'Organiser', emoji: '👑' },
        { id: 'u1', name: 'Student Member', role: 'Member', branch: 'ECE', year: '2nd Year', emoji: '🎓' },
    ],
};

const MOCK_ANNOUNCEMENTS = {
    mock1: [
        { id: 'a1', authorName: 'Dr. Ravi Kumar', authorEmoji: '👨‍💻', content: '🚀 CodeStorm 2026 registrations are OPEN! This is our biggest hackathon yet — 36 hours, exciting problem statements, and prizes worth ₹1,50,000. Register via the joining link in our bio. Last date: April 30th!', pinned: true, createdAt: { toDate: () => new Date(Date.now() - 86400000) } },
        { id: 'a2', authorName: 'Aditya Verma', authorEmoji: '🚀', content: 'Reminder: Weekly coding session this Friday at 5 PM in Room 204. We will be solving LeetCode Hard problems together. Bring your laptops!', pinned: false, createdAt: { toDate: () => new Date(Date.now() - 172800000) } },
        { id: 'a3', authorName: 'Dr. Ravi Kumar', authorEmoji: '👨‍💻', content: '🎉 Congratulations to Team Nexus for winning 2nd place at the National Hackathon! Proud of you all. Full recap coming soon on our Discord.', pinned: false, createdAt: { toDate: () => new Date(Date.now() - 604800000) } },
    ],
    default: [
        { id: 'a1', authorName: 'Club Admin', authorEmoji: '👑', content: '👋 Welcome to the club! We are so excited to have you here. Stay tuned for upcoming events and announcements.', pinned: true, createdAt: { toDate: () => new Date(Date.now() - 86400000) } },
    ],
};
// ─── END MOCK DATA ─────────────────────────────────────────────────────────

export default function ClubDetailPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const { user } = useAuth();
    const router = useRouter();

    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState('announcements');
    const [members, setMembers] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [posting, setPosting] = useState(false);
    const [joined, setJoined] = useState(false);
    const [joiningLoading, setJoiningLoading] = useState(false);

    // Settings state
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editMeet, setEditMeet] = useState('');
    const [editDiscord, setEditDiscord] = useState('');
    const [editJoiningLink, setEditJoiningLink] = useState('');
    const [editWhatsapp, setEditWhatsapp] = useState('');
    const [editEvent, setEditEvent] = useState('');
    const [saving, setSaving] = useState(false);

    const clubId = params.clubId;
    const isMock = clubId?.startsWith('mock');

    // ── FETCH CLUB ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!clubId) return;

        const fetchClub = async () => {
            setLoading(true);
            try {
                if (isMock) {
                    const mockClub = MOCK_CLUBS[clubId] || MOCK_CLUBS.mock1;
                    setClub(mockClub);
                    setAnnouncements(MOCK_ANNOUNCEMENTS[clubId] || MOCK_ANNOUNCEMENTS.default);
                    setMembers(MOCK_MEMBERS[clubId] || MOCK_MEMBERS.default);
                    populateSettings(mockClub);
                } else {
                    // Real Firestore fetch
                    const clubSnap = await getDoc(doc(db, 'clubs', clubId));
                    if (!clubSnap.exists()) {
                        setNotFound(true);
                        setLoading(false);
                        return;
                    }
                    const clubData = { id: clubSnap.id, ...clubSnap.data() };
                    setClub(clubData);
                    populateSettings(clubData);

                    // Check if current user is already a member
                    if (user) {
                        setJoined(clubData.members?.includes(user.uid) || false);
                    }

                    // Fetch members from users collection
                    fetchRealMembers(clubData.members || []);

                    // Real-time announcements listener
                    const q = query(
                        collection(db, 'clubAnnouncements'),
                        where('clubId', '==', clubId),
                        orderBy('createdAt', 'desc')
                    );
                    const unsub = onSnapshot(q, snap => {
                        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    });
                    setLoading(false);
                    return () => unsub();
                }
            } catch (err) {
                console.error('Error fetching club:', err);
                setNotFound(true);
            }
            setLoading(false);
        };

        fetchClub();
    }, [clubId, user]);

    const populateSettings = (c) => {
        setEditName(c.name || '');
        setEditDesc(c.description || '');
        setEditMeet(c.meetSchedule || '');
        setEditDiscord(c.discord || '');
        setEditJoiningLink(c.joiningLink || '');
        setEditWhatsapp(c.whatsapp || '');
        setEditEvent(c.upcomingEvent || '');
    };

    const fetchRealMembers = async (memberIds) => {
        if (!memberIds.length) return;
        try {
            const memberData = await Promise.all(
                memberIds.slice(0, 20).map(uid =>
                    getDoc(doc(db, 'users', uid)).then(d => d.exists() ? { id: d.id, ...d.data() } : null)
                )
            );
            setMembers(memberData.filter(Boolean));
        } catch (err) {
            console.warn('Could not fetch members:', err);
        }
    };

    // ── JOIN / LEAVE ─────────────────────────────────────────────────────────
    const handleJoin = async () => {
        if (!user || isMock) {
            if (isMock) {
                setJoined(true);
                return;
            }
            router.push('/login');
            return;
        }
        setJoiningLoading(true);
        try {
            const clubRef = doc(db, 'clubs', clubId);
            if (joined) {
                // Leave
                await updateDoc(clubRef, {
                    members: arrayRemove(user.uid),
                    membersCount: increment(-1),
                });
                setJoined(false);
                setClub(prev => ({ ...prev, membersCount: (prev.membersCount || 1) - 1 }));
            } else {
                // Join
                await updateDoc(clubRef, {
                    members: arrayUnion(user.uid),
                    membersCount: increment(1),
                });
                setJoined(true);
                setClub(prev => ({ ...prev, membersCount: (prev.membersCount || 0) + 1 }));

                // Notify supervisor
                if (club.supervisorEmail) {
                    await addDoc(collection(db, 'notifications'), {
                        type: 'member_joined',
                        recipientEmail: club.supervisorEmail,
                        recipientName: club.supervisorName || 'Supervisor',
                        clubId,
                        clubName: club.name,
                        memberName: user.name || user.email?.split('@')[0],
                        memberEmail: user.email,
                        message: `${user.name || user.email?.split('@')[0]} has joined the "${club.name}" club.`,
                        read: false,
                        createdAt: serverTimestamp(),
                    });
                }

                // Notify admin
                if (club.adminId && club.adminId !== user.uid) {
                    await addDoc(collection(db, 'notifications'), {
                        type: 'member_joined',
                        recipientId: club.adminId,
                        clubId,
                        clubName: club.name,
                        memberName: user.name || user.email?.split('@')[0],
                        memberEmail: user.email,
                        message: `${user.name || user.email?.split('@')[0]} has joined your club "${club.name}".`,
                        read: false,
                        createdAt: serverTimestamp(),
                    });
                }
            }
        } catch (err) {
            console.error('Join/leave error:', err);
            alert('Something went wrong. Please try again.');
        }
        setJoiningLoading(false);
    };

    // ── POST ANNOUNCEMENT ────────────────────────────────────────────────────
    const handlePostAnnouncement = async () => {
        if (!newAnnouncement.trim() || !user) return;
        setPosting(true);
        try {
            if (!isMock) {
                await addDoc(collection(db, 'clubAnnouncements'), {
                    clubId,
                    authorId: user.uid,
                    authorName: user.name || user.email?.split('@')[0],
                    content: newAnnouncement.trim(),
                    pinned: false,
                    createdAt: serverTimestamp(),
                });
            } else {
                // Mock optimistic update
                setAnnouncements(prev => [{
                    id: 'new_' + Date.now(),
                    authorName: user.name || 'You',
                    authorEmoji: '✍️',
                    content: newAnnouncement.trim(),
                    pinned: false,
                    createdAt: { toDate: () => new Date() },
                }, ...prev]);
            }
            setNewAnnouncement('');
        } catch (err) {
            console.error('Error posting:', err);
        }
        setPosting(false);
    };

    // ── SAVE SETTINGS ────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!user || isMock) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'clubs', clubId), {
                name: editName.trim(),
                description: editDesc.trim(),
                meetSchedule: editMeet.trim(),
                discord: editDiscord.trim(),
                joiningLink: editJoiningLink.trim(),
                whatsapp: editWhatsapp.trim(),
                upcomingEvent: editEvent.trim(),
            });
            setClub(prev => ({
                ...prev,
                name: editName, description: editDesc, meetSchedule: editMeet,
                discord: editDiscord, joiningLink: editJoiningLink, whatsapp: editWhatsapp,
                upcomingEvent: editEvent,
            }));
            alert('✅ Club details saved!');
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save. Try again.');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!confirm(`Delete "${club.name}"? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, 'clubs', clubId));
            router.push('/clubs');
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    // ── HELPERS ──────────────────────────────────────────────────────────────
    const formatDate = (ts) => {
        if (!ts) return '';
        try {
            const d = ts.toDate ? ts.toDate() : new Date(ts);
            const now = new Date();
            const diff = now - d;
            if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
            if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch { return ''; }
    };

    const isAdmin = user && club && (club.adminId === user.uid || user.role === 'admin' || user.role === 'teacher');

    // ── RENDER STATES ────────────────────────────────────────────────────────
    if (loading) return (
        <div className={styles.loadingShimmer}>
            <div className={styles.shimmerHero}></div>
            <div className={styles.shimmerContent}></div>
        </div>
    );

    if (notFound) return (
        <div className={styles.pageWrapper} style={{ paddingTop: 'calc(var(--navbar-height) + 40px)' }}>
            <div className={styles.container} style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔍</div>
                <h1 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Club not found</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>This club may have been removed or the link is incorrect.</p>
                <Link href="/clubs" className={styles.backBtn}>← Browse all clubs</Link>
            </div>
        </div>
    );

    if (!club) return null;

    const tabs = [
        { key: 'announcements', label: 'Announcements', icon: '📢', count: announcements.length },
        { key: 'members', label: 'Members', icon: '👥', count: club.membersCount || members.length },
        { key: 'about', label: 'About', icon: 'ℹ️', count: null },
        ...(isAdmin ? [{ key: 'settings', label: 'Settings', icon: '⚙️', count: null }] : []),
    ];

    return (
        <div className={styles.pageWrapper}>
            {/* ── HERO ── */}
            <div className={styles.heroBanner}>
                <div className={styles.heroBannerBg} style={{ background: club.gradient || 'var(--gradient-brand)' }}></div>

                {/* Floating particles */}
                <div className={styles.heroParticles}>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={styles.particle}
                            style={{ left: `${10 + i * 12}%`, width: `${4 + i % 3 * 3}px`, height: `${4 + i % 3 * 3}px` }}
                        />
                    ))}
                </div>

                <div className={styles.heroContainer}>
                    <Link href="/clubs" className={styles.backBtn}>← All Clubs</Link>

                    <div className={styles.heroContent}>
                        {/* Icon */}
                        <div className={styles.heroLeft}>
                            <div className={styles.heroIconWrap}>
                                <div className={styles.heroIcon}>{club.emoji || '🎓'}</div>
                                <div className={styles.heroIconGlow} style={{ background: club.gradient || 'var(--gradient-brand)' }}></div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className={styles.heroInfo}>
                            <div className={styles.heroTopRow}>
                                <span className={styles.clubCategoryBadge}>{club.category}</span>
                                {club.upcomingEvent && (
                                    <span className={styles.eventBadge}>📅 {club.upcomingEvent}</span>
                                )}
                            </div>
                            <h1 className={styles.clubName}>{club.name}</h1>
                            <p className={styles.clubDesc}>{club.description}</p>

                            {club.tags?.length > 0 && (
                                <div className={styles.heroTags}>
                                    {club.tags.map(tag => (
                                        <span key={tag} className={styles.heroTag}>{tag}</span>
                                    ))}
                                </div>
                            )}

                            <div className={styles.heroMetaRow}>
                                <span className={styles.metaPill}>👥 {club.membersCount || members.length} members</span>
                                {club.meetSchedule && <span className={styles.metaPill}>📍 {club.meetSchedule}</span>}
                                {club.adminName && <span className={styles.metaPill}>👤 Led by {club.adminName}</span>}
                                {club.supervisorName && <span className={styles.metaPill}>🎓 Supervised by {club.supervisorName}</span>}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.heroActions}>
                            {/* Join/Leave */}
                            {!isAdmin && (
                                joined ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div className={styles.joinedBadge}>✅ You're a member!</div>
                                        <button className={styles.leaveBtnLarge} onClick={handleJoin} disabled={joiningLoading}>
                                            {joiningLoading ? 'Leaving...' : 'Leave Club'}
                                        </button>
                                    </div>
                                ) : (
                                    <button className={styles.joinBtnLarge} onClick={handleJoin} disabled={joiningLoading}>
                                        {joiningLoading ? 'Joining...' : <>Join Club <span className={styles.joinArrow}>→</span></>}
                                    </button>
                                )
                            )}

                            {/* Joining/Registration link */}
                            {club.joiningLink && (
                                <a href={club.joiningLink.startsWith('http') ? club.joiningLink : `https://${club.joiningLink}`}
                                    target="_blank" rel="noopener noreferrer" className={styles.linkBtn} style={{ background: 'rgba(34,197,94,0.25)', borderColor: 'rgba(34,197,94,0.5)' }}>
                                    📋 Registration Form
                                </a>
                            )}

                            {/* Discord */}
                            {club.discord && (
                                <a href={club.discord.startsWith('http') ? club.discord : `https://${club.discord}`}
                                    target="_blank" rel="noopener noreferrer" className={styles.discordBtn}>
                                    💬 Discord Server
                                </a>
                            )}

                            {/* WhatsApp */}
                            {club.whatsapp && (
                                <a href={club.whatsapp.startsWith('http') ? club.whatsapp : `https://${club.whatsapp}`}
                                    target="_blank" rel="noopener noreferrer" className={styles.linkBtn} style={{ background: 'rgba(34,197,94,0.2)', borderColor: 'rgba(34,197,94,0.4)' }}>
                                    📱 WhatsApp Group
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div className={styles.container}>
                {/* Tabs */}
                <div className={styles.tabs}>
                    {tabs.map(t => (
                        <button key={t.key}
                            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            {t.icon} {t.label}
                            {t.count !== null && (
                                <span className={styles.tabBadge}>{t.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── ANNOUNCEMENTS TAB ── */}
                {activeTab === 'announcements' && (
                    <div className={styles.tabContent}>
                        {/* Compose box — visible to admins */}
                        {isAdmin && (
                            <div className={styles.composeBox}>
                                <div className={styles.composeAvatar}>
                                    {user?.photoURL ? <img src={user.photoURL} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} /> : '📢'}
                                </div>
                                <div className={styles.composeRight}>
                                    <textarea
                                        className={styles.composeInput}
                                        placeholder="Post an announcement to all members..."
                                        value={newAnnouncement}
                                        onChange={e => setNewAnnouncement(e.target.value)}
                                        maxLength={2000}
                                    />
                                    <div className={styles.composeFooter}>
                                        <span className={styles.composeTip}>📌 Members will see this immediately.</span>
                                        <button
                                            className={styles.postBtn}
                                            onClick={handlePostAnnouncement}
                                            disabled={posting || !newAnnouncement.trim()}
                                        >
                                            {posting ? 'Posting...' : 'Post Announcement'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Join prompt for non-members */}
                        {!joined && !isAdmin && (
                            <div className={styles.joinPrompt}>
                                <span>🔔</span>
                                <div>
                                    <strong>Join to see all announcements!</strong>
                                    <p>Members get notified about events, updates, and much more.</p>
                                </div>
                                <button className={styles.joinPromptBtn} onClick={handleJoin} disabled={joiningLoading}>
                                    {joiningLoading ? 'Joining...' : 'Join Club'}
                                </button>
                            </div>
                        )}

                        {announcements.length === 0 ? (
                            <div className={styles.emptyTab}>
                                <div className={styles.emptyTabIcon}>📭</div>
                                <p>No announcements yet.{isAdmin ? ' Be the first to post!' : ' Check back soon!'}</p>
                            </div>
                        ) : (
                            <div className={styles.announcementList}>
                                {announcements.map((a, i) => (
                                    <div key={a.id}
                                        className={`${styles.announcementCard} ${a.pinned ? styles.pinnedCard : ''}`}
                                        style={{ animationDelay: `${i * 60}ms` }}
                                    >
                                        {a.pinned && <div className={styles.pinnedBanner}>📌 Pinned</div>}
                                        <div className={styles.announceHeader}>
                                            <div className={styles.announceAuthorRow}>
                                                <div className={styles.announceAvatar}>{a.authorEmoji || a.authorName?.charAt(0) || '👤'}</div>
                                                <div>
                                                    <div className={styles.announceAuthor}>{a.authorName}</div>
                                                    <div className={styles.announceTime}>{formatDate(a.createdAt)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.announceBody}>{a.content}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── MEMBERS TAB ── */}
                {activeTab === 'members' && (
                    <div className={styles.tabContent}>
                        <div className={styles.membersHeader}>
                            <span className={styles.membersTitle}>Members</span>
                            <span className={styles.membersSubtitle}>({club.membersCount || members.length} total)</span>
                        </div>
                        <div className={styles.memberGrid}>
                            {members.map((m, i) => {
                                const colors = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4'];
                                const bg = colors[i % colors.length];
                                const role = m.role || 'Member';
                                return (
                                    <div key={m.id} className={styles.memberCard} style={{ animationDelay: `${i * 50}ms` }}>
                                        <div className={styles.memberAvatarWrap}>
                                            <div className={styles.memberAvatar} style={{ background: bg }}>
                                                {m.photoURL
                                                    ? <img src={m.photoURL} alt={m.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                                                    : (m.emoji || m.name?.charAt(0) || '?')}
                                            </div>
                                            {role === 'Admin' && <span className={styles.adminCrown}>👑</span>}
                                        </div>
                                        <div className={styles.memberInfo}>
                                            <div className={styles.memberName}>{m.name || 'Member'}</div>
                                            {m.branch && <div className={styles.memberBranch}>{m.branch} {m.year ? `· ${m.year}` : ''}</div>}
                                            <span className={`${styles.memberRoleBadge} ${role === 'Admin' ? styles.adminBadge : role === 'Core Team' ? styles.coreBadge : ''}`}>
                                                {role === 'Admin' ? '⭐ Admin' : role === 'Core Team' ? '🔶 Core Team' : '• Member'}
                                            </span>
                                        </div>
                                        <span className={styles.memberArrow}>›</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── ABOUT TAB ── */}
                {activeTab === 'about' && (
                    <div className={styles.tabContent}>
                        <div className={styles.aboutGrid}>
                            {/* Description */}
                            <div className={styles.aboutCard} style={{ gridColumn: '1 / -1' }}>
                                <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>📖</div>
                                <div className={styles.aboutCardTitle}>About the Club</div>
                                <div className={styles.aboutCardText}>{club.description}</div>
                            </div>

                            {/* Tags */}
                            {club.tags?.length > 0 && (
                                <div className={styles.aboutCard}>
                                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>🏷️</div>
                                    <div className={styles.aboutCardTitle}>Tags & Interests</div>
                                    <div className={styles.aboutTagsRow}>
                                        {club.tags.map(tag => (
                                            <span key={tag} className={styles.aboutTag}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Meeting schedule */}
                            {club.meetSchedule && (
                                <div className={styles.aboutCard}>
                                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>📍</div>
                                    <div className={styles.aboutCardTitle}>Meeting Schedule</div>
                                    <div className={styles.aboutCardText}>{club.meetSchedule}</div>
                                </div>
                            )}

                            {/* Upcoming event */}
                            {club.upcomingEvent && (
                                <div className={styles.aboutCard}>
                                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>📅</div>
                                    <div className={styles.aboutCardTitle}>Upcoming Event</div>
                                    <div className={styles.aboutCardText}>{club.upcomingEvent}</div>
                                </div>
                            )}

                            {/* Join / Links */}
                            {(club.joiningLink || club.discord || club.whatsapp) && (
                                <div className={styles.aboutCard}>
                                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #5865f2, #06b6d4)' }}>🔗</div>
                                    <div className={styles.aboutCardTitle}>Join & Connect</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                                        {club.joiningLink && (
                                            <a href={club.joiningLink.startsWith('http') ? club.joiningLink : `https://${club.joiningLink}`}
                                                target="_blank" rel="noopener noreferrer" className={styles.aboutLinkBtn} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)' }}>
                                                📋 Registration Form ↗
                                            </a>
                                        )}
                                        {club.discord && (
                                            <a href={club.discord.startsWith('http') ? club.discord : `https://${club.discord}`}
                                                target="_blank" rel="noopener noreferrer" className={styles.aboutLinkBtn} style={{ background: 'rgba(88,101,242,0.1)', color: '#5865f2', borderColor: 'rgba(88,101,242,0.3)' }}>
                                                💬 Discord Server ↗
                                            </a>
                                        )}
                                        {club.whatsapp && (
                                            <a href={club.whatsapp.startsWith('http') ? club.whatsapp : `https://${club.whatsapp}`}
                                                target="_blank" rel="noopener noreferrer" className={styles.aboutLinkBtn} style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', borderColor: 'rgba(34,197,94,0.3)' }}>
                                                📱 WhatsApp Group ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Supervisor */}
                            {club.supervisorName && (
                                <div className={styles.aboutCard}>
                                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>🎓</div>
                                    <div className={styles.aboutCardTitle}>Faculty Supervisor</div>
                                    <div className={styles.aboutCardText}>
                                        <strong>{club.supervisorName}</strong>
                                        {club.supervisorEmail && (
                                            <div style={{ marginTop: 4 }}>
                                                <a href={`mailto:${club.supervisorEmail}`} className={styles.discordLink}>
                                                    ✉️ {club.supervisorEmail}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── SETTINGS TAB ── */}
                {activeTab === 'settings' && isAdmin && (
                    <div className={styles.tabContent}>
                        {isMock && (
                            <div className={styles.mockNotice}>
                                ⚠️ Settings are read-only in demo mode. Create a real club to edit!
                            </div>
                        )}
                        <div className={styles.settingsSection}>
                            <div className={styles.settingsTitle}>✏️ Club Details</div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Club Name</label>
                                <input className={styles.input} value={editName} onChange={e => setEditName(e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Description</label>
                                <textarea className={styles.textarea} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>📍 Meeting Schedule</label>
                                <input className={styles.input} value={editMeet} onChange={e => setEditMeet(e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>📅 Upcoming Event</label>
                                <input className={styles.input} value={editEvent} onChange={e => setEditEvent(e.target.value)} />
                            </div>
                        </div>

                        <div className={styles.settingsSection}>
                            <div className={styles.settingsTitle}>🔗 Links & Communication</div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>🌐 Joining / Registration Link</label>
                                <input className={styles.input} type="url" value={editJoiningLink} onChange={e => setEditJoiningLink(e.target.value)} placeholder="https://forms.google.com/..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>💬 Discord Server</label>
                                <input className={styles.input} value={editDiscord} onChange={e => setEditDiscord(e.target.value)} placeholder="discord.gg/..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>📱 WhatsApp Group</label>
                                <input className={styles.input} value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} placeholder="chat.whatsapp.com/..." />
                            </div>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || isMock}>
                                {saving ? 'Saving...' : '💾 Save Changes'}
                            </button>
                        </div>

                        <div className={`${styles.settingsSection} ${styles.dangerZone}`}>
                            <div className={styles.settingsTitle}>⚠️ Danger Zone</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
                                Permanently delete this club and all its data. This action cannot be undone.
                            </p>
                            <button className={styles.deleteBtn} onClick={handleDelete} disabled={isMock}>
                                🗑️ Delete Club
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

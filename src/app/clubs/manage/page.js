/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
    collection, getDocs, doc, getDoc, updateDoc, deleteDoc,
    addDoc, serverTimestamp, query, where, orderBy, onSnapshot,
    arrayRemove, increment,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const PREDEFINED_ROLES = [
    'Member',
    'Core Team',
    'Vice President',
    'Secretary',
    'Treasurer',
    'Webmaster',
    'Event Coordinator',
    'Marketing Lead',
    'PR Head',
    'Design Lead',
    'Technical Lead',
];

const ROLE_COLORS = {
    'Admin': '#f59e0b',
    'Core Team': '#6366f1',
    'Vice President': '#ec4899',
    'Secretary': '#06b6d4',
    'Treasurer': '#10b981',
    'Webmaster': '#3b82f6',
    'Event Coordinator': '#f97316',
    'Marketing Lead': '#8b5cf6',
    'PR Head': '#14b8a6',
    'Design Lead': '#e879f9',
    'Technical Lead': '#0ea5e9',
    'Member': '#94a3b8',
};

const AVATAR_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#06b6d4','#8b5cf6','#f97316','#3b82f6'];

export default function ClubManagementPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [managedClubs, setManagedClubs] = useState([]);
    const [selectedClubId, setSelectedClubId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('members');

    // Members
    const [membersData, setMembersData] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingRole, setUpdatingRole] = useState(null);

    // Announcements
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [posting, setPosting] = useState(false);

    // Settings
    const [editFields, setEditFields] = useState({});
    const [saving, setSaving] = useState(false);

    // ── Fetch managed clubs ──
    useEffect(() => {
        if (authLoading) return;
        if (!user) { setLoading(false); return; }

        const fetchManagedClubs = async () => {
            try {
                const snap = await getDocs(collection(db, 'clubs'));
                const clubs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const userClubs = clubs.filter(c =>
                    c.adminId === user.uid || (c.memberRoles && c.memberRoles[user.uid])
                );
                setManagedClubs(userClubs);
                if (userClubs.length > 0) setSelectedClubId(userClubs[0].id);
            } catch (err) {
                console.error('Error fetching clubs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchManagedClubs();
    }, [user, authLoading]);

    // ── Fetch members for selected club ──
    useEffect(() => {
        if (!selectedClubId) return;
        const activeClub = managedClubs.find(c => c.id === selectedClubId);
        if (!activeClub) return;

        // Populate settings fields
        setEditFields({
            name: activeClub.name || '',
            description: activeClub.description || '',
            meetSchedule: activeClub.meetSchedule || '',
            upcomingEvent: activeClub.upcomingEvent || '',
            discord: activeClub.discord || '',
            joiningLink: activeClub.joiningLink || '',
            whatsapp: activeClub.whatsapp || '',
            supervisorName: activeClub.supervisorName || '',
            supervisorEmail: activeClub.supervisorEmail || '',
        });

        const fetchMembers = async () => {
            setMembersLoading(true);
            if (!activeClub.members || activeClub.members.length === 0) {
                setMembersData([]);
                setMembersLoading(false);
                return;
            }
            try {
                const profiles = await Promise.all(
                    activeClub.members.map(async (uid) => {
                        const mDoc = await getDoc(doc(db, 'users', uid));
                        return mDoc.exists()
                            ? { uid, ...mDoc.data() }
                            : { uid, name: 'Unknown User', email: '' };
                    })
                );
                const enriched = profiles.map(m => {
                    let role = 'Member';
                    if (activeClub.adminId === m.uid) role = 'Admin';
                    else if (activeClub.memberRoles?.[m.uid]) role = activeClub.memberRoles[m.uid];
                    return { ...m, currentRole: role };
                });
                enriched.sort((a, b) => {
                    if (a.currentRole === 'Admin') return -1;
                    if (b.currentRole === 'Admin') return 1;
                    if (a.currentRole !== 'Member' && b.currentRole === 'Member') return -1;
                    if (a.currentRole === 'Member' && b.currentRole !== 'Member') return 1;
                    return (a.name || '').localeCompare(b.name || '');
                });
                setMembersData(enriched);
            } catch (err) {
                console.error('Error fetching members:', err);
            } finally {
                setMembersLoading(false);
            }
        };
        fetchMembers();
    }, [selectedClubId, managedClubs]);

    // ── Announcements real-time listener ──
    useEffect(() => {
        if (!selectedClubId) return;
        const q = query(
            collection(db, 'clubAnnouncements'),
            where('clubId', '==', selectedClubId)
        );
        const unsub = onSnapshot(q, snap => {
            const anns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            anns.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            setAnnouncements(anns);
        }, err => console.error('Announcements error:', err));
        return () => unsub();
    }, [selectedClubId]);

    // ── Derived data ──
    const activeClub = managedClubs.find(c => c.id === selectedClubId);
    const isOwner = activeClub && user && activeClub.adminId === user.uid;

    const filteredMembers = useMemo(() => {
        if (!searchQuery.trim()) return membersData;
        const q = searchQuery.toLowerCase();
        return membersData.filter(m =>
            (m.name || '').toLowerCase().includes(q) ||
            (m.email || '').toLowerCase().includes(q) ||
            (m.currentRole || '').toLowerCase().includes(q)
        );
    }, [membersData, searchQuery]);

    const stats = useMemo(() => {
        const specialRoles = membersData.filter(m => m.currentRole !== 'Member' && m.currentRole !== 'Admin');
        return {
            total: membersData.length,
            special: specialRoles.length,
            announcements: announcements.length,
            category: activeClub?.category || '-',
        };
    }, [membersData, announcements, activeClub]);

    // ── Actions ──
    const handleRoleChange = async (targetUid, newRole) => {
        if (!selectedClubId || !isOwner) return;
        setUpdatingRole(targetUid);
        try {
            const clubRef = doc(db, 'clubs', selectedClubId);
            const clubIndex = managedClubs.findIndex(c => c.id === selectedClubId);
            const currentRoles = { ...(managedClubs[clubIndex].memberRoles || {}) };

            if (newRole === 'Member') {
                delete currentRoles[targetUid];
            } else {
                currentRoles[targetUid] = newRole;
            }

            await updateDoc(clubRef, { memberRoles: currentRoles });

            setManagedClubs(prev => {
                const copy = [...prev];
                copy[clubIndex] = { ...copy[clubIndex], memberRoles: currentRoles };
                return copy;
            });
            setMembersData(prev =>
                prev.map(m => m.uid === targetUid ? { ...m, currentRole: newRole } : m)
            );
        } catch (err) {
            console.error('Role update error:', err);
            alert('Failed to assign position.');
        } finally {
            setUpdatingRole(null);
        }
    };

    const handleRemoveMember = async (targetUid) => {
        if (!selectedClubId || !isOwner) return;
        if (targetUid === user.uid) return;
        if (!confirm('Remove this member from the club?')) return;
        try {
            const clubRef = doc(db, 'clubs', selectedClubId);
            await updateDoc(clubRef, {
                members: arrayRemove(targetUid),
                membersCount: increment(-1),
            });
            // Also remove from memberRoles if present
            const clubIndex = managedClubs.findIndex(c => c.id === selectedClubId);
            const currentRoles = { ...(managedClubs[clubIndex].memberRoles || {}) };
            delete currentRoles[targetUid];
            await updateDoc(clubRef, { memberRoles: currentRoles });

            setManagedClubs(prev => {
                const copy = [...prev];
                const club = copy[clubIndex];
                copy[clubIndex] = {
                    ...club,
                    members: (club.members || []).filter(uid => uid !== targetUid),
                    membersCount: (club.membersCount || 1) - 1,
                    memberRoles: currentRoles,
                };
                return copy;
            });
            setMembersData(prev => prev.filter(m => m.uid !== targetUid));
        } catch (err) {
            console.error('Remove member error:', err);
            alert('Failed to remove member.');
        }
    };

    const handlePostAnnouncement = async () => {
        if (!newAnnouncement.trim() || !user || !selectedClubId) return;
        setPosting(true);
        try {
            await addDoc(collection(db, 'clubAnnouncements'), {
                clubId: selectedClubId,
                authorId: user.uid,
                authorName: user.name || user.email?.split('@')[0],
                content: newAnnouncement.trim(),
                pinned: false,
                createdAt: serverTimestamp(),
            });
            setNewAnnouncement('');
        } catch (err) {
            console.error('Post error:', err);
            alert('Failed to post announcement.');
        }
        setPosting(false);
    };

    const handleDeleteAnnouncement = async (announcementId) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            await deleteDoc(doc(db, 'clubAnnouncements', announcementId));
        } catch (err) {
            console.error('Delete announcement error:', err);
        }
    };

    const handleSaveSettings = async () => {
        if (!selectedClubId || !isOwner) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'clubs', selectedClubId), {
                name: editFields.name.trim(),
                description: editFields.description.trim(),
                meetSchedule: editFields.meetSchedule.trim(),
                upcomingEvent: editFields.upcomingEvent.trim(),
                discord: editFields.discord.trim(),
                joiningLink: editFields.joiningLink.trim(),
                whatsapp: editFields.whatsapp.trim(),
                supervisorName: editFields.supervisorName.trim(),
                supervisorEmail: editFields.supervisorEmail.trim(),
            });
            setManagedClubs(prev => prev.map(c =>
                c.id === selectedClubId ? { ...c, ...editFields } : c
            ));
            alert('✅ Club settings saved!');
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save settings.');
        }
        setSaving(false);
    };

    const handleDeleteClub = async () => {
        if (!confirm(`Permanently delete "${activeClub?.name}"? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, 'clubs', selectedClubId));
            setManagedClubs(prev => prev.filter(c => c.id !== selectedClubId));
            setSelectedClubId(null);
            router.push('/clubs');
        } catch (err) {
            console.error('Delete club error:', err);
        }
    };

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
        } catch (_err) { return ''; }
    };

    // ── RENDER STATES ──
    if (authLoading || loading) {
        return (
            <div className={styles.loadingWrapper}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Loading your clubs...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.bgOrb1}></div>
                <div className={styles.bgOrb2}></div>
                <div className={styles.container}>
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🔒</div>
                        <h1 className={styles.emptyTitle}>Sign In Required</h1>
                        <p className={styles.emptyText}>You must log in to manage your clubs.</p>
                        <div className={styles.emptyActions}>
                            <Link href="/login" className={`${styles.emptyBtn} ${styles.emptyBtnPrimary}`}>
                                Sign In →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (managedClubs.length === 0) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.bgOrb1}></div>
                <div className={styles.bgOrb2}></div>
                <div className={styles.bgOrb3}></div>
                <div className={styles.container}>
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🚀</div>
                        <h1 className={styles.emptyTitle}>No Clubs to Manage... Yet!</h1>
                        <p className={styles.emptyText}>
                            Create your own club or get assigned a special position to start managing.
                        </p>
                        <div className={styles.emptyActions}>
                            <Link href="/clubs/create" className={`${styles.emptyBtn} ${styles.emptyBtnPrimary}`}>
                                ✨ Create a Club
                            </Link>
                            <Link href="/clubs" className={`${styles.emptyBtn} ${styles.emptyBtnSecondary}`}>
                                Browse Clubs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { key: 'members', label: 'Members', icon: '👥', count: stats.total },
        { key: 'announcements', label: 'Announcements', icon: '📢', count: stats.announcements },
        { key: 'settings', label: 'Settings', icon: '⚙️', count: null },
    ];

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.bgOrb1}></div>
            <div className={styles.bgOrb2}></div>
            <div className={styles.bgOrb3}></div>

            <div className={styles.container}>
                {/* ── Hero Header ── */}
                <div className={styles.heroHeader}>
                    <div className={styles.heroBadge}>
                        <span className={styles.heroBadgeDot}></span>
                        Club Command Center
                    </div>
                    <h1 className={styles.heroTitle}>
                        Manage Your <span className={styles.heroGradientText}>Clubs</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Assign positions, broadcast updates, and keep your community thriving.
                    </p>
                </div>

                {/* ── Club Selector ── */}
                <div className={styles.clubSelectorBar}>
                    {managedClubs.map(c => (
                        <button
                            key={c.id}
                            className={`${styles.clubSelectorItem} ${selectedClubId === c.id ? styles.clubSelectorItemActive : ''}`}
                            onClick={() => { setSelectedClubId(c.id); setActiveTab('members'); setSearchQuery(''); }}
                        >
                            <div className={styles.clubSelectorEmoji}>{c.emoji || '🏢'}</div>
                            <div>
                                <div className={styles.clubSelectorName}>{c.name}</div>
                                <div className={styles.clubSelectorCount}>{c.membersCount || 0} members</div>
                            </div>
                        </button>
                    ))}
                </div>

                {activeClub && (
                    <>
                        {/* ── Stats Row ── */}
                        <div className={styles.statsRow}>
                            <div className={styles.statCard}>
                                <div className={styles.statCardAccent} style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}></div>
                                <div className={styles.statIcon}>👥</div>
                                <div className={styles.statValue}>{stats.total}</div>
                                <div className={styles.statLabel}>Total Members</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statCardAccent} style={{ background: 'linear-gradient(90deg, #ec4899, #f97316)' }}></div>
                                <div className={styles.statIcon}>🌟</div>
                                <div className={styles.statValue}>{stats.special}</div>
                                <div className={styles.statLabel}>Special Roles</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statCardAccent} style={{ background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }}></div>
                                <div className={styles.statIcon}>📢</div>
                                <div className={styles.statValue}>{stats.announcements}</div>
                                <div className={styles.statLabel}>Announcements</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statCardAccent} style={{ background: 'linear-gradient(90deg, #10b981, #6366f1)' }}></div>
                                <div className={styles.statIcon}>{activeClub.emoji || '🏢'}</div>
                                <div className={styles.statValue} style={{ fontSize: '1rem' }}>{stats.category}</div>
                                <div className={styles.statLabel}>Category</div>
                            </div>
                        </div>

                        {/* ── Tabs ── */}
                        <div className={styles.tabsWrapper}>
                            {tabs.map(t => (
                                <button
                                    key={t.key}
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

                        {/* ══════════════ MEMBERS TAB ══════════════ */}
                        {activeTab === 'members' && (
                            <div className={styles.panelContent}>
                                <div className={styles.toolbar}>
                                    <div className={styles.searchBox}>
                                        <span className={styles.searchIcon}>🔍</span>
                                        <input
                                            className={styles.searchInput}
                                            placeholder="Search members by name, email, or role..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.toolbarActions}>
                                        <Link href={`/clubs/${selectedClubId}`} className={styles.toolbarBtn}>
                                            👁️ View Public Page
                                        </Link>
                                    </div>
                                </div>

                                {membersLoading ? (
                                    <div className={styles.loadingWrapper} style={{ height: '30vh' }}>
                                        <div className={styles.spinner}></div>
                                    </div>
                                ) : filteredMembers.length === 0 ? (
                                    <div className={styles.emptyState} style={{ padding: '40px' }}>
                                        <div className={styles.emptyIcon} style={{ fontSize: '2.5rem' }}>
                                            {searchQuery ? '🔍' : '👻'}
                                        </div>
                                        <p style={{ color: 'var(--text-muted)' }}>
                                            {searchQuery ? 'No members match your search.' : 'No members in this club yet.'}
                                        </p>
                                    </div>
                                ) : (
                                    <table className={styles.membersTable}>
                                        <thead>
                                            <tr>
                                                <th>Member</th>
                                                <th>Position</th>
                                                <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMembers.map((m, i) => {
                                                const bg = AVATAR_COLORS[i % AVATAR_COLORS.length];
                                                const roleColor = ROLE_COLORS[m.currentRole] || ROLE_COLORS['Member'];
                                                return (
                                                    <tr key={m.uid} className={styles.memberRow}>
                                                        <td>
                                                            <div className={styles.memberCell}>
                                                                <div className={styles.memberAvatar} style={{ background: bg }}>
                                                                    {m.photoURL ? (
                                                                        <img src={m.photoURL} alt="" className={styles.memberAvatarImg} referrerPolicy="no-referrer" />
                                                                    ) : (
                                                                        (m.name || 'U').charAt(0).toUpperCase()
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className={styles.memberName}>{m.name || 'Unknown'}</div>
                                                                    <div className={styles.memberEmail}>{m.email || ''}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {m.currentRole === 'Admin' ? (
                                                                <div className={styles.roleBadgeAdmin}>🛡️ Club Admin</div>
                                                            ) : (
                                                                <select
                                                                    className={styles.roleSelect}
                                                                    value={m.currentRole}
                                                                    onChange={e => handleRoleChange(m.uid, e.target.value)}
                                                                    disabled={updatingRole === m.uid || !isOwner}
                                                                    style={{ borderColor: `${roleColor}40` }}
                                                                >
                                                                    {PREDEFINED_ROLES.map(role => (
                                                                        <option key={role} value={role}>{role}</option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {m.currentRole !== 'Admin' && isOwner && (
                                                                <div className={styles.actionBtns}>
                                                                    <button
                                                                        className={styles.actionBtn}
                                                                        title="Remove member"
                                                                        onClick={() => handleRemoveMember(m.uid)}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* ══════════════ ANNOUNCEMENTS TAB ══════════════ */}
                        {activeTab === 'announcements' && (
                            <div className={styles.panelContent}>
                                {/* Compose */}
                                <div className={styles.composeBox}>
                                    <div className={styles.composeTitle}>📝 Post a New Announcement</div>
                                    <textarea
                                        className={styles.composeInput}
                                        placeholder="Write an announcement for all club members..."
                                        value={newAnnouncement}
                                        onChange={e => setNewAnnouncement(e.target.value)}
                                        maxLength={2000}
                                    />
                                    <div className={styles.composeFooter}>
                                        <span className={styles.composeTip}>
                                            {newAnnouncement.length}/2000 • Visible to all members
                                        </span>
                                        <button
                                            className={styles.composeBtn}
                                            onClick={handlePostAnnouncement}
                                            disabled={posting || !newAnnouncement.trim()}
                                        >
                                            {posting ? 'Posting...' : '📢 Post'}
                                        </button>
                                    </div>
                                </div>

                                {announcements.length === 0 ? (
                                    <div className={styles.emptyState} style={{ padding: '40px' }}>
                                        <div className={styles.emptyIcon} style={{ fontSize: '2.5rem' }}>📭</div>
                                        <p style={{ color: 'var(--text-muted)' }}>No announcements yet. Be the first to post!</p>
                                    </div>
                                ) : (
                                    announcements.map(a => (
                                        <div key={a.id} className={styles.announcementCard}>
                                            <div className={styles.announcementHeader}>
                                                <div className={styles.announcementAuthor}>
                                                    <div className={styles.announcementAva}>
                                                        {(a.authorName || 'A').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className={styles.announcementName}>{a.authorName}</div>
                                                        <div className={styles.announcementTime}>{formatDate(a.createdAt)}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    {a.pinned && <span className={styles.pinnedLabel}>📌 Pinned</span>}
                                                    {isOwner && (
                                                        <button
                                                            className={styles.deleteAnnouncementBtn}
                                                            onClick={() => handleDeleteAnnouncement(a.id)}
                                                            title="Delete"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.announcementBody}>{a.content}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ══════════════ SETTINGS TAB ══════════════ */}
                        {activeTab === 'settings' && (
                            <div className={styles.panelContent}>
                                {!isOwner ? (
                                    <div className={styles.emptyState} style={{ padding: '40px' }}>
                                        <div className={styles.emptyIcon} style={{ fontSize: '2.5rem' }}>🔐</div>
                                        <p className={styles.emptyText}>Only the club creator can modify settings.</p>
                                    </div>
                                ) : (
                                    <div className={styles.settingsGrid}>
                                        <div className={`${styles.settingsSection} ${styles.settingsSectionFull}`}>
                                            <div className={styles.settingsSectionTitle}>✏️ Club Details</div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Club Name</label>
                                                <input className={styles.input} value={editFields.name} onChange={e => setEditFields(p => ({...p, name: e.target.value}))} />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Description</label>
                                                <textarea className={styles.textarea} value={editFields.description} onChange={e => setEditFields(p => ({...p, description: e.target.value}))} />
                                            </div>
                                        </div>

                                        <div className={styles.settingsSection}>
                                            <div className={styles.settingsSectionTitle}>📍 Schedule & Events</div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Meeting Schedule</label>
                                                <input className={styles.input} value={editFields.meetSchedule} onChange={e => setEditFields(p => ({...p, meetSchedule: e.target.value}))} placeholder="e.g., Every Friday 5PM" />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Upcoming Event</label>
                                                <input className={styles.input} value={editFields.upcomingEvent} onChange={e => setEditFields(p => ({...p, upcomingEvent: e.target.value}))} placeholder="e.g., Hackathon — May 3rd" />
                                            </div>
                                        </div>

                                        <div className={styles.settingsSection}>
                                            <div className={styles.settingsSectionTitle}>🔗 Links & Socials</div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Joining Link</label>
                                                <input className={styles.input} value={editFields.joiningLink} onChange={e => setEditFields(p => ({...p, joiningLink: e.target.value}))} placeholder="https://..." />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Discord Server</label>
                                                <input className={styles.input} value={editFields.discord} onChange={e => setEditFields(p => ({...p, discord: e.target.value}))} placeholder="discord.gg/..." />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>WhatsApp Group</label>
                                                <input className={styles.input} value={editFields.whatsapp} onChange={e => setEditFields(p => ({...p, whatsapp: e.target.value}))} placeholder="chat.whatsapp.com/..." />
                                            </div>
                                        </div>

                                        <div className={styles.settingsSection}>
                                            <div className={styles.settingsSectionTitle}>🎓 Faculty Supervisor</div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Supervisor Name</label>
                                                <input className={styles.input} value={editFields.supervisorName} onChange={e => setEditFields(p => ({...p, supervisorName: e.target.value}))} />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Supervisor Email</label>
                                                <input className={styles.input} type="email" value={editFields.supervisorEmail} onChange={e => setEditFields(p => ({...p, supervisorEmail: e.target.value}))} />
                                            </div>
                                        </div>

                                        <div className={`${styles.settingsSection} ${styles.settingsSectionFull}`} style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 28px' }}>
                                            <button className={styles.saveBtn} onClick={handleSaveSettings} disabled={saving}>
                                                {saving ? 'Saving...' : '💾 Save All Changes'}
                                            </button>
                                        </div>

                                        <div className={`${styles.settingsSection} ${styles.settingsSectionFull} ${styles.dangerZone}`}>
                                            <div className={styles.settingsSectionTitle}>⚠️ Danger Zone</div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
                                                Permanently delete this club and all its data. This cannot be undone.
                                            </p>
                                            <button className={styles.deleteBtn} onClick={handleDeleteClub}>
                                                🗑️ Delete Club Forever
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

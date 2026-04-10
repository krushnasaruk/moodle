'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { IconUpload, IconDownload, IconStar, IconFolder, IconNotes, IconPyq, IconAssignment, IconLock } from '@/components/Icons';
import { BRANCHES, YEARS, SEMESTERS, COLLEGES, getSubjects } from '@/lib/subjectMap';
import styles from './page.module.css';

function getUploadIcon(type) {
    switch (type) {
        case 'Notes': return <IconNotes size={20} />;
        case 'PYQ': return <IconPyq size={20} />;
        case 'Assignment': return <IconAssignment size={20} />;
        default: return <IconFolder size={20} />;
    }
}

function getTypeClass(type) {
    switch (type) {
        case 'Notes': return styles.iconNotes;
        case 'PYQ': return styles.iconPyq;
        case 'Assignment': return styles.iconAssignment;
        default: return styles.iconNotes;
    }
}

function getStatusBadge(status) {
    switch (status) {
        case 'pending': return <span className={styles.statusPending}>⏳ Pending</span>;
        case 'approved': return <span className={styles.statusApproved}>✅ Live</span>;
        case 'rejected': return <span className={styles.statusRejected}>❌ Rejected</span>;
        default: return null;
    }
}

export default function DashboardPage() {
    const { user, updateUserProfile } = useAuth();
    const [uploads, setUploads] = useState([]);
    const [loadingUploads, setLoadingUploads] = useState(true);
    const [editing, setEditing] = useState(false);

    const [editCollege, setEditCollege] = useState('');
    const [editBranch, setEditBranch] = useState('');
    const [editYear, setEditYear] = useState('');
    const [editSemester, setEditSemester] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editTheme, setEditTheme] = useState('purple');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) { setLoadingUploads(false); return; }
        let cancelled = false;
        const fetchUploads = async () => {
            setLoadingUploads(true);
            try {
                if (!db) throw new Error('Firestore not initialized');
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
                const fetchPromise = getDocs(collection(db, 'files'));
                const snapshot = await Promise.race([fetchPromise, timeout]);
                if (cancelled) return;
                const data = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(f => f.uploaderUID === user.uid);
                data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                setUploads(data);
            } catch (error) {
                console.error('Error fetching uploads:', error);
                if (!cancelled) setUploads([]);
            }
            if (!cancelled) setLoadingUploads(false);
        };
        fetchUploads();
        return () => { cancelled = true; };
    }, [user]);

    const startEditing = () => {
        setEditCollege(user.college || '');
        setEditBranch(user.branch || '');
        setEditYear(user.year || '');
        setEditSemester(user.semester || '');
        setEditBio(user.bio || '');
        setEditTheme(user.themeAccent || 'purple');
        setEditing(true);
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const subjects = getSubjects(editBranch, editSemester);
            await updateUserProfile({
                college: editCollege, branch: editBranch, year: editYear,
                semester: editSemester, subjects: subjects,
                bio: editBio, themeAccent: editTheme,
                profileComplete: true,
            });
            setEditing(false);
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div className={styles.loginPrompt}>
                        <div className={styles.loginIcon}><IconLock size={64} /></div>
                        <h2 className={styles.loginTitle}>Sign In to View Dashboard</h2>
                        <p className={styles.loginText}>Track your uploads, saved notes, and contribution points.</p>
                        <Link href="/login" className={styles.loginBtn}>Sign In</Link>
                    </div>
                </div>
            </div>
        );
    }

    const totalDownloads = uploads.reduce((sum, u) => sum + (u.downloads || 0), 0);
    const availableSemesters = editYear ? (SEMESTERS[editYear] || []) : [];

    const THEME_GRADIENTS = {
        purple: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(157, 78, 221, 0.15) 100%)',
        gold: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(245, 158, 11, 0.15) 100%)',
        neo: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(0, 245, 212, 0.15) 100%)',
        crimson: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(239, 68, 68, 0.15) 100%)'
    };

    const headerStyle = {
        background: THEME_GRADIENTS[user.themeAccent] || THEME_GRADIENTS.purple,
    };

    // --- Gamification Logic ---
    const userPoints = user.points || 0;
    let userLevel = 1;
    let nextLevelPoints = 50;
    
    if (userPoints >= 500) { userLevel = 5; nextLevelPoints = 1000; }
    else if (userPoints >= 250) { userLevel = 4; nextLevelPoints = 500; }
    else if (userPoints >= 100) { userLevel = 3; nextLevelPoints = 250; }
    else if (userPoints >= 50) { userLevel = 2; nextLevelPoints = 100; }

    const prevLevelPoints = userLevel === 1 ? 0 : (userLevel === 2 ? 50 : (userLevel === 3 ? 100 : (userLevel === 4 ? 250 : 500)));
    const levelProgress = Math.min(100, Math.max(0, ((userPoints - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100));

    const earnedBadges = [];
    if (uploads.length >= 1) earnedBadges.push({ icon: '🎓', name: 'First Upload', color: '#3b82f6' });
    if (uploads.length >= 5) earnedBadges.push({ icon: '🔥', name: 'Contributor', color: '#f59e0b' });
    if (totalDownloads >= 100) earnedBadges.push({ icon: '⭐', name: 'Influencer', color: '#a855f7' });
    if (userLevel >= 3) earnedBadges.push({ icon: '🏆', name: 'Veteran', color: '#ef4444' });

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                <div className={styles.profileHeader} style={headerStyle}>
                    <div className={styles.profileAvatar}>
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />
                        ) : (
                            <div className={styles.profileAvatarFallback}>
                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                        <div className={styles.levelBadge}>LVL {userLevel}</div>
                    </div>
                    <div className={styles.profileInfo}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1>{user.name}</h1>
                            <div className={styles.pointsBadge}>⭐ {userPoints} LP</div>
                        </div>
                        <p>{user.email}</p>
                        {user.bio && <p style={{ marginTop: '6px', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '400px' }}>"{user.bio}"</p>}
                        
                        <div className={styles.progressContainer}>
                            <div className={styles.progressHeader} style={{ color: 'var(--text-secondary)' }}>
                                <span>Level {userLevel} Progress</span>
                                <span>{userPoints} / {nextLevelPoints} Points</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${levelProgress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bento Grid Redesign */}
                <div className={styles.bentoGrid}>
                    {/* Tile 1: Academic Profile */}
                    <div className={styles.bentoTile} style={{ gridColumn: 'span 2' }}>
                        {!editing ? (
                            <div className={styles.profileSection}>
                                <div className={styles.profileSectionHeader}>
                                    <h2 className={styles.sectionTitle}><IconNotes size={24} /> Academic Profile</h2>
                                    <button className={styles.editBtn} onClick={startEditing}>Edit</button>
                                </div>
                                {user.branch ? (
                                    <div className={styles.profileGrid}>
                                        <div className={styles.profileField}><span className={styles.fieldLabel}>College</span><span className={styles.fieldValue}>{user.college || 'Not set'}</span></div>
                                        <div className={styles.profileField}><span className={styles.fieldLabel}>Branch</span><span className={styles.fieldValue}>{user.branch}</span></div>
                                        <div className={styles.profileField}><span className={styles.fieldLabel}>Year</span><span className={styles.fieldValue}>{user.year}</span></div>
                                        <div className={styles.profileField}><span className={styles.fieldLabel}>Semester</span><span className={styles.fieldValue}>{user.semester}</span></div>
                                    </div>
                                ) : (
                                    <div className={styles.noProfile}>
                                        <p>No academic profile set. <button onClick={startEditing} className={styles.link}>Set it up now →</button></p>
                                    </div>
                                )}
                                {user.subjects && user.subjects.length > 0 && (
                                    <div className={styles.subjectChips}>
                                        {user.subjects.map(s => <span key={s} className={styles.subjectChip}>{s}</span>)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.profileSection}>
                                <h2 className={styles.sectionTitle}>Customize Profile</h2>
                                <div className={styles.editGrid}>
                                    <div className={styles.editField} style={{ gridColumn: '1 / -1' }}>
                                        <label>Short Bio</label>
                                        <input type="text" maxLength={60} value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="e.g. Code wizard & coffee consumer" />
                                    </div>
                                    <div className={styles.editField}>
                                        <label>ID Card Theme</label>
                                        <select value={editTheme} onChange={(e) => setEditTheme(e.target.value)}>
                                            <option value="purple">Midnight Purple</option>
                                            <option value="gold">Royal Gold</option>
                                            <option value="neo">Neo Cyan</option>
                                            <option value="crimson">Crimson Red</option>
                                        </select>
                                    </div>
                                    <div className={styles.editField}>
                                        <label>College</label>
                                        <select value={editCollege} onChange={(e) => setEditCollege(e.target.value)}>
                                            <option value="">Select</option>
                                            {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.editField}>
                                        <label>Branch</label>
                                        <select value={editBranch} onChange={(e) => { setEditBranch(e.target.value); setEditSemester(''); }}>
                                            <option value="">Select</option>
                                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.editField}>
                                        <label>Year</label>
                                        <select value={editYear} onChange={(e) => { setEditYear(e.target.value); setEditSemester(''); }}>
                                            <option value="">Select</option>
                                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.editField}>
                                        <label>Semester</label>
                                        <select value={editSemester} onChange={(e) => setEditSemester(e.target.value)} disabled={!editYear}>
                                            <option value="">Select</option>
                                            {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.editActions}>
                                    <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
                                    <button className={styles.saveBtn} onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tile 2: Stats & Badges */}
                    <div className={styles.bentoTile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Overview</h2>
                        <div className={styles.bentoStats}>
                            <div className={styles.bentoStatCard}>
                                <div className={styles.statIcon}><IconUpload size={20} /></div>
                                <div>
                                    <div className={styles.bentoStatNum}>{uploads.length}</div>
                                    <div className={styles.bentoStatLabel}>Uploads</div>
                                </div>
                            </div>
                            <div className={styles.bentoStatCard}>
                                <div className={styles.statIcon}><IconDownload size={20} /></div>
                                <div>
                                    <div className={styles.bentoStatNum}>{totalDownloads}</div>
                                    <div className={styles.bentoStatLabel}>Downloads</div>
                                </div>
                            </div>
                        </div>

                        {earnedBadges.length > 0 && (
                            <div style={{ marginTop: 'auto' }}>
                                <h3 className={styles.bentoStatLabel} style={{ marginBottom: '12px' }}>Earned Badges</h3>
                                <div className={styles.badgesWrapper}>
                                    {earnedBadges.map(badge => (
                                        <div key={badge.name} className={styles.badgeItem} style={{ borderLeftColor: badge.color }}>
                                            <span className={styles.badgeIcon}>{badge.icon}</span>
                                            <span className={styles.badgeName}>{badge.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tile 3: My Uploads */}
                    <div className={`${styles.bentoTile} ${styles.uploadsTile}`}>
                        <h2 className={styles.sectionTitle}><IconFolder size={24} /> My Uploads</h2>
                        {loadingUploads ? (
                            <div className={styles.emptyState}><div className={styles.emptyText}>Loading your uploads...</div></div>
                        ) : uploads.length === 0 ? (
                            <div className={styles.emptyStateGamified}>
                                <div className={styles.bountyIcon}>🎯</div>
                                <div className={styles.emptyText} style={{ fontSize: '1.25rem', color: '#fff' }}>Bounty Available: First Upload</div>
                                <div className={styles.emptySub} style={{ margin: '12px 0 24px', opacity: 0.8 }}>
                                    The platform is powered by students like you. Upload your first PDF to unlock the <strong style={{ color: 'var(--primary-light)' }}>🎓 First Upload</strong> badge and earn <strong style={{ color: 'var(--accent)' }}>50 Points</strong>!
                                </div>
                                <Link href="/upload" className={styles.btnBounty}>
                                    Claim Bounty →
                                </Link>
                            </div>
                        ) : (
                            <div className={styles.uploadsList}>
                                {uploads.map((item) => (
                                    <div key={item.id} className={styles.uploadItem}>
                                        <div className={`${styles.uploadIcon} ${getTypeClass(item.type)}`}>{getUploadIcon(item.type)}</div>
                                        <div className={styles.uploadDetails}>
                                            <div className={styles.uploadTitle}>{item.title}</div>
                                            <div className={styles.uploadMeta}>
                                                {item.type} · {item.subject} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                                                {' · '}{getStatusBadge(item.status)}
                                            </div>
                                        </div>
                                        <div className={styles.uploadStats}>
                                            <span><IconDownload size={14} /> {item.downloads || 0}</span>
                                            <span><IconStar size={14} /> {item.rating || '—'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

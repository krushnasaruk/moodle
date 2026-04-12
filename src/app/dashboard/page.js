'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { IconUpload, IconDownload, IconStar, IconFolder, IconNotes, IconPyq, IconAssignment, IconLock, IconCalendar } from '@/components/Icons';
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

    // Profile Edit State
    const [editCollege, setEditCollege] = useState('');
    const [editBranch, setEditBranch] = useState('');
    const [editYear, setEditYear] = useState('');
    const [editSemester, setEditSemester] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editTheme, setEditTheme] = useState('purple');
    const [saving, setSaving] = useState(false);

    // Class Hub State
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, total: 0, percentage: 0 });
    const [announcements, setAnnouncements] = useState([]);
    const [classMaterials, setClassMaterials] = useState([]);
    const [loadingClassData, setLoadingClassData] = useState(false);

    useEffect(() => {
        if (!user) { setLoadingUploads(false); return; }
        let cancelled = false;

        const fetchPersonalUploads = async () => {
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

        const fetchClassData = async () => {
            if (!user.classId) return;
            setLoadingClassData(true);
            try {
                // 1. Fetch entire attendance for the class to calc personal stats
                const attQuery = query(collection(db, 'attendance'), where('classId', '==', user.classId));
                const attSnap = await getDocs(attQuery);
                let p = 0, a = 0, l = 0;
                attSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data.presentStudents?.includes(user.email)) p++;
                    else if (data.absentStudents?.includes(user.email)) a++;
                    else if (data.lateStudents?.includes(user.email)) l++;
                });
                const total = p + a + l;
                const pct = total > 0 ? Math.round(((p + (l * 0.5)) / total) * 100) : 0; // Late counts as half presence for visual metric (or adjust as needed)
                if (!cancelled) setAttendanceStats({ present: p, absent: a, late: l, total, percentage: pct });

                // 2. Fetch Announcements
                const annQuery = query(collection(db, 'announcements'), where('classId', '==', user.classId));
                const annSnap = await getDocs(annQuery);
                const annList = annSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                annList.sort((x, y) => (y.timestamp || '').localeCompare(x.timestamp || ''));
                if (!cancelled) setAnnouncements(annList);

                // 3. Fetch Class Uploads
                const matQuery = query(collection(db, 'files'), where('classId', '==', user.classId));
                const matSnap = await getDocs(matQuery);
                const matList = matSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                matList.sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''));
                if (!cancelled) setClassMaterials(matList);

            } catch(e) {
                console.error("Error fetching class data:", e);
            }
            if (!cancelled) setLoadingClassData(false);
        };

        fetchPersonalUploads();
        fetchClassData();

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
                    <div className={`${styles.loginPrompt} glass-panel`}>
                        <div className={styles.loginIcon}><IconLock size={64} /></div>
                        <h2 className={styles.loginTitle}>Sign In Required</h2>
                        <p className={styles.loginText}>Track your uploads, saved notes, and contribution points.</p>
                        <Link href="/login" className={styles.loginBtn}>Authenticate Now</Link>
                    </div>
                </div>
            </div>
        );
    }

    const totalDownloads = uploads.reduce((sum, u) => sum + (u.downloads || 0), 0);
    const availableSemesters = editYear ? (SEMESTERS[editYear] || []) : [];

    const THEME_GRADIENTS = {
        purple: 'linear-gradient(135deg, rgba(30, 30, 40, 0.4) 0%, rgba(138, 43, 226, 0.2) 100%)',
        gold: 'linear-gradient(135deg, rgba(30, 30, 40, 0.4) 0%, rgba(245, 158, 11, 0.2) 100%)',
        neo: 'linear-gradient(135deg, rgba(30, 30, 40, 0.4) 0%, rgba(0, 229, 255, 0.2) 100%)',
        crimson: 'linear-gradient(135deg, rgba(30, 30, 40, 0.4) 0%, rgba(255, 0, 127, 0.2) 100%)'
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
    if (totalDownloads >= 100) earnedBadges.push({ icon: '⭐', name: 'Influencer', color: '#8a2be2' });
    if (userLevel >= 3) earnedBadges.push({ icon: '🏆', name: 'Veteran', color: '#ff007f' });

    // Determine ring color
    let ringColor = 'var(--success)';
    if (attendanceStats.percentage < 75) ringColor = 'var(--error)';
    else if (attendanceStats.percentage < 85) ringColor = 'var(--warning)';

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                
                {/* Header UI - Premium Apple Card Style */}
                <div className={`${styles.profileHeader} glass-panel`} style={headerStyle}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h1>{user.name}</h1>
                            <div className={styles.pointsBadge}>⭐ {userPoints} LP</div>
                            {user.classId && <div className={styles.pointsBadge} style={{ background: 'var(--primary)', color:'white' }}>📘 {user.classId}</div>}
                        </div>
                        <p>{user.email}</p>
                        {user.bio && <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '500px' }}>"{user.bio}"</p>}
                        
                        <div className={styles.progressContainer}>
                            <div className={styles.progressHeader}>
                                <span>Level {userLevel} Progress</span>
                                <span>{userPoints} / {nextLevelPoints} Points</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${levelProgress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.bentoGrid}>

                    {/* NEW: CLASS HUB TILE */}
                    {user.classId && !loadingClassData && (
                        <div className={`${styles.bentoTile} ${styles.classHubTile} glass-panel`}>
                            <div className={styles.hubHeader}>
                                <div>
                                    <h2 className={styles.sectionTitle} style={{margin:0}}>Class Hub</h2>
                                    <p style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>{user.classId} Dashboard</p>
                                </div>
                            </div>
                            
                            <div className={styles.hubGrid}>
                                {/* Attendance Ring */}
                                <div className={styles.attendanceBox}>
                                    <h3>Live Attendance</h3>
                                    <div className={styles.ringWrapper}>
                                        <svg viewBox="0 0 36 36" className={styles.circularChart}>
                                            <path className={styles.circleBg}
                                                d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            {attendanceStats.total > 0 && (
                                                <path className={styles.circleFill}
                                                    strokeDasharray={`${attendanceStats.percentage}, 100`}
                                                    style={{ stroke: ringColor }}
                                                    d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                            )}
                                        </svg>
                                        <div className={styles.ringText}>
                                            <span className={styles.ringPercent}>{attendanceStats.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className={styles.attStatsRow}>
                                        <div className={styles.attStat}><span style={{color:'var(--success)'}}>P:</span> {attendanceStats.present}</div>
                                        <div className={styles.attStat}><span style={{color:'var(--error)'}}>A:</span> {attendanceStats.absent}</div>
                                        <div className={styles.attStat}><span style={{color:'var(--warning)'}}>L:</span> {attendanceStats.late}</div>
                                    </div>
                                    {attendanceStats.percentage < 75 && attendanceStats.total > 0 && (
                                        <p className={styles.attWarning}>⚠️ Warning: Attendance is below 75%.</p>
                                    )}
                                </div>

                                {/* Announcements */}
                                <div className={styles.announcementsBox}>
                                    <h3>Teacher Announcements</h3>
                                    <div className={styles.announcementList}>
                                        {announcements.length > 0 ? announcements.map(ann => (
                                            <div key={ann.id} className={styles.announcementCard}>
                                                <div className={styles.annMeta}>
                                                    <span className={styles.annTeacher}>{ann.teacherName}</span>
                                                    <span className={styles.annDate}>
                                                        {new Date(ann.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className={styles.annMessage}>{ann.message}</p>
                                            </div>
                                        )) : (
                                            <div className={styles.emptyAnnouncements}>No announcements yet.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Tile 1: Academic Profile */}
                    <div className={`${styles.bentoTile} glass-panel`}>
                        {!editing ? (
                            <div className={styles.profileSection}>
                                <div className={styles.profileSectionHeader}>
                                    <h2 className={styles.sectionTitle}><IconNotes size={24} /> Profile Engine</h2>
                                    <button className={styles.editBtn} onClick={startEditing}>Configure</button>
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
                                <h2 className={styles.sectionTitle} style={{marginBottom:'20px'}}>Configure Profile</h2>
                                <div className={styles.editGrid}>
                                    <div className={styles.editField} style={{ gridColumn: '1 / -1' }}>
                                        <label>Short Bio</label>
                                        <input type="text" maxLength={60} value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="e.g. Code wizard & coffee consumer" />
                                    </div>
                                    <div className={styles.editField}>
                                        <label>ID Card Theme</label>
                                        <select value={editTheme} onChange={(e) => setEditTheme(e.target.value)}>
                                            <option value="purple">Midnight Purple</option>
                                            <option value="neo">Neo Cyan</option>
                                            <option value="crimson">Crimson Red</option>
                                            <option value="gold">Royal Gold</option>
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
                                    <button className={styles.saveBtn} onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Configuration'}</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tile 2: Stats & Badges */}
                    <div className={`${styles.bentoTile} glass-panel`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Metrics</h2>
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
                                <h3 className={styles.bentoStatLabel} style={{ marginBottom: '12px' }}>Earned Trophies</h3>
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

                    {/* NEW: Teacher Added Material Tile (if in Roster) */}
                    {user.classId && classMaterials.length > 0 && (
                        <div className={`${styles.bentoTile} ${styles.uploadsTile} glass-panel`}>
                            <h2 className={styles.sectionTitle} style={{color: 'var(--secondary)'}}>📘 Teacher Materials</h2>
                            <p style={{color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem'}}>Curated directly for {user.classId}.</p>
                            <div className={styles.uploadsList}>
                                {classMaterials.map((item) => (
                                    <div key={item.id} className={styles.uploadItem}>
                                        <div className={`${styles.uploadIcon} ${getTypeClass(item.type)}`}>{getUploadIcon(item.type)}</div>
                                        <div className={styles.uploadDetails}>
                                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.uploadTitle} style={{textDecoration: 'none', color: 'inherit'}}>{item.title}</a>
                                            <div className={styles.uploadMeta}>
                                                {item.type} · {item.subject} · Authored By {item.uploaderName}
                                            </div>
                                        </div>
                                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadLink} style={{color: 'var(--secondary)'}}>
                                            <IconDownload size={18} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tile 3: My Uploads */}
                    <div className={`${styles.bentoTile} ${styles.uploadsTile} glass-panel`}>
                        <h2 className={styles.sectionTitle}><IconFolder size={24} /> My Repository</h2>
                        {loadingUploads ? (
                            <div className={styles.emptyState}><div className={styles.emptyText}>Syncing...</div></div>
                        ) : uploads.length === 0 ? (
                            <div className={styles.emptyStateGamified}>
                                <div className={styles.bountyIcon}>🎯</div>
                                <div className={styles.emptyText} style={{ fontSize: '1.25rem', color: '#fff' }}>Bounty Available: First Contributor</div>
                                <div className={styles.emptySub} style={{ margin: '12px 0 24px', opacity: 0.8 }}>
                                    Your personal repository is currently empty. Upload your first PDF to unlock the <strong style={{ color: 'var(--primary-light)' }}>🎓 Foundation</strong> badge and earn <strong style={{ color: 'var(--accent)' }}>50 Points</strong>!
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

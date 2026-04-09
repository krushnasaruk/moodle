'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { IconUpload, IconDownload, IconStar, IconFolder, IconNotes, IconPyq, IconAssignment, IconLock } from '@/components/Icons';
import { BRANCHES, YEARS, SEMESTERS, COLLEGES, getSubjects } from '@/lib/subjectMap';
import styles from './page.module.css';

// Sample data for demo
const SAMPLE_UPLOADS = [
    { id: '1', title: 'DBMS Complete Notes - Unit 1 to 5', type: 'Notes', subject: 'DBMS', downloads: 234, rating: 4.8, createdAt: '2026-04-05' },
    { id: '2', title: 'OS Process Scheduling PYQ 2025', type: 'PYQ', subject: 'OS', downloads: 189, rating: 4.5, createdAt: '2026-04-03' },
    { id: '3', title: 'DSA Linked List Assignment', type: 'Assignment', subject: 'DSA', downloads: 156, rating: 4.2, createdAt: '2026-04-01' },
];

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

export default function DashboardPage() {
    const { user, updateUserProfile } = useAuth();
    const [uploads] = useState(SAMPLE_UPLOADS);
    const [editing, setEditing] = useState(false);

    // Edit profile state
    const [editCollege, setEditCollege] = useState('');
    const [editBranch, setEditBranch] = useState('');
    const [editYear, setEditYear] = useState('');
    const [editSemester, setEditSemester] = useState('');
    const [saving, setSaving] = useState(false);

    const startEditing = () => {
        setEditCollege(user.college || '');
        setEditBranch(user.branch || '');
        setEditYear(user.year || '');
        setEditSemester(user.semester || '');
        setEditing(true);
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const subjects = getSubjects(editBranch, editSemester);
            await updateUserProfile({
                college: editCollege,
                branch: editBranch,
                year: editYear,
                semester: editSemester,
                subjects: subjects,
                profileComplete: true,
            });
            setEditing(false);
        } catch (e) {
            console.error(e);
        }
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

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                {/* Profile Header */}
                <div className={styles.profileHeader}>
                    <div className={styles.profileAvatar}>
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />
                        ) : (
                            <div className={styles.profileAvatarFallback}>
                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                    </div>
                    <div className={styles.profileInfo}>
                        <h1>{user.name}</h1>
                        <p>{user.email}</p>
                        {user.college && <p className={styles.collegeName}>{user.college}</p>}
                        {user.branch && (
                            <div className={styles.profileTags}>
                                <span className={styles.profileTag}>{user.branch}</span>
                                {user.year && <span className={styles.profileTag}>{user.year}</span>}
                                {user.semester && <span className={styles.profileTag}>{user.semester}</span>}
                            </div>
                        )}
                        <p className={styles.memberSince}>Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'recently'}</p>
                    </div>
                </div>

                {/* Academic Profile / Edit */}
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
                        <h2 className={styles.sectionTitle}>Edit Profile</h2>
                        <div className={styles.editGrid}>
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

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}><IconUpload size={28} /></div>
                        <div className={styles.statNumber}>{user.uploads || uploads.length}</div>
                        <div className={styles.statLabel}>Files Uploaded</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}><IconDownload size={28} /></div>
                        <div className={styles.statNumber}>{totalDownloads}</div>
                        <div className={styles.statLabel}>Total Downloads</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}><IconStar size={28} /></div>
                        <div className={styles.statNumber}>{user.points || 30}</div>
                        <div className={styles.statLabel}>Points</div>
                    </div>
                </div>

                {/* My Uploads */}
                <h2 className={styles.sectionTitle}><IconFolder size={24} /> My Uploads</h2>
                {uploads.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><IconUpload size={48} /></div>
                        <div className={styles.emptyText}>No uploads yet</div>
                        <div className={styles.emptySub}>
                            <Link href="/upload" style={{ color: 'var(--primary)', fontWeight: 600 }}>Upload your first file →</Link>
                        </div>
                    </div>
                ) : (
                    <div className={styles.uploadsList}>
                        {uploads.map((item) => (
                            <div key={item.id} className={styles.uploadItem}>
                                <div className={`${styles.uploadIcon} ${getTypeClass(item.type)}`}>{getUploadIcon(item.type)}</div>
                                <div className={styles.uploadDetails}>
                                    <div className={styles.uploadTitle}>{item.title}</div>
                                    <div className={styles.uploadMeta}>{item.type} · {item.subject} · {item.createdAt}</div>
                                </div>
                                <div className={styles.uploadStats}>
                                    <span><IconDownload size={14} /> {item.downloads || 0}</span>
                                    <span><IconStar size={14} /> {item.rating || '-'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

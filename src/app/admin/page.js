'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import Link from 'next/link';
import { IconShield, IconCheck, IconX, IconEye, IconLock, IconFolder, IconUser, IconCalendar, IconFlag, IconPen } from '@/components/Icons';

// Add your admin email(s) here
const ADMIN_EMAILS = ['sutraverse11@gmail.com'];

const TYPES = ['Notes', 'PYQ', 'Assignment'];
const BRANCHES = ['Computer', 'IT', 'Mechanical', 'Civil', 'Electrical', 'Electronics'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function AdminPage() {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pending');
    const [actionLoading, setActionLoading] = useState('');
    const [usersList, setUsersList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [editingFile, setEditingFile] = useState(null);
    const [editForm, setEditForm] = useState({ type: '', subject: '', branch: '', year: '' });

    const isAdmin = user && (ADMIN_EMAILS.includes(user.email) || user.isAdmin);

    useEffect(() => {
        if (isAdmin) {
            if (tab === 'users') {
                fetchUsers();
            } else {
                fetchFiles();
            }
        } else {
            setLoading(false);
        }
    }, [isAdmin, tab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a,b) => (a.email || '').localeCompare(b.email || ''));
            setUsersList(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsersList([]);
        }
        setLoading(false);
    };

    const fetchFiles = async () => {
        setLoading(true);
        try {
            if (!db) throw new Error('Firestore not initialized');
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
            const fetchPromise = getDocs(collection(db, 'files'));
            const snapshot = await Promise.race([fetchPromise, timeout]);
            
            let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            if (tab === 'reported') {
                data = data.filter(f => f.isReported === true);
            } else {
                data = data.filter(f => f.status === tab && !f.isReported);
            }

            data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            setFiles(data);
        } catch (error) {
            console.error('Error fetching files:', error);
            setFiles([]);
        }
        setLoading(false);
    };

    const handleApprove = async (fileId) => {
        setActionLoading(fileId);
        try {
            await updateDoc(doc(db, 'files', fileId), { status: 'approved' });
            setFiles(prev => prev.filter(f => f.id !== fileId));
        } catch (error) {
            console.error('Error approving file:', error);
            alert('Failed to approve file.');
        }
        setActionLoading('');
    };

    const handleReject = async (file) => {
        if (!confirm(`Reject and delete "${file.title}"? This cannot be undone.`)) return;
        setActionLoading(file.id);
        try {
            await deleteDoc(doc(db, 'files', file.id));
            setFiles(prev => prev.filter(f => f.id !== file.id));
        } catch (error) {
            console.error('Error rejecting file:', error);
            alert('Failed to reject file.');
        }
        setActionLoading('');
    };

    const handleDismissReport = async (fileId) => {
        setActionLoading(fileId);
        try {
            await updateDoc(doc(db, 'files', fileId), { isReported: false, reportCount: 0 });
            setFiles(prev => prev.filter(f => f.id !== fileId));
        } catch (error) {
            console.error('Error dismissing report:', error);
            alert('Failed to clear report.');
        }
        setActionLoading('');
    };

    const toggleRole = async (userId, currentRole) => {
        setActionLoading(userId);
        try {
            const newRole = currentRole === 'teacher' ? 'student' : 'teacher';
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (e) {
            alert('Error toggling role: ' + e.message);
        }
        setActionLoading('');
    };

    const handlePreview = (fileURL) => {
        window.open(fileURL, '_blank');
    };

    const openEditModal = (file) => {
        setEditingFile(file);
        setEditForm({
            type: file.type || 'Notes',
            subject: file.subject || '',
            branch: file.branch || 'Computer',
            year: file.year || '1st Year'
        });
    };

    const savePathCorrection = async () => {
        if (!editingFile) return;
        setActionLoading(editingFile.id);
        try {
            await updateDoc(doc(db, 'files', editingFile.id), {
                type: editForm.type,
                subject: editForm.subject,
                branch: editForm.branch,
                year: editForm.year,
                isReported: false,
                reportCount: 0
            });
            alert('Metadata corrected successfully! Report has been cleared.');
            setFiles(prev => prev.filter(f => f.id !== editingFile.id));
            setEditingFile(null);
        } catch (error) {
            console.error('Error saving path:', error);
            alert('Failed to update file path.');
        }
        setActionLoading('');
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div className={styles.accessDenied}>
                        <div className={styles.accessDeniedIcon}><IconLock size={64} /></div>
                        <h2 className={styles.accessDeniedTitle}>Sign In Required</h2>
                        <p className={styles.accessDeniedText}>You must be logged in to access this page.</p>
                        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Go to Login →</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div className={styles.accessDenied}>
                        <div className={styles.accessDeniedIcon}><IconShield size={64} /></div>
                        <h2 className={styles.accessDeniedTitle}>Access Denied</h2>
                        <p className={styles.accessDeniedText}>You do not have admin privileges. This page is restricted to moderators only.</p>
                        <Link href="/" style={{ color: 'var(--primary)', fontWeight: 700 }}>← Go Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}><IconShield size={40} /> Admin Panel</h1>
                    <p className={styles.pageDesc}>Review uploads, moderate content, and control user access profiles.</p>
                </div>

                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${tab === 'pending' ? styles.tabActive : ''}`} onClick={() => setTab('pending')}>
                        ⏳ Pending
                    </button>
                    <button className={`${styles.tab} ${tab === 'approved' ? styles.tabActive : ''}`} onClick={() => setTab('approved')}>
                        ✅ Approved
                    </button>
                    <button className={`${styles.tab} ${tab === 'reported' ? styles.reportedActive : ''}`} onClick={() => setTab('reported')}>
                        ⚠️ Reported
                    </button>
                    <button className={`${styles.tab} ${tab === 'rejected' ? styles.tabActive : ''}`} onClick={() => setTab('rejected')}>
                        ❌ Rejected
                    </button>
                    <button className={`${styles.tab} ${tab === 'users' ? styles.specialActive : ''}`} onClick={() => setTab('users')} style={{marginLeft: 'auto', background: tab === 'users' ? 'rgba(138, 43, 226, 0.1)' : 'transparent'}}>
                        👥 Access Control
                    </button>
                </div>

                {tab === 'users' ? (
                    <div style={{marginTop: '20px'}}>
                        <div style={{marginBottom: '20px'}}>
                            <input 
                                type="text" 
                                placeholder="Search by name or email..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchBar}
                            />
                        </div>
                        {loading ? (
                            <div className={styles.loadingState}>Fetching active accounts...</div>
                        ) : usersList.length === 0 ? (
                            <div className={styles.emptyState}>No users found.</div>
                        ) : (
                            <div className={styles.fileList}>
                                {usersList
                                    .filter(u => `${u.name||''} ${u.email||''}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(u => (
                                    <div key={u.id} className={styles.fileCard} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div className={styles.fileInfo}>
                                            <div className={styles.fileTitle}>{u.name || 'No Name Set'}</div>
                                            <div className={styles.fileMeta}>
                                                <span className={styles.metaTag}><IconUser size={14} /> {u.email}</span>
                                                <span className={styles.metaTag} style={{color: u.role === 'teacher' ? 'var(--neo)' : 'var(--text-secondary)'}}>Role: {u.role || 'student'}</span>
                                            </div>
                                        </div>
                                        <div className={styles.fileActions}>
                                            <button 
                                                className={`${styles.actionBtn} ${u.role === 'teacher' ? styles.rejectBtn : styles.approveBtn}`}
                                                onClick={() => toggleRole(u.id, u.role)}
                                                disabled={actionLoading === u.id}
                                                style={u.role === 'teacher' ? {background: 'rgba(239, 68, 68, 0.1)'} : {background: 'rgba(34, 197, 94, 0.1)'}}
                                            >
                                                {actionLoading === u.id ? '...' : u.role === 'teacher' ? '⬇️ Demote to Student' : '⬆️ Promote to Teacher'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : loading ? (
                    <div className={styles.loadingState}>Refreshing database...</div>
                ) : files.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><IconFolder size={64} /></div>
                        <div className={styles.emptyText}>No files in this queue</div>
                        <div className={styles.emptySubtext}>
                            {tab === 'pending' ? 'All uploads have been reviewed! 🎉' : 
                             tab === 'reported' ? 'Amazing! No community reports found. 🏆' : 
                             `No files with ${tab} status.`}
                        </div>
                    </div>
                ) : (
                    <div className={styles.fileList}>
                        {files.map((file) => (
                            <div key={file.id} className={`${styles.fileCard} ${file.isReported ? styles.reportedCard : ''}`}>
                                <div className={styles.fileInfo}>
                                    <div className={styles.fileTitle}>
                                        {file.title} 
                                        {file.isReported && <span className={styles.flagBadge}>{file.reportCount || 1} Flags</span>}
                                    </div>
                                    <div className={styles.fileMeta}>
                                        <span className={styles.metaTag}><IconFolder size={14} /> {file.type}</span>
                                        <span className={styles.metaTag}>{file.subject}</span>
                                        <span className={styles.metaTag}>{file.branch}</span>
                                        <span className={styles.metaTag}>{file.year}</span>
                                        <span className={styles.metaTag}><IconUser size={14} /> {file.uploader}</span>
                                        <span className={styles.metaTag}><IconCalendar size={14} /> {formatDate(file.createdAt)}</span>
                                        <span className={styles.metaTag}>{formatFileSize(file.fileSize)}</span>
                                        <span className={styles.metaTag}>{file.fileName}</span>
                                    </div>
                                </div>
                                <div className={styles.fileActions}>
                                    {file.fileURL && (
                                        <button className={`${styles.actionBtn} ${styles.previewBtn}`} onClick={() => handlePreview(file.fileURL)}>
                                            <IconEye size={16} /> View
                                        </button>
                                    )}
                                    {tab === 'pending' && (
                                        <>
                                            <button
                                                className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                onClick={() => handleApprove(file.id)}
                                                disabled={actionLoading === file.id}
                                            >
                                                <IconCheck size={16} /> {actionLoading === file.id ? '...' : 'Approve'}
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                onClick={() => handleReject(file)}
                                                disabled={actionLoading === file.id}
                                            >
                                                <IconX size={16} /> Reject
                                            </button>
                                        </>
                                    )}
                                    {tab === 'reported' && (
                                        <>
                                            <button
                                                className={`${styles.actionBtn} ${styles.editBtn}`}
                                                onClick={() => openEditModal(file)}
                                            >
                                                <IconPen size={16} /> Edit Path
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                onClick={() => handleDismissReport(file.id)}
                                                disabled={actionLoading === file.id}
                                            >
                                                <IconCheck size={16} /> Ignore
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                onClick={() => handleReject(file)}
                                                disabled={actionLoading === file.id}
                                            >
                                                <IconX size={16} /> Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                     </div>
                )}
            </div>

            {/* EDIT PATH MODAL */}
            {editingFile && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2 className={styles.modalTitle}>Fix Misplaced File</h2>
                        <p className={styles.modalDesc}>Move <strong>{editingFile.title}</strong> to the correct directory.</p>
                        
                        <div className={styles.formGroup}>
                            <label>File Type</label>
                            <select className={styles.modalSelect} value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Subject</label>
                            <input type="text" className={styles.modalInput} value={editForm.subject} onChange={e => setEditForm({...editForm, subject: e.target.value})} placeholder="e.g. Physics" />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Branch</label>
                            <select className={styles.modalSelect} value={editForm.branch} onChange={e => setEditForm({...editForm, branch: e.target.value})}>
                                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Year</label>
                            <select className={styles.modalSelect} value={editForm.year} onChange={e => setEditForm({...editForm, year: e.target.value})}>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => setEditingFile(null)}>Cancel</button>
                            <button className={styles.modalSave} disabled={actionLoading === editingFile.id} onClick={savePathCorrection}>
                                {actionLoading === editingFile.id ? 'Saving...' : 'Save & Resolve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

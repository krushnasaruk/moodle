'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import Link from 'next/link';
import { IconShield, IconCheck, IconX, IconEye, IconLock, IconFolder, IconUser, IconCalendar } from '@/components/Icons';

// Add your admin email(s) here
const ADMIN_EMAILS = ['sutraverse11@gmail.com'];

export default function AdminPage() {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pending');
    const [actionLoading, setActionLoading] = useState('');

    const isAdmin = user && (ADMIN_EMAILS.includes(user.email) || user.isAdmin);

    useEffect(() => {
        if (isAdmin) {
            fetchFiles();
        } else {
            setLoading(false);
        }
    }, [isAdmin, tab]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            if (!db) throw new Error('Firestore not initialized');
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
            const fetchPromise = getDocs(collection(db, 'files'));
            const snapshot = await Promise.race([fetchPromise, timeout]);
            const data = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(f => f.status === tab);
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

    const handlePreview = (fileURL) => {
        window.open(fileURL, '_blank');
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
                    <p className={styles.pageDesc}>Review and moderate uploaded content before it goes live.</p>
                </div>

                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${tab === 'pending' ? styles.tabActive : ''}`} onClick={() => setTab('pending')}>
                        ⏳ Pending
                    </button>
                    <button className={`${styles.tab} ${tab === 'approved' ? styles.tabActive : ''}`} onClick={() => setTab('approved')}>
                        ✅ Approved
                    </button>
                    <button className={`${styles.tab} ${tab === 'rejected' ? styles.tabActive : ''}`} onClick={() => setTab('rejected')}>
                        ❌ Rejected
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>Loading files...</div>
                ) : files.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><IconFolder size={64} /></div>
                        <div className={styles.emptyText}>No {tab} files</div>
                        <div className={styles.emptySubtext}>
                            {tab === 'pending' ? 'All uploads have been reviewed! 🎉' : `No files with ${tab} status.`}
                        </div>
                    </div>
                ) : (
                    <div className={styles.fileList}>
                        {files.map((file) => (
                            <div key={file.id} className={styles.fileCard}>
                                <div className={styles.fileInfo}>
                                    <div className={styles.fileTitle}>{file.title}</div>
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
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

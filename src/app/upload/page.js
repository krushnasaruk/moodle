'use client';

import { useState, useRef } from 'react';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { IconLock, IconSparkles, IconUpload, IconFolder, IconNotes } from '@/components/Icons';
import ConfettiExplosion from '@/components/ConfettiExplosion';
import Link from 'next/link';
import { getAllSubjects } from '@/lib/subjectMap';

const BRANCHES = ['Computer', 'IT', 'Mechanical', 'Civil', 'Electrical', 'Electronics'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const TYPES = ['Notes', 'PYQ', 'Assignment'];
const SUBJECTS = getAllSubjects();

export default function UploadPage() {
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [type, setType] = useState('');
    const [branch, setBranch] = useState(user?.branch || '');
    const [year, setYear] = useState(user?.year || '');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStage, setUploadStage] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError('');
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !title || !subject || !type || !branch || !year) return;

        if (file.size > 50 * 1024 * 1024) {
            setError('File size must be under 50MB.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadStage('Initiating upload...');
        setError('');

        // Provide a smooth fake progress up to 90% while the background tasks complete
        let simulatedProgress = 0;
        const progressInterval = setInterval(() => {
            simulatedProgress += Math.floor(Math.random() * 5) + 2;
            if (simulatedProgress > 90) simulatedProgress = 90;
            setUploadProgress(simulatedProgress);
            setUploadStage(`Uploading file... ${simulatedProgress}%`);
        }, 300);

        try {
            if (!storage || !db) throw new Error("Firebase is not initialized. Please check network connection.");

            // 1. Upload to Firebase Storage
            const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const uniqueName = Date.now() + '_' + safeName;
            const fileRef = ref(storage, `uploads/${uniqueName}`);
            
            await uploadBytesResumable(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);

            clearInterval(progressInterval);

            setUploadProgress(95);
            setUploadStage('Saving metadata...');

            // 3. Save to Firestore (Adding a timeout so it doesn't hang forever if offline)
            const saveDocPromise = addDoc(collection(db, 'files'), {
                title,
                subject,
                type,
                branch,
                year,
                description,
                fileURL: downloadURL,
                fileName: safeName,
                fileSize: file.size,
                uploader: user?.name || 'Anonymous',
                uploaderUID: user?.uid || 'anonymous',
                uploaderEmail: user?.email || '',
                rating: 0,
                ratingCount: 0,
                downloads: 0,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });

            await saveDocPromise;

            setUploadProgress(99);
            setUploadStage('Updating your profile...');

            // 4. Update Profile
            try {
                // Enhanced Point System: Rewards 50 Points for a contribution
                if (user && user.uid) {
                    await updateDoc(doc(db, 'users', user.uid), {
                        uploads: increment(1),
                        points: increment(50),
                    });
                }
            } catch(e) {
                console.warn('Non-critical: Failed to update user profile stats', e);
            }

            setUploadProgress(100);
            setSuccess(true);
            setUploading(false);
            setUploadStage('');
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Final Upload error:', error);
            setError(error.message || 'Something went wrong. Please try again.');
            setUploading(false);
            setUploadStage('');
        }
    };



    if (success) {
        return (
            <div className={styles.pageWrapper}>
                <ConfettiExplosion active={true} />
                <div className={styles.pageInner}>
                    <div className={styles.successMsg}>
                        <div className={styles.successIcon}><IconSparkles size={64} style={{ stroke: "var(--primary)" }} /></div>
                        <h2 className={styles.successTitle}>Upload Successful!</h2>
                        <p className={styles.successText}>
                            Your file has been submitted for review. You earned <strong>50 points!</strong>
                            <br /><br />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                ⏳ An admin will review your upload shortly. You can check the status on your <Link href="/dashboard" style={{ color: 'var(--primary)' }}>Dashboard</Link>.
                            </span>
                        </p>
                        <button
                            className={styles.submitBtn}
                            onClick={() => {
                                setSuccess(false);
                                setFile(null);
                                setTitle('');
                                setSubject('');
                                setType('');
                                setBranch('');
                                setYear('');
                                setDescription('');
                                setUploadProgress(0);
                            }}
                            style={{ maxWidth: '300px' }}
                        >
                            Upload Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}><IconUpload size={40} /> Upload Material</h1>
                    <p className={styles.pageDesc}>Share notes, PYQs, or assignments and earn points!</p>
                </div>

                <div className={styles.formCard}>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        {/* Error */}
                        {error && (
                            <div className={styles.errorMsg}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* File Drop Zone */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>File *</label>
                            <div
                                className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className={styles.dropzoneIcon}><IconFolder size={48} /></div>
                                <div className={styles.dropzoneText}>Drop your file here or click to browse</div>
                                <div className={styles.dropzoneSub}>PDF, DOC, PPT, ZIP, Code files up to 50MB</div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.c,.cpp,.java,.py,.js"
                            />
                            {file && (
                                <div className={styles.filePreview}>
                                    <IconNotes size={20} />
                                    <span className={styles.fileName}>{file.name}</span>
                                    <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                                    <button type="button" className={styles.removeFile} onClick={() => setFile(null)}>✕</button>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Title *</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="e.g. DBMS Complete Notes Unit 1-5"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Type and Subject */}
                        <div className={`${styles.formGroup} ${styles.row}`}>
                            <div>
                                <label className={styles.label}>Type *</label>
                                <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)} required>
                                    <option value="">Select type</option>
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={styles.label}>Subject *</label>
                                <select className={styles.select} value={subject} onChange={(e) => setSubject(e.target.value)} required>
                                    <option value="">Select subject</option>
                                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Branch and Year */}
                        <div className={`${styles.formGroup} ${styles.row}`}>
                            <div>
                                <label className={styles.label}>Branch *</label>
                                <select className={styles.select} value={branch} onChange={(e) => setBranch(e.target.value)} required>
                                    <option value="">Select branch</option>
                                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={styles.label}>Year *</label>
                                <select className={styles.select} value={year} onChange={(e) => setYear(e.target.value)} required>
                                    <option value="">Select year</option>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Brief description of the file content..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Progress Bar */}
                        {uploading && (
                            <div className={styles.progressArea}>
                                <div className={styles.progressBarBg}>
                                    <div className={styles.progressBarFill} style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                                <div className={styles.progressText}>{uploadStage}</div>
                            </div>
                        )}

                        <button type="submit" className={styles.submitBtn} disabled={uploading || !file || !title || !subject || !type || !branch || !year}>
                            {uploading ? `⏳ ${uploadStage}` : <><IconUpload size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Upload File</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

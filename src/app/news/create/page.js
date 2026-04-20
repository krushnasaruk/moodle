/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function CreateNewsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('General');
    const [submitting, setSubmitting] = useState(false);

    if (loading) return null;

    // Optional: Only allow logged-in users to post.
    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
                    <h1 style={{ color: 'var(--error)' }}>Sign In Required</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
                        Please sign in to publish news.
                    </p>
                    <Link href="/news" className={styles.backBtn} style={{ marginTop: '24px' }}>
                        ← Return to News
                    </Link>
                </div>
            </div>
        );
    }

    const isAdminOrTeacher = user.role === 'admin' || user.role === 'teacher';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'news'), {
                authorId: user.uid,
                authorName: user.name || (isAdminOrTeacher ? 'Admin' : 'Student'),
                title: title.trim(),
                content: content.trim(),
                type: type, // 'Urgent', 'Event', 'General'
                status: isAdminOrTeacher ? 'approved' : 'pending',
                timestamp: serverTimestamp()
            });
            
            if (!isAdminOrTeacher) {
                alert("Your news has been submitted and is pending verification from an admin.");
            }
            router.push('/news');
        } catch (error) {
            console.error("Error creating news post:", error);
            alert("Failed to publish the news article.");
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <Link href="/news" className={styles.backBtn}>
                    ← Cancel and return
                </Link>

                <div className={styles.formCard}>
                    <h1 className={styles.formHeader}>Publish News</h1>
                    <p className={styles.formSubtitle}>
                        Your announcement will be immediately visible to all students on the campus bulletin.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="type">Announcement Category</label>
                            <select 
                                id="type" 
                                className={styles.select} 
                                value={type} 
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="General">General Info</option>
                                <option value="Event">Upcoming Event</option>
                                <option value="Urgent">Urgent / Important</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="title">Headline</label>
                            <input 
                                id="title"
                                type="text" 
                                className={styles.input} 
                                placeholder="e.g., Spring Career Fair Dates Announced"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="content">Article Body</label>
                            <textarea 
                                id="content"
                                className={styles.textarea} 
                                placeholder="Details regarding the announcement..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={submitting || !title.trim() || !content.trim()}>
                            {submitting ? 'Publishing...' : 'Publish to Campus Feed'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

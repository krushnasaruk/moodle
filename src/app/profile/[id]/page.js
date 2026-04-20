'use client';

import { useState, useEffect, use } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function ProfilePage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // 1. Fetch User Profile
                const userRef = doc(db, 'users', params.id);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    setProfileUser({ id: userSnap.id, ...userSnap.data() });
                } else {
                    setError("User not found.");
                    setLoading(false);
                    return;
                }

                // 2. Fetch User's Posts
                const postsQ = query(
                    collection(db, 'posts'),
                    where('authorId', '==', params.id),
                    orderBy('timestamp', 'desc')
                );
                
                const postsSnap = await getDocs(postsQ);
                const postsData = postsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setUserPosts(postsData);
            } catch (err) {
                console.error("Error fetching profile:", err);
                // Due to missing indexes on composite queries, it might fail initially. Handle gracefully.
                // If it fails on orderBy, just fetch without orderBy and sort locally for now.
                try {
                    const fallbackQ = query(collection(db, 'posts'), where('authorId', '==', params.id));
                    const fallbackSnap = await getDocs(fallbackQ);
                    const fallbackData = fallbackSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    const getMillis = (ts) => ts?.toMillis ? ts.toMillis() : (new Date(ts).getTime() || 0);
                    fallbackData.sort((a,b) => getMillis(b.timestamp) - getMillis(a.timestamp));
                    setUserPosts(fallbackData);
                } catch(e) {
                     setError("Unable to load profile data.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (params?.id) {
            fetchProfileData();
        }
    }, [params.id]);

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        if (typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        }
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getRoleClass = (role) => {
        if (role === 'teacher') return styles.roleTeacher;
        if (role === 'admin') return styles.roleAdmin;
        return '';
    };

    if (loading) return null;

    if (error) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.container} style={{ textAlign: 'center', padding: '100px 0' }}>
                    <h1 style={{ color: 'var(--text-primary)' }}>{error}</h1>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <div className={styles.profileCard}>
                    {profileUser.photoURL ? (
                        <img src={profileUser.photoURL} alt={profileUser.name} className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarFallback}>
                            {profileUser.name ? profileUser.name.charAt(0).toUpperCase() : '?'}
                        </div>
                    )}
                    
                    <div className={styles.userInfo}>
                        <h1 className={styles.userName}>{profileUser.name || 'Anonymous Student'}</h1>
                        <span className={`${styles.userRole} ${getRoleClass(profileUser.role)}`}>
                            {profileUser.role || 'Student'}
                        </span>
                        
                        <p className={styles.userBio}>
                            {profileUser.bio || "This user hasn't added a bio yet. They are quietly exploring the sutraverse!"}
                        </p>
                        
                        <div className={styles.metaInfo}>
                            <span>📍 {profileUser.classId || 'No class set'}</span>
                            <span>🌟 {profileUser.points || 0} Points</span>
                            <span>📅 Joined {profileUser.createdAt ? formatDate(profileUser.createdAt) : 'Recently'}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.statsSection}>
                    <h2 className={styles.sectionTitle}>Recent Posts</h2>
                    <div className={styles.feed}>
                        {userPosts.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)' }}>This user hasn't posted anything yet.</div>
                        ) : (
                            userPosts.map(post => (
                                <div key={post.id} className={styles.postCard}>
                                    <span className={styles.postTime}>{formatDate(post.timestamp)}</span>
                                    <div className={styles.postContent}>{post.content}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

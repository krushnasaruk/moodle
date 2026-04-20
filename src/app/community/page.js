'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';

export default function CommunityPage() {
    const { user, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setPosts(postsData);
        }, (error) => {
            console.error("Error fetching posts:", error);
        });

        return () => unsubscribe();
    }, []);

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.trim() || !user) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'posts'), {
                authorId: user.uid,
                authorName: user.name || user.email.split('@')[0],
                authorAvatar: user.photoURL || null,
                content: newPost.trim(),
                timestamp: serverTimestamp(),
                likes: [],
                commentsCount: 0
            });
            setNewPost('');
        } catch (error) {
            console.error("Error adding post:", error);
            alert("Failed to submit post. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (postId, currentLikes) => {
        if (!user) return alert("Please log in to like posts.");
        
        const postRef = doc(db, 'posts', postId);
        const hasLiked = currentLikes.includes(user.uid);
        
        try {
            if (hasLiked) {
                await updateDoc(postRef, {
                    likes: arrayRemove(user.uid)
                });
            } else {
                await updateDoc(postRef, {
                    likes: arrayUnion(user.uid)
                });
            }
        } catch (error) {
            console.error("Error updating like:", error);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate();
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const stats = useMemo(() => ({
        total: posts.length,
        likes: posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0),
        discussions: posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0),
    }), [posts]);

    if (authLoading) return null;

    return (
        <div className={styles.pageWrapper}>
            {/* Ambient background orbs */}
            <div className={styles.bgOrb1}></div>
            <div className={styles.bgOrb2}></div>
            <div className={styles.bgOrb3}></div>

            <div className={styles.container}>

                {/* ── HERO HEADER ── */}
                <ScrollReveal>
                    <div className={styles.header}>
                        <div className={styles.heroBadge}>
                            <span className={styles.heroBadgeDot}></span>
                            Live Community Feed
                        </div>
                        <h1 className={styles.title}>
                            Your Campus <span className={styles.titleAccent}>Community.</span>
                        </h1>
                        <p className={styles.subtitle}>
                            Ask questions, share updates, drop resources, and connect with peers across every department.
                        </p>

                        {/* Stats strip */}
                        <div className={styles.statsStrip}>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.total}</span>
                                <span className={styles.statLbl}>Posts</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.likes}</span>
                                <span className={styles.statLbl}>Reactions</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.discussions}</span>
                                <span className={styles.statLbl}>Replies</span>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                <div className={styles.layoutGrid}>
                    <div className={styles.mainFeed}>

                        {/* ── COMPOSE BOX ── */}
                        {user ? (
                            <ScrollReveal delay={50}>
                                <div className={styles.createPostCard}>
                                    <div className={styles.createHeader}>
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.name} className={styles.avatar} />
                                        ) : (
                                            <div className={styles.avatarFallback}>
                                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        )}
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                                            {user.name || 'Student'}
                                        </div>
                                    </div>
                                    <form onSubmit={handlePostSubmit}>
                                        <textarea
                                            className={styles.postInput}
                                            placeholder="What's on your mind? Share a resource, ask a question, or start a discussion..."
                                            value={newPost}
                                            onChange={(e) => setNewPost(e.target.value)}
                                            maxLength={1000}
                                        />
                                        <div className={styles.postActions}>
                                            <button 
                                                type="submit" 
                                                className={styles.postBtn}
                                                disabled={!newPost.trim() || submitting}
                                            >
                                                {submitting ? 'Posting...' : '✨ Post to Community'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </ScrollReveal>
                        ) : (
                            <ScrollReveal delay={50}>
                                <div className={styles.authGuard}>
                                    <p>🎓 Join the conversation! Log in to post and interact with the community.</p>
                                    <Link href="/login" className={styles.loginBtn}>Sign In →</Link>
                                </div>
                            </ScrollReveal>
                        )}

                        {/* ── FEED ── */}
                        <div className={styles.feed}>
                            {posts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💬</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>No posts yet</div>
                                    Be the first to share something!
                                </div>
                            ) : (
                                posts.map((post, i) => {
                                    const hasLiked = post.likes?.includes(user?.uid);
                                    const likeCount = post.likes?.length || 0;
                                    
                                    return (
                                        <div key={post.id} className={styles.postCard} style={{ animationDelay: `${(i % 8) * 60}ms` }}>
                                            <div className={styles.postHeader}>
                                                <Link href={`/profile/${post.authorId}`} className={styles.authorInfo}>
                                                    {post.authorAvatar ? (
                                                        <img src={post.authorAvatar} alt={post.authorName} className={styles.avatar} style={{ width: '42px', height: '42px' }} />
                                                    ) : (
                                                        <div className={styles.avatarFallback} style={{ width: '42px', height: '42px', fontSize: '1rem' }}>
                                                            {post.authorName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className={styles.authorName}>{post.authorName}</div>
                                                        <span className={styles.postTime}>{formatDate(post.timestamp)}</span>
                                                    </div>
                                                </Link>
                                            </div>
                                            
                                            <div className={styles.postContent}>
                                                {post.content}
                                            </div>
                                            
                                            <div className={styles.interactionBar}>
                                                <button 
                                                    className={`${styles.actionBtn} ${hasLiked ? styles.actionBtnLiked : ''}`}
                                                    onClick={() => handleLike(post.id, post.likes || [])}
                                                >
                                                    {hasLiked ? '❤️' : '🤍'} {likeCount}
                                                </button>
                                                <Link href={`/community/${post.id}`} className={styles.actionBtn} style={{ textDecoration: 'none' }}>
                                                    💬 {post.commentsCount || 0}
                                                </Link>
                                                <button className={styles.actionBtn} onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/community/${post.id}`);
                                                    alert("Link copied!");
                                                }}>
                                                    🔗 Share
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ── SIDEBAR ── */}
                    <ScrollReveal delay={150}>
                        <div className={styles.sidebar}>
                            <div className={styles.sidebarWidget}>
                                <h3 className={styles.widgetTitle}>🔥 Trending Topics</h3>
                                <div className={styles.subjectTags}>
                                    <span className={styles.tag}>#DataStructures</span>
                                    <span className={styles.tag}>#Hackathon</span>
                                    <span className={styles.tag}>#FinalsPrep</span>
                                    <span className={styles.tag}>#AI</span>
                                    <span className={styles.tag}>#Internships</span>
                                    <span className={styles.tag}>#OpenSource</span>
                                </div>
                            </div>
                            
                            <div className={styles.sidebarWidget}>
                                <h3 className={styles.widgetTitle}>🏆 Active Groups</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '14px', lineHeight: 1.6 }}>
                                    Join the conversation in campus clubs and build your network!
                                </p>
                                <Link href="/clubs" className={styles.clubLink}>
                                    Browse all clubs →
                                </Link>
                            </div>

                            <div className={styles.sidebarWidget}>
                                <h3 className={styles.widgetTitle}>📰 Latest News</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '14px', lineHeight: 1.6 }}>
                                    Stay updated with official campus announcements and bulletins.
                                </p>
                                <Link href="/news" className={styles.clubLink}>
                                    View bulletin →
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>
                    
                </div>
            </div>
        </div>
    );
}

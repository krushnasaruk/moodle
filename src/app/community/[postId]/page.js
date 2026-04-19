'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function PostPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!params.postId) return;

        // Fetch single post
        const fetchPost = async () => {
            try {
                const postSnap = await getDoc(doc(db, 'posts', params.postId));
                if (postSnap.exists()) {
                    setPost({ id: postSnap.id, ...postSnap.data() });
                } else if (params.postId.startsWith('mock')) {
                    // Fallback to mock data for demo clicking
                    setPost({ id: params.postId, authorName: 'Dr. Smith', authorId: 'teacher', content: 'This is a mock post loaded dynamically via the URL parameter.', timestamp: { toDate: () => new Date() }, likes: [], commentsCount: 0 });
                }
            } catch (err) {
                console.error("Error fetching post:", err);
            }
            setLoading(false);
        };
        fetchPost();

        // Listen to comments
        const q = query(
            collection(db, 'comments'),
            where('postId', '==', params.postId),
            orderBy('timestamp', 'asc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Add a mock comment if viewing a mock post and DB is empty
            if (data.length === 0 && params.postId.startsWith('mock')) {
                setComments([
                    { id: 'c1', authorName: 'Student Developer', content: 'This looks amazing! Thanks for sharing this mock resource with us.', timestamp: { toDate: () => new Date() } }
                ]);
            } else {
                setComments(data);
            }
        });

        return () => unsubscribe();
    }, [params.postId]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user || !post) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'comments'), {
                postId: post.id,
                authorId: user.uid,
                authorName: user.name || user.email.split('@')[0],
                content: newComment.trim(),
                timestamp: serverTimestamp()
            });

            // Increment post commentsCount if it's a real document
            if (!post.id.startsWith('mock')) {
                await updateDoc(doc(db, 'posts', post.id), {
                    commentsCount: increment(1)
                });
            }

            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            alert("Failed to submit reply.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async () => {
        if (!user || !post || post.id.startsWith('mock')) return;
        
        const postRef = doc(db, 'posts', post.id);
        const hasLiked = post.likes?.includes(user.uid);
        
        try {
            if (hasLiked) {
                await updateDoc(postRef, { likes: arrayRemove(user.uid) });
                setPost(p => ({ ...p, likes: p.likes.filter(id => id !== user.uid) }));
            } else {
                await updateDoc(postRef, { likes: arrayUnion(user.uid) });
                setPost(p => ({ ...p, likes: [...(p.likes || []), user.uid] }));
            }
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        return timestamp.toDate().toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
        });
    };

    if (loading) return null;

    if (!post) {
        return <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>Post not found.</div>;
    }

    const hasLiked = post.likes?.includes(user?.uid);

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <Link href="/community" className={styles.backBtn}>
                    ← Back to Community
                </Link>

                <div className={styles.postCard}>
                    <div className={styles.postHeader}>
                        {post.authorAvatar ? (
                            <img src={post.authorAvatar} alt={post.authorName} className={styles.avatar} />
                        ) : (
                            <div className={styles.avatarFallback}>
                                {post.authorName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <Link href={`/profile/${post.authorId}`} className={styles.authorName}>
                                {post.authorName}
                            </Link>
                            <div className={styles.postTime}>{formatDate(post.timestamp)}</div>
                        </div>
                    </div>

                    <div className={styles.postContent}>{post.content}</div>

                    <div className={styles.interactionBar}>
                        <button 
                            className={`${styles.actionBtn} ${hasLiked ? styles.actionBtnLiked : ''}`}
                            onClick={handleLike}
                        >
                            {hasLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
                        </button>
                        <span className={styles.actionBtn} style={{ cursor: 'default', pointerEvents: 'none' }}>
                            💬 {comments.length || post.commentsCount}
                        </span>
                    </div>
                </div>

                <div className={styles.commentsSection}>
                    <h3 className={styles.commentsHeader}>Discussion</h3>

                    {user ? (
                        <form className={styles.commentInputWrapper} onSubmit={handleCommentSubmit}>
                            <textarea
                                className={styles.commentInput}
                                placeholder="Add to the conversation..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button type="submit" className={styles.replyBtn} disabled={!newComment.trim() || submitting}>
                                {submitting ? 'Replying...' : 'Reply'}
                            </button>
                        </form>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-2xl)' }}>
                            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log in</Link> to join the discussion.
                        </div>
                    )}

                    <div className={styles.commentList}>
                        {comments.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)' }}>No replies yet. Be the first to start the discussion!</div>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className={styles.comment}>
                                    <div className={styles.commentHeader}>
                                        <Link href={`/profile/${comment.authorId}`} className={styles.commentAuthor} style={{ textDecoration: 'none' }}>
                                            {comment.authorName}
                                        </Link>
                                        <span className={styles.commentTime}>{formatDate(comment.timestamp)}</span>
                                    </div>
                                    <div className={styles.commentBody}>{comment.content}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const CATEGORIES = [
    { value: 'Tech', emoji: '💻' },
    { value: 'Engineering', emoji: '⚙️' },
    { value: 'Arts & Media', emoji: '🎨' },
    { value: 'Sports', emoji: '⚽' },
    { value: 'Social', emoji: '🤝' },
    { value: 'Academic', emoji: '📚' },
    { value: 'Business', emoji: '💼' },
    { value: 'Other', emoji: '✨' },
];

const EMOJI_OPTIONS = ['💻','🤖','📸','🎤','🚀','⚽','🎸','🔐','🎭','📊','📖','🌱','🎨','⚙️','🎯','🏆','🌍','🧪','🎵','📡'];

export default function CreateClubPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Basic info
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Tech');
    const [emoji, setEmoji] = useState('🚀');
    const [description, setDescription] = useState('');

    // Additional details
    const [meetSchedule, setMeetSchedule] = useState('');
    const [discord, setDiscord] = useState('');
    const [joiningLink, setJoiningLink] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [upcomingEvent, setUpcomingEvent] = useState('');
    const [supervisorEmail, setSupervisorEmail] = useState('');
    const [supervisorName, setSupervisorName] = useState('');

    // Tags
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1); // 2-step form

    if (loading) return null;

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
                    <h1 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Sign In Required</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>You need to be signed in to start a club.</p>
                    <Link href="/login" className={styles.submitBtn} style={{ display: 'inline-flex', textDecoration: 'none', width: 'auto', padding: '12px 32px' }}>Sign In →</Link>
                </div>
            </div>
        );
    }

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t) && tags.length < 8) {
            setTags([...tags, t]);
            setTagInput('');
        }
    };

    const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !description.trim()) return;

        setSubmitting(true);
        try {
            const clubData = {
                name: name.trim(),
                category,
                emoji,
                description: description.trim(),
                adminId: user.uid,
                adminName: user.name || user.email?.split('@')[0] || 'Admin',
                adminEmail: user.email || '',
                members: [user.uid],
                membersCount: 1,
                tags,
                meetSchedule: meetSchedule.trim(),
                discord: discord.trim(),
                joiningLink: joiningLink.trim(),
                whatsapp: whatsapp.trim(),
                upcomingEvent: upcomingEvent.trim(),
                supervisorEmail: supervisorEmail.trim(),
                supervisorName: supervisorName.trim(),
                lastActive: 'Just now',
                featured: false,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'clubs'), clubData);

            // Write a notification for the supervisor in Firestore
            if (supervisorEmail.trim()) {
                await addDoc(collection(db, 'notifications'), {
                    type: 'club_created',
                    recipientEmail: supervisorEmail.trim(),
                    recipientName: supervisorName.trim(),
                    clubId: docRef.id,
                    clubName: name.trim(),
                    adminName: user.name || user.email?.split('@')[0],
                    adminEmail: user.email,
                    message: `A new club "${name.trim()}" has been created by ${user.name || user.email?.split('@')[0]} and awaits your supervision.`,
                    read: false,
                    createdAt: serverTimestamp(),
                });
            }

            router.push(`/clubs/${docRef.id}`);
        } catch (error) {
            console.error('Error creating club:', error);
            alert('Failed to create the club. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <Link href="/clubs" className={styles.backBtn}>← Back to Clubs</Link>

                {/* Progress bar */}
                <div className={styles.progressBar}>
                    <div className={styles.progressStep}>
                        <div className={`${styles.stepCircle} ${step >= 1 ? styles.stepActive : ''}`}>1</div>
                        <span className={styles.stepLabel}>Basic Info</span>
                    </div>
                    <div className={`${styles.progressLine} ${step >= 2 ? styles.progressLineFilled : ''}`}></div>
                    <div className={styles.progressStep}>
                        <div className={`${styles.stepCircle} ${step >= 2 ? styles.stepActive : ''}`}>2</div>
                        <span className={styles.stepLabel}>Details & Links</span>
                    </div>
                </div>

                <div className={styles.formCard}>
                    {/* Header */}
                    <div className={styles.formHeaderRow}>
                        <div className={styles.emojiPreview}>{emoji}</div>
                        <div>
                            <h1 className={styles.formHeader}>
                                {step === 1 ? 'Create Your Club' : 'Add Details & Links'}
                            </h1>
                            <p className={styles.formSubtitle}>
                                {step === 1
                                    ? 'Set up the basics — you can always edit later.'
                                    : 'Help members find and connect with your club.'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (name.trim() && description.trim()) setStep(2); } : handleSubmit}>

                        {/* ── STEP 1 ── */}
                        {step === 1 && (
                            <>
                                {/* Emoji picker */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Club Icon</label>
                                    <div className={styles.emojiGrid}>
                                        {EMOJI_OPTIONS.map(e => (
                                            <button key={e} type="button"
                                                className={`${styles.emojiOption} ${emoji === e ? styles.emojiSelected : ''}`}
                                                onClick={() => setEmoji(e)}
                                            >{e}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label} htmlFor="clubName">
                                            Club Name <span className={styles.required}>*</span>
                                            <span className={styles.hint}>Max 60 characters</span>
                                        </label>
                                        <input
                                            id="clubName" type="text"
                                            className={styles.input}
                                            placeholder="e.g., AI Research Lab"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            maxLength={60} required
                                        />
                                        <div className={styles.charCount}>{name.length}/60</div>
                                    </div>

                                    <div className={styles.formGroup} style={{ minWidth: '180px' }}>
                                        <label className={styles.label} htmlFor="category">Category <span className={styles.required}>*</span></label>
                                        <select id="category" className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                                            {CATEGORIES.map(c => (
                                                <option key={c.value} value={c.value}>{c.emoji} {c.value}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label} htmlFor="desc">
                                        Description <span className={styles.required}>*</span>
                                        <span className={styles.hint}>Tell prospective members what the club is about. Be specific!</span>
                                    </label>
                                    <textarea
                                        id="desc" className={styles.textarea}
                                        placeholder="We're a group of students passionate about... We meet every... Activities include..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        maxLength={1000} required
                                    />
                                    <div className={styles.charCount}>{description.length}/1000</div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Tags
                                        <span className={styles.hint}>Add keywords to help students discover your club (press Enter or comma)</span>
                                    </label>
                                    <div className={styles.tagInputRow}>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="e.g., Hackathons, Python, Design..."
                                            value={tagInput}
                                            onChange={e => setTagInput(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            disabled={tags.length >= 8}
                                        />
                                        <button type="button" className={styles.addTagBtn} onClick={addTag} disabled={!tagInput.trim() || tags.length >= 8}>
                                            Add
                                        </button>
                                    </div>
                                    {tags.length > 0 && (
                                        <div className={styles.tagsList}>
                                            {tags.map(tag => (
                                                <span key={tag} className={styles.tagChip}>
                                                    {tag}
                                                    <button type="button" className={styles.tagRemove} onClick={() => removeTag(tag)}>×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={!name.trim() || !description.trim()}
                                >
                                    Continue to Details →
                                </button>
                            </>
                        )}

                        {/* ── STEP 2 ── */}
                        {step === 2 && (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>📍 Meeting Schedule</label>
                                    <input
                                        type="text" className={styles.input}
                                        placeholder="e.g., Every Friday, 5:00 PM — Room 204, CS Block"
                                        value={meetSchedule}
                                        onChange={e => setMeetSchedule(e.target.value)}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>📅 Upcoming Event</label>
                                    <input
                                        type="text" className={styles.input}
                                        placeholder="e.g., CodeStorm 2026 — May 3rd"
                                        value={upcomingEvent}
                                        onChange={e => setUpcomingEvent(e.target.value)}
                                    />
                                </div>

                                <div className={styles.sectionDivider}>
                                    <span>🔗 Joining & Communication Links</span>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        🌐 Joining / Registration Link
                                        <span className={styles.hint}>Google Form, website, or any registration link for new members</span>
                                    </label>
                                    <input
                                        type="url" className={styles.input}
                                        placeholder="https://forms.google.com/..."
                                        value={joiningLink}
                                        onChange={e => setJoiningLink(e.target.value)}
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>
                                            💬 Discord Server
                                            <span className={styles.hint}>discord.gg/...</span>
                                        </label>
                                        <input
                                            type="text" className={styles.input}
                                            placeholder="discord.gg/your-server"
                                            value={discord}
                                            onChange={e => setDiscord(e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>
                                            📱 WhatsApp Group
                                            <span className={styles.hint}>chat.whatsapp.com/...</span>
                                        </label>
                                        <input
                                            type="text" className={styles.input}
                                            placeholder="chat.whatsapp.com/..."
                                            value={whatsapp}
                                            onChange={e => setWhatsapp(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className={styles.sectionDivider}>
                                    <span>👨‍🏫 Faculty Supervisor (Optional)</span>
                                </div>
                                <p className={styles.sectionNote}>
                                    The supervisor will be notified when members join and when the club is created.
                                </p>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>Supervisor Name</label>
                                        <input
                                            type="text" className={styles.input}
                                            placeholder="e.g., Prof. Kumar"
                                            value={supervisorName}
                                            onChange={e => setSupervisorName(e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>Supervisor Email</label>
                                        <input
                                            type="email" className={styles.input}
                                            placeholder="professor@college.edu"
                                            value={supervisorEmail}
                                            onChange={e => setSupervisorEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className={styles.stepActions}>
                                    <button type="button" className={styles.backStepBtn} onClick={() => setStep(1)}>
                                        ← Back
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.submitBtn}
                                        style={{ flex: 1 }}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <span className={styles.loadingRow}><span className={styles.spinner}></span> Creating...</span>
                                        ) : '🚀 Launch Club'}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

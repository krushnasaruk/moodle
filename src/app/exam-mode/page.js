'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';
import { IconSparkles, IconLightbulb, IconClipboard, IconStar, IconLock } from '@/components/Icons';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const BRANCHES = ['Computer', 'IT', 'Mechanical', 'Civil', 'Electrical', 'Electronics', 'Other'];

export default function ExamModePage() {
    const { user, loading } = useAuth();
    const [year, setYear] = useState('');
    const [branch, setBranch] = useState('');
    const [subject, setSubject] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState('');

    const generateAIPlan = async () => {
        if (!year || !branch || !subject.trim()) {
            setError('Please select Year, Branch, and enter a Subject.');
            return;
        }

        setError('');
        setIsGenerating(true);
        setPlan(null); // Clear previous plan

        try {
            const response = await fetch('/api/generate-study-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, branch, subject })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate study plan.');
            }

            const data = await response.json();
            setPlan(data);
        } catch (err) {
            console.error('Generation Error:', err);
            setError(err.message || 'Something went wrong while consulting the AI.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Authenticating...</div>;
    }

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', maxWidth: '440px', margin: 'var(--space-3xl) auto', backdropFilter: 'blur(20px)' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: 'var(--space-lg)' }}><IconLock size={64} /></div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>Sign in to Access</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>You must be logged in to use Exam Mode and generate AI Study Plans.</p>
                        <Link href="/login" style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 700, textDecoration: 'none', transition: 'all 0.3s ease' }}>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const ADMIN_EMAILS = ['sutraverse11@gmail.com'];
    const isAdmin = user && (ADMIN_EMAILS.includes(user.email) || user.isAdmin);

    if (!isAdmin) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', maxWidth: '440px', margin: 'var(--space-3xl) auto', backdropFilter: 'blur(20px)' }}>
                        <div style={{ color: 'var(--accent)', marginBottom: 'var(--space-lg)' }}><IconSparkles size={64} /></div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>Under Construction</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>The AI-Powered Exam Mode is currently in internal beta testing. It will be released to all students very soon!</p>
                        <Link href="/dashboard" style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 700, textDecoration: 'none', transition: 'all 0.3s ease' }}>
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                {/* Header */}
                <ScrollReveal>
                    <div className={styles.examHeader}>
                        <span className={styles.examIcon}><IconSparkles size={48} /></span>
                        <h1 className={styles.examTitle}>
                            <span className={`${styles.examTitleAccent} text-shimmer`}>AI Last Night</span> Prep
                        </h1>
                        <p className={styles.examDesc}>
                            Configure your syllabus. Our intelligence engine will rapidly generate unit-wise summaries and the most critical questions to secure your grade.
                        </p>
                    </div>
                </ScrollReveal>

                {/* AI Configuration Engine */}
                <ScrollReveal delay={100}>
                    <div className={styles.aiConfigCard} style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', marginBottom: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Academic Year</label>
                                <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                                    <option value="">Select Year...</option>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Engineering Branch</label>
                                <select value={branch} onChange={(e) => setBranch(e.target.value)} style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                                    <option value="">Select Branch...</option>
                                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Subject to Prepare</label>
                                <input 
                                    type="text" 
                                    value={subject} 
                                    onChange={(e) => setSubject(e.target.value)} 
                                    placeholder="e.g. Distributed Database Systems"
                                    style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} 
                                />
                            </div>
                        </div>

                        {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.875rem', fontWeight: 600 }}>{error}</div>}

                        <button 
                            onClick={generateAIPlan} 
                            disabled={isGenerating}
                            style={{ 
                                width: '100%', padding: '14px', borderRadius: 'var(--radius-full)', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: isGenerating ? 0.7 : 1
                            }}
                        >
                            <IconSparkles size={20} />
                            {isGenerating ? 'Synthesizing Knowledge... Please Wait (up to 15s)' : 'Generate AI Master Plan'}
                        </button>
                    </div>
                </ScrollReveal>

                {/* Loading State or Tip */}
                {!plan && !isGenerating && (
                    <ScrollReveal delay={200}>
                        <div className={styles.tipCard}>
                            <div className={styles.tipTitle}><IconLightbulb size={20} /> Pro Tip</div>
                            <div className={styles.tipText}>
                                Select your exact year and branch alongside the subject. The AI will cross-reference academic curriculums to formulate precise summaries and predict high-value exam questions tailored for you.
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                {/* Display Generated Plan */}
                {plan && (
                    <>
                        <ScrollReveal delay={100}>
                            <h2 className={styles.sectionTitle}><IconClipboard size={28} /> AI Unit Summaries — {subject}</h2>
                        </ScrollReveal>
                        <div className={styles.summaryGrid}>
                            {plan.summaries.map((s, i) => (
                                <ScrollReveal key={i} delay={i * 100}>
                                    <div className={`${styles.summaryCard} ${styles.hoverLift}`}>
                                        <span className={styles.unitLabel}>{s.unit}</span>
                                        <h3 className={styles.summaryTitle}>{s.title}</h3>
                                        <div className={styles.summaryPoints}>
                                            {s.points.map((p, j) => (
                                                <div key={j} className={styles.summaryPoint}>{p}</div>
                                            ))}
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>

                        <ScrollReveal>
                            <h2 className={styles.sectionTitle} style={{ marginTop: '48px' }}><IconStar size={28} /> High-Probability Questions</h2>
                        </ScrollReveal>
                        <div className={styles.questionsGrid}>
                            {plan.questions.map((q, i) => (
                                <ScrollReveal key={i} delay={i * 80}>
                                    <div className={`${styles.questionCard} ${styles.hoverLift}`}>
                                        <div className={styles.questionNum}>{i + 1}</div>
                                        <div className={styles.questionContent}>
                                            <div className={styles.questionText}>{q.q}</div>
                                            <div className={styles.questionMarks}>{q.marks}</div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

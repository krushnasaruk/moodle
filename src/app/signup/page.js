'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { COLLEGES, BRANCHES, YEARS, SEMESTERS, getSubjects } from '@/lib/subjectMap';
import styles from './page.module.css';

export default function SignupPage() {
    const [step, setStep] = useState(1);

    // Step 1: Account
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Step 2: Profile
    const [college, setCollege] = useState('');
    const [branch, setBranch] = useState('');
    const [year, setYear] = useState('');
    const [semester, setSemester] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUpWithEmail, loginWithGoogle } = useAuth();
    const router = useRouter();

    // Derived data
    const availableSemesters = year ? (SEMESTERS[year] || []) : [];
    const availableSubjects = (branch && semester) ? getSubjects(branch, semester) : [];

    const toggleSubject = (subj) => {
        setSelectedSubjects(prev =>
            prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
        );
    };

    const handleStep1 = (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setStep(2);
    };

    const getFriendlyError = (err) => {
        const code = err?.code || '';
        if (code.includes('email-already-in-use')) return 'This email is already registered. Try signing in instead.';
        if (code.includes('weak-password')) return 'Password is too weak. Use at least 6 characters.';
        if (code.includes('invalid-email')) return 'Please enter a valid email address.';
        if (code.includes('network-request-failed')) return 'Network error. Check your internet connection.';
        if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a moment and try again.';
        return err.message || 'Failed to create account. Please try again.';
    };

    const handleStep2 = async (e) => {
        e.preventDefault();
        setError('');
        if (!branch || !year || !semester) {
            setError('Please select your branch, year, and semester.');
            return;
        }
        setLoading(true);
        try {
            await signUpWithEmail(email, password, name, {
                college,
                branch,
                year,
                semester,
                subjects: selectedSubjects.length > 0 ? selectedSubjects : availableSubjects,
            });
            router.push('/');
        } catch (err) {
            setError(getFriendlyError(err));
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            await loginWithGoogle();
            router.push('/');
        } catch (err) {
            setError('Google sign-up failed. Please try again.');
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.authContainer}>
                {/* Progress bar */}
                <div className={styles.stepProgress}>
                    <div className={`${styles.stepDot} ${step >= 1 ? styles.stepDotActive : ''}`}>1</div>
                    <div className={`${styles.stepLine} ${step >= 2 ? styles.stepLineActive : ''}`}></div>
                    <div className={`${styles.stepDot} ${step >= 2 ? styles.stepDotActive : ''}`}>2</div>
                </div>

                {step === 1 && (
                    <>
                        <div className={styles.authHeader}>
                            <h1 className={styles.title}>Create Account</h1>
                            <p className={styles.subtitle}>Join StudyHub to share and access notes.</p>
                        </div>

                        {error && <div className={styles.errorAlert}>{error}</div>}

                        <form className={styles.form} onSubmit={handleStep1}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Full Name</label>
                                <input type="text" className={styles.input} placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email Address</label>
                                <input type="email" className={styles.input} placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Password</label>
                                <input type="password" className={styles.input} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <button type="submit" className={styles.submitBtn}>Next — Set Up Profile →</button>
                        </form>

                        <div className={styles.divider}><span>OR</span></div>
                        <button className={styles.googleBtn} onClick={handleGoogleLogin}>
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className={styles.googleIcon} />
                            Sign up with Google
                        </button>
                        <p className={styles.bottomText}>Already have an account? <Link href="/login" className={styles.link}>Sign In</Link></p>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className={styles.authHeader}>
                            <h1 className={styles.title}>Your Profile</h1>
                            <p className={styles.subtitle}>Tell us about your studies so we can personalize your feed.</p>
                        </div>

                        {error && <div className={styles.errorAlert}>{error}</div>}

                        <form className={styles.form} onSubmit={handleStep2}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>College</label>
                                <select className={styles.select} value={college} onChange={(e) => setCollege(e.target.value)}>
                                    <option value="">Select your college</option>
                                    {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className={styles.rowGroup}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Branch</label>
                                    <select className={styles.select} value={branch} onChange={(e) => { setBranch(e.target.value); setSemester(''); setSelectedSubjects([]); }} required>
                                        <option value="">Select</option>
                                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Year</label>
                                    <select className={styles.select} value={year} onChange={(e) => { setYear(e.target.value); setSemester(''); setSelectedSubjects([]); }} required>
                                        <option value="">Select</option>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Semester</label>
                                <select className={styles.select} value={semester} onChange={(e) => { setSemester(e.target.value); setSelectedSubjects([]); }} required disabled={!year}>
                                    <option value="">Select semester</option>
                                    {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {availableSubjects.length > 0 && (
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Your Subjects <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(tap to select)</span></label>
                                    <div className={styles.chipGrid}>
                                        {availableSubjects.map(subj => (
                                            <button
                                                key={subj}
                                                type="button"
                                                className={`${styles.chip} ${selectedSubjects.includes(subj) ? styles.chipActive : ''}`}
                                                onClick={() => toggleSubject(subj)}
                                            >
                                                {subj}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.btnRow}>
                                <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>← Back</button>
                                <button type="submit" className={styles.submitBtn} disabled={loading} style={{ flex: 1 }}>
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

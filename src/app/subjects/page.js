'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BRANCHES, YEARS, SEMESTERS, SUBJECT_MAP, getSubjects } from '@/lib/subjectMap';
import { ScrollReveal } from '@/components/Animations';
import { IconNotes, IconPyq, IconAssignment, IconFolder, IconStar } from '@/components/Icons';
import styles from './page.module.css';

// Sample data for each subject
const SAMPLE_CONTENT = {
    'DBMS': [
        { id: '1', title: 'DBMS Complete Notes - Unit 1 to 5', type: 'Notes', rating: 4.8, downloads: 234 },
        { id: '2', title: 'DBMS PYQ 2024 Solved', type: 'PYQ', rating: 4.5, downloads: 189 },
        { id: '3', title: 'DBMS ER Diagram Assignment', type: 'Assignment', rating: 4.2, downloads: 100 },
    ],
    'Data Structures': [
        { id: '4', title: 'DSA Trees & Graphs Notes', type: 'Notes', rating: 4.7, downloads: 302 },
        { id: '5', title: 'DSA Sorting Algorithms PYQ', type: 'PYQ', rating: 4.4, downloads: 156 },
    ],
    'Operating Systems': [
        { id: '6', title: 'OS Process Scheduling Notes', type: 'Notes', rating: 4.6, downloads: 278 },
        { id: '7', title: 'OS Memory Management PYQ 2025', type: 'PYQ', rating: 4.3, downloads: 201 },
    ],
    'Computer Networks': [
        { id: '8', title: 'CN Unit 3 - Transport Layer', type: 'Notes', rating: 4.9, downloads: 312 },
    ],
    'Engineering Mathematics III': [
        { id: '9', title: 'M3 Important Questions', type: 'PYQ', rating: 4.7, downloads: 445 },
        { id: '10', title: 'M3 Full Notes - Laplace & Fourier', type: 'Notes', rating: 4.8, downloads: 320 },
    ],
};

function getTypeIcon(type) {
    switch (type) {
        case 'Notes': return <IconNotes size={16} />;
        case 'PYQ': return <IconPyq size={16} />;
        case 'Assignment': return <IconAssignment size={16} />;
        default: return <IconFolder size={16} />;
    }
}

function getTypeClass(type) {
    switch (type) {
        case 'Notes': return styles.typeNotes;
        case 'PYQ': return styles.typePyq;
        case 'Assignment': return styles.typeAssignment;
        default: return styles.typeNotes;
    }
}

export default function SubjectsPage() {
    const { user } = useAuth();

    // Default to user's profile, fall back to manual selection
    const [branch, setBranch] = useState(user?.branch || 'Computer');
    const [year, setYear] = useState(user?.year || '2nd Year');
    const [semester, setSemester] = useState(user?.semester || 'Sem 3');

    const availableSemesters = year ? (SEMESTERS[year] || []) : [];
    const subjects = getSubjects(branch, semester);

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                <ScrollReveal>
                    <div className={styles.pageHeader}>
                        <h1 className={styles.pageTitle}><IconFolder size={32} /> Subjects</h1>
                        <p className={styles.pageSubtitle}>Browse study material organized by subject</p>
                    </div>
                </ScrollReveal>

                {/* Filters */}
                <ScrollReveal delay={100}>
                    <div className={styles.filterBar}>
                        <select className={styles.filterSelect} value={branch} onChange={(e) => { setBranch(e.target.value); setSemester(''); }}>
                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select className={styles.filterSelect} value={year} onChange={(e) => { setYear(e.target.value); setSemester(''); }}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select className={styles.filterSelect} value={semester} onChange={(e) => setSemester(e.target.value)} disabled={!year}>
                            <option value="">Select Semester</option>
                            {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </ScrollReveal>

                {/* Subject Grid */}
                {subjects.length > 0 ? (
                    <div className={styles.subjectGrid}>
                        {subjects.map((subj, i) => {
                            const content = SAMPLE_CONTENT[subj] || [];
                            return (
                                <ScrollReveal key={subj} delay={i * 80}>
                                    <div className={`${styles.subjectCard} hover-lift`} style={{ animationDelay: `${i * 0.05}s` }}>
                                        <div className={styles.subjectCardHeader}>
                                            <div className={styles.subjectIcon}><IconNotes size={24} /></div>
                                            <h3 className={styles.subjectName}>{subj}</h3>
                                        </div>

                                        {content.length > 0 ? (
                                            <div className={styles.contentList}>
                                                {content.map(item => (
                                                    <div key={item.id} className={styles.contentItem}>
                                                        <span className={`${styles.contentType} ${getTypeClass(item.type)}`}>{getTypeIcon(item.type)} {item.type}</span>
                                                        <span className={styles.contentTitle}>{item.title}</span>
                                                        <span className={styles.contentRating}><IconStar size={12} /> {item.rating}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={styles.noContent}>
                                                <p>No materials yet</p>
                                                <Link href="/upload" className={styles.uploadLink}>Be the first to upload →</Link>
                                            </div>
                                        )}

                                        <Link href={`/notes?q=${encodeURIComponent(subj)}`} className={styles.viewAllLink}>
                                            View all {subj} materials →
                                        </Link>
                                    </div>
                                </ScrollReveal>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <IconFolder size={48} />
                        <p>Select a semester to see subjects</p>
                    </div>
                )}
            </div>
        </div>
    );
}


'use client';

import { useState } from 'react';
import styles from '../notes/page.module.css';
import { IconPyq, IconUser, IconFolder, IconCalendar, IconPen, IconDownload, IconStar, IconSearch } from '@/components/Icons';

const SAMPLE_PYQS = [
    { id: '1', title: 'DBMS End-Sem 2025', subject: 'DBMS', branch: 'Computer', year: '2025', marks: '70 marks', uploader: 'Rahul S.', rating: 4.9, downloads: 567 },
    { id: '2', title: 'Operating Systems Mid-Sem 2025', subject: 'OS', branch: 'Computer', year: '2025', marks: '30 marks', uploader: 'Priya K.', rating: 4.6, downloads: 432 },
    { id: '3', title: 'Data Structures End-Sem 2024', subject: 'DSA', branch: 'Computer', year: '2024', marks: '70 marks', uploader: 'Amit R.', rating: 4.8, downloads: 621 },
    { id: '4', title: 'Computer Networks End-Sem 2025', subject: 'CN', branch: 'Computer', year: '2025', marks: '70 marks', uploader: 'Neha M.', rating: 4.7, downloads: 389 },
    { id: '5', title: 'Mathematics-III End-Sem 2024', subject: 'Mathematics', branch: 'All', year: '2024', marks: '70 marks', uploader: 'Vikram T.', rating: 4.9, downloads: 712 },
    { id: '6', title: 'Software Engineering Mid-Sem 2025', subject: 'SE', branch: 'Computer', year: '2025', marks: '30 marks', uploader: 'Sara J.', rating: 4.3, downloads: 234 },
    { id: '7', title: 'Theory of Computation End-Sem 2024', subject: 'TOC', branch: 'Computer', year: '2024', marks: '70 marks', uploader: 'Karan P.', rating: 4.5, downloads: 298 },
    { id: '8', title: 'DBMS Mid-Sem 2024', subject: 'DBMS', branch: 'Computer', year: '2024', marks: '30 marks', uploader: 'Ankit D.', rating: 4.4, downloads: 345 },
];

const EXAM_YEARS = ['All', '2025', '2024', '2023', '2022'];
const SUBJECTS = ['All', 'DBMS', 'OS', 'DSA', 'CN', 'SE', 'TOC', 'Mathematics'];

export default function PYQsPage() {
    const [examYear, setExamYear] = useState('All');
    const [subject, setSubject] = useState('All');
    const [search, setSearch] = useState('');

    const filtered = SAMPLE_PYQS.filter((p) => {
        if (examYear !== 'All' && p.year !== examYear) return false;
        if (subject !== 'All' && p.subject !== subject) return false;
        if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.subject.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}><IconPyq size={40} /> Previous Year Questions</h1>
                    <p className={styles.pageDesc}>Practice with actual exam papers organized by subject and year.</p>
                </div>

                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <select className={styles.filterSelect} value={subject} onChange={(e) => setSubject(e.target.value)}>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s === 'All' ? '📁 All Subjects' : s}</option>)}
                        </select>
                        <select className={styles.filterSelect} value={examYear} onChange={(e) => setExamYear(e.target.value)}>
                            {EXAM_YEARS.map(y => <option key={y} value={y}>{y === 'All' ? '📅 All Years' : y}</option>)}
                        </select>
                    </div>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search PYQs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><IconSearch size={64} /></div>
                        <div className={styles.emptyText}>No PYQs found</div>
                        <div className={styles.emptySubtext}>Try adjusting your filters</div>
                    </div>
                ) : (
                    <div className={styles.listContainer}>
                        {filtered.map((pyq) => (
                            <div key={pyq.id} className={styles.rowCard}>
                                <div className={styles.cardIconArea}>
                                    <IconPyq size={32} className={styles.fileIcon} />
                                    <span className={`${styles.cardBadge} ${styles.badgePyq}`}>PYQ</span>
                                </div>
                                <div className={styles.cardMain}>
                                    <h3 className={styles.cardTitle}>{pyq.title}</h3>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.metaItem}><IconUser /> <strong>{pyq.uploader}</strong></span>
                                        <span className={styles.metaItem}><IconFolder /> {pyq.subject}</span>
                                        <span className={styles.metaItem}><IconCalendar /> {pyq.year}</span>
                                        <span className={styles.metaItem}><IconPen /> {pyq.marks}</span>
                                    </div>
                                </div>
                                <div className={styles.cardActions}>
                                    <div className={styles.rating}><IconStar /> {pyq.rating}</div>
                                    <button className={styles.downloadBtn}>
                                        <IconDownload size={18} /> Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

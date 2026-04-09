'use client';

import { useState } from 'react';
import styles from '../notes/page.module.css';
import { IconAssignment, IconUser, IconFolder, IconHat, IconDownload, IconStar, IconSearch } from '@/components/Icons';

const SAMPLE_ASSIGNMENTS = [
    { id: '1', title: 'DBMS ER Diagram Assignment', subject: 'DBMS', branch: 'Computer', year: '2nd Year', uploader: 'Rahul S.', rating: 4.6, downloads: 189, format: 'PDF' },
    { id: '2', title: 'DSA Linked List Implementation', subject: 'DSA', branch: 'Computer', year: '2nd Year', uploader: 'Priya K.', rating: 4.8, downloads: 234, format: 'Code + PDF' },
    { id: '3', title: 'OS Process Scheduling Lab', subject: 'OS', branch: 'Computer', year: '2nd Year', uploader: 'Amit R.', rating: 4.4, downloads: 167, format: 'Code' },
    { id: '4', title: 'CN Socket Programming Assignment', subject: 'CN', branch: 'Computer', year: '3rd Year', uploader: 'Neha M.', rating: 4.7, downloads: 278, format: 'Code + PDF' },
    { id: '5', title: 'SE UML Diagrams Case Study', subject: 'SE', branch: 'Computer', year: '3rd Year', uploader: 'Vikram T.', rating: 4.5, downloads: 156, format: 'PDF' },
    { id: '6', title: 'ML Linear Regression Lab', subject: 'ML', branch: 'Computer', year: '4th Year', uploader: 'Sara J.', rating: 4.3, downloads: 134, format: 'Code' },
];

const SUBJECTS = ['All', 'DBMS', 'DSA', 'OS', 'CN', 'SE', 'ML', 'Mathematics'];

export default function AssignmentsPage() {
    const [subject, setSubject] = useState('All');
    const [search, setSearch] = useState('');

    const filtered = SAMPLE_ASSIGNMENTS.filter(a => {
        if (subject !== 'All' && a.subject !== subject) return false;
        if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}><IconAssignment size={40} /> Assignments</h1>
                    <p className={styles.pageDesc}>Ready-to-submit assignments with solutions — code and PDFs.</p>
                </div>

                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <select className={styles.filterSelect} value={subject} onChange={(e) => setSubject(e.target.value)}>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s === 'All' ? '📁 All Subjects' : s}</option>)}
                        </select>
                    </div>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search assignments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><IconSearch size={64} /></div>
                        <div className={styles.emptyText}>No assignments found</div>
                        <div className={styles.emptySubtext}>Try adjusting your filters</div>
                    </div>
                ) : (
                    <div className={styles.listContainer}>
                        {filtered.map((item) => (
                            <div key={item.id} className={styles.rowCard}>
                                <div className={styles.cardIconArea}>
                                    <IconAssignment size={32} className={styles.fileIcon} />
                                    <span className={`${styles.cardBadge} ${item.format.includes('Code') ? styles.badgeCode : styles.badgePdf}`}>{item.format}</span>
                                </div>
                                <div className={styles.cardMain}>
                                    <h3 className={styles.cardTitle}>{item.title}</h3>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.metaItem}><IconUser /> <strong>{item.uploader}</strong></span>
                                        <span className={styles.metaItem}><IconFolder /> {item.subject}</span>
                                        <span className={styles.metaItem}><IconHat /> {item.year}</span>
                                    </div>
                                </div>
                                <div className={styles.cardActions}>
                                    <div className={styles.rating}><IconStar /> {item.rating}</div>
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

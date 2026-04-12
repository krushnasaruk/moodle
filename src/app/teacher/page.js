'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { IconNotes, IconPyq, IconAssignment } from '@/components/Icons';
import styles from './page.module.css';

export default function TeacherDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    // Core state
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'materials', 'announcements'
    const [status, setStatus] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Attendance state
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { email: 'present' | 'absent' | 'late' }
    const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [fetchingData, setFetchingData] = useState(false);

    // Materials state
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadType, setUploadType] = useState('Notes');
    const [uploadProgress, setUploadProgress] = useState(0);

    // Announcements state
    const [announcementText, setAnnouncementText] = useState('');

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'teacher') {
                router.push('/dashboard');
            }
        }
    }, [user, loading, router]);


    // -----------------------------------------------------
    // ATTENDANCE LOGIC
    // -----------------------------------------------------

    // Fetch roster AND past attendance if available for this date
    const loadClassData = async (assignment, dateStr) => {
        setFetchingData(true);
        setStatus('');
        setAttendance({});
        setStudents([]);
        
        try {
            // 1. Fetch roster
            const q = query(collection(db, 'roster'), where('classId', '==', assignment.classId), where('role', '==', 'student'));
            const querySnapshot = await getDocs(q);
            const studentList = [];
            querySnapshot.forEach((docSnap) => studentList.push(docSnap.data()));
            studentList.sort((a, b) => a.email.localeCompare(b.email));
            
            // 2. Fetch past attendance record if it exists
            const recordId = `${dateStr}_${assignment.classId}_${assignment.subject}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            const pastRecordRef = doc(db, 'attendance', recordId);
            const pastRecordSnap = await getDoc(pastRecordRef);

            let initialAttendance = {};

            if (pastRecordSnap.exists()) {
                const pastData = pastRecordSnap.data();
                // Reconstruct attendance map from arrays
                pastData.presentStudents?.forEach(email => initialAttendance[email] = 'present');
                pastData.absentStudents?.forEach(email => initialAttendance[email] = 'absent');
                pastData.lateStudents?.forEach(email => initialAttendance[email] = 'late');
                setStatus(`Loaded past record for ${dateStr}`);
            } else {
                // Default all to present if no record exists
                studentList.forEach(s => initialAttendance[s.email] = 'present');
            }
            
            setStudents(studentList);
            setAttendance(initialAttendance);
            
            if (studentList.length === 0) setStatus('No students found for this class in the roster.');
        } catch (error) {
            setStatus('Error fetching dat: ' + error.message);
        } finally {
            setFetchingData(false);
        }
    };

    const handleAssignmentSelect = (assignment) => {
        setSelectedAssignment(assignment);
        loadClassData(assignment, attendanceDate);
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setAttendanceDate(newDate);
        if (selectedAssignment) {
            loadClassData(selectedAssignment, newDate);
        }
    };

    const toggleAttendanceState = (email) => {
        setAttendance(prev => {
            const current = prev[email];
            let nextState = 'present';
            if (current === 'present') nextState = 'absent';
            else if (current === 'absent') nextState = 'late';
            return { ...prev, [email]: nextState };
        });
    };

    const markAll = (state) => {
        const newAttendance = {};
        students.forEach(s => newAttendance[s.email] = state);
        setAttendance(newAttendance);
    };

    const saveAttendance = async () => {
        if (!selectedAssignment || students.length === 0) return;
        setIsSaving(true);
        setStatus('Saving...');
        
        try {
            const recordId = `${attendanceDate}_${selectedAssignment.classId}_${selectedAssignment.subject}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            
            const presentStudents = Object.keys(attendance).filter(e => attendance[e] === 'present');
            const absentStudents = Object.keys(attendance).filter(e => attendance[e] === 'absent');
            const lateStudents = Object.keys(attendance).filter(e => attendance[e] === 'late');
            
            await setDoc(doc(db, 'attendance', recordId), {
                date: attendanceDate,
                timestamp: new Date().toISOString(),
                classId: selectedAssignment.classId,
                subject: selectedAssignment.subject,
                teacherEmail: user.email,
                totalEnrolled: students.length,
                presentStudents,
                absentStudents,
                lateStudents
            });
            setStatus(`✅ Saved successfully for ${attendanceDate}`);
        } catch (error) {
            setStatus('❌ Failed to save: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // -----------------------------------------------------
    // MATERIALS LOGIC
    // -----------------------------------------------------
    const handleUploadMaterial = async (e) => {
        e.preventDefault();
        if (!uploadFile) return setStatus("Please select a file.");
        if (!uploadTitle.trim()) return setStatus("Title cannot be empty.");
        
        setIsSaving(true);
        setUploadProgress(10);
        setStatus("Starting upload...");

        try {
            const safeName = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storagePath = `uploads/${selectedAssignment.classId}/${Date.now()}_${safeName}`;
            const storageRef = ref(storage, storagePath);
            
            const uploadTask = uploadBytesResumable(storageRef, uploadFile);
            
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    setStatus("Upload failed: " + error.message);
                    setIsSaving(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    const fileDoc = {
                        title: uploadTitle.trim(),
                        type: uploadType,
                        subject: selectedAssignment.subject,
                        classId: selectedAssignment.classId, // Targeted to specific class
                        uploaderName: user.name || user.email,
                        uploaderUID: user.uid,
                        fileUrl: downloadURL,
                        storagePath: storagePath,
                        downloads: 0,
                        rating: "0",
                        status: "approved", // Teachers bypass approval
                        createdAt: new Date().toISOString()
                    };

                    const newDocRef = doc(collection(db, 'files'));
                    await setDoc(newDocRef, fileDoc);

                    setStatus("✅ Material uploaded successfully to " + selectedAssignment.classId);
                    setUploadFile(null);
                    setUploadTitle('');
                    setUploadProgress(0);
                    setIsSaving(false);
                }
            );
        } catch (err) {
            setStatus("❌ Error: " + err.message);
            setIsSaving(false);
        }
    };

    // -----------------------------------------------------
    // ANNOUNCEMENTS LOGIC
    // -----------------------------------------------------
    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementText.trim()) return setStatus("Announcement is empty.");
        
        setIsSaving(true);
        setStatus("Posting...");

        try {
            const announcementDoc = {
                message: announcementText.trim(),
                classId: selectedAssignment.classId,
                subject: selectedAssignment.subject,
                teacherName: user.name || user.email,
                teacherEmail: user.email,
                timestamp: new Date().toISOString(),
                createdAt: new Date()
            };

            await setDoc(doc(collection(db, 'announcements')), announcementDoc);
            
            setStatus("✅ Announcement posted to " + selectedAssignment.classId);
            setAnnouncementText('');
        } catch (err) {
            setStatus("❌ Error: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Rendering Helpers
    const getTabClass = (tabName) => `${styles.tab} ${activeTab === tabName ? styles.activeTab : ''}`;
    
    const getRowClass = (state) => {
        if (state === 'present') return styles.rowPresent;
        if (state === 'absent') return styles.rowAbsent;
        if (state === 'late') return styles.rowLate;
        return '';
    };

    const getToggleBtnProps = (state) => {
        if (state === 'present') return { className: `${styles.toggleBtn} ${styles.btnPresent}`, text: '✓ Present' };
        if (state === 'absent') return { className: `${styles.toggleBtn} ${styles.btnAbsent}`, text: '✕ Absent' };
        if (state === 'late') return { className: `${styles.toggleBtn} ${styles.btnLate}`, text: '⏱ Late' };
        return { className: styles.toggleBtn, text: '---' };
    };

    if (loading || !user || user.role !== 'teacher') {
        return <div className={styles.container}><div className={styles.loader}>Loading...</div></div>;
    }

    const presentCount = Object.values(attendance).filter(s => s === 'present').length;
    const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
    const lateCount = Object.values(attendance).filter(s => s === 'late').length;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Teacher Command Center</h1>
                <p>Welcome, Prof. {user.name || user.email.split('@')[0]}</p>
            </header>

            <div className={styles.dashboardGrid}>
                
                {/* Left Panel: Class Selection */}
                <div className={styles.leftPanel}>
                    <h2 className={styles.panelTitle}>Your Classes</h2>
                    {user.assignments && user.assignments.length > 0 ? (
                        <div className={styles.assignmentList}>
                            {user.assignments.map((assignment, idx) => {
                                const isActive = selectedAssignment?.classId === assignment.classId && 
                                                 selectedAssignment?.subject === assignment.subject;
                                return (
                                    <button 
                                        key={idx}
                                        className={`${styles.assignmentCard} ${isActive ? styles.activeCard : ''}`}
                                        onClick={() => handleAssignmentSelect(assignment)}
                                    >
                                        <div className={styles.classId}>{assignment.classId}</div>
                                        <div className={styles.subject}>{assignment.subject}</div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className={styles.noData}>You have no assigned classes.</p>
                    )}
                </div>

                {/* Right Panel: Tabbed Interface */}
                <div className={styles.mainPanel}>
                    {!selectedAssignment ? (
                        <div className={styles.placeholderState}>
                            <h2>Select a class</h2>
                            <p>Choose a class from the left menu to manage attendance, materials, and announcements.</p>
                        </div>
                    ) : (
                        <>
                            {/* Tab Navigation */}
                            <div className={styles.tabNav}>
                                <button className={getTabClass('attendance')} onClick={() => {setActiveTab('attendance'); setStatus('');}}>📋 Attendance</button>
                                <button className={getTabClass('materials')} onClick={() => {setActiveTab('materials'); setStatus('');}}>📁 Materials Upload</button>
                                <button className={getTabClass('announcements')} onClick={() => {setActiveTab('announcements'); setStatus('');}}>📢 Announcements</button>
                            </div>

                            <div className={styles.tabContent}>
                                
                                {/* TAB 1: ATTENDANCE */}
                                {activeTab === 'attendance' && (
                                    <div className={styles.attendanceTab}>
                                        <div className={styles.contentHeader}>
                                            <div className={styles.headerLeft}>
                                                <h3>Attendance Record</h3>
                                                <input 
                                                    type="date" 
                                                    value={attendanceDate}
                                                    onChange={handleDateChange}
                                                    className={styles.datePicker}
                                                />
                                            </div>
                                            <div className={styles.batchActions}>
                                                <button onClick={() => markAll('present')} className={styles.batchBtn}>All Present</button>
                                                <button onClick={() => markAll('absent')} className={styles.batchBtnAlt}>All Absent</button>
                                            </div>
                                        </div>

                                        {fetchingData ? (
                                            <div className={styles.loader}>Fetching roster...</div>
                                        ) : students.length > 0 ? (
                                            <div className={styles.attendanceBody}>
                                                <div className={styles.statsBar}>
                                                    <span>Total: {students.length}</span>
                                                    <span className={styles.statPresent}>P: {presentCount}</span>
                                                    <span className={styles.statAbsent}>A: {absentCount}</span>
                                                    <span className={styles.statLate}>L: {lateCount}</span>
                                                </div>
                                                
                                                <div className={styles.studentList}>
                                                    {students.map((student) => {
                                                        const state = attendance[student.email];
                                                        const btnProps = getToggleBtnProps(state);
                                                        return (
                                                            <div key={student.email} className={`${styles.studentRow} ${getRowClass(state)}`}>
                                                                <div className={styles.studentInfo}>{student.email}</div>
                                                                <button onClick={() => toggleAttendanceState(student.email)} className={btnProps.className}>
                                                                    {btnProps.text}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className={styles.actionFooter}>
                                                    <p className={styles.statusMsg}>{status}</p>
                                                    <button onClick={saveAttendance} disabled={isSaving} className={styles.saveBtn}>
                                                        {isSaving ? 'Saving...' : 'Submit Attendance'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className={styles.noData}>{status}</p>
                                        )}
                                    </div>
                                )}

                                {/* TAB 2: MATERIALS */}
                                {activeTab === 'materials' && (
                                    <div className={styles.materialsTab}>
                                        <h3>Upload to {selectedAssignment.classId}</h3>
                                        <p className={styles.tabDesc}>Materials uploaded here are automatically approved and instantly visible to students in this class.</p>
                                        
                                        <form onSubmit={handleUploadMaterial} className={styles.uploadForm}>
                                            <div className={styles.formGroup}>
                                                <label>Title</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g., Chapter 1 Dynamics Notes" 
                                                    value={uploadTitle}
                                                    onChange={e => setUploadTitle(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Material Type</label>
                                                <select value={uploadType} onChange={e => setUploadType(e.target.value)}>
                                                    <option value="Notes">📘 Notes</option>
                                                    <option value="PYQ">📜 PYQs</option>
                                                    <option value="Assignment">📝 Assignment</option>
                                                </select>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Select PDF File</label>
                                                <input 
                                                    type="file" 
                                                    accept=".pdf" 
                                                    onChange={e => setUploadFile(e.target.files[0])}
                                                    required
                                                    className={styles.fileInput}
                                                />
                                            </div>

                                            {uploadProgress > 0 && uploadProgress < 100 && (
                                                <div className={styles.progressContainer}>
                                                    <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }}></div>
                                                </div>
                                            )}

                                            <p className={styles.statusMsg}>{status}</p>
                                            <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                                                {isSaving ? 'Uploading...' : 'Upload Material'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* TAB 3: ANNOUNCEMENTS */}
                                {activeTab === 'announcements' && (
                                    <div className={styles.announcementsTab}>
                                        <h3>Post Announcement to {selectedAssignment.classId}</h3>
                                        <p className={styles.tabDesc}>Broadcast a message directly to all students enrolled in this class.</p>
                                        
                                        <form onSubmit={handlePostAnnouncement} className={styles.uploadForm}>
                                            <div className={styles.formGroup}>
                                                <label>Message</label>
                                                <textarea 
                                                    placeholder="e.g., Reminder: Assignment 3 is due tomorrow at midnight. I'll hold extra office hours today..." 
                                                    value={announcementText}
                                                    onChange={e => setAnnouncementText(e.target.value)}
                                                    required
                                                    rows={5}
                                                    style={{ resize: 'vertical' }}
                                                />
                                            </div>

                                            <p className={styles.statusMsg}>{status}</p>
                                            <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                                                {isSaving ? 'Posting...' : 'Broadcast Announcement'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

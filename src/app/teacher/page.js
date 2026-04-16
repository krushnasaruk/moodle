'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './page.module.css';

export default function TeacherDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    // Core state
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'materials', 'announcements'
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);
    
    // Monthly Reports State
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
    const [generatingReport, setGeneratingReport] = useState(false);

    // Deadlines Tracker State
    const [deadlines, setDeadlines] = useState([]);
    const [deadlineTitle, setDeadlineTitle] = useState('');
    const [deadlineDesc, setDeadlineDesc] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');

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

    // Leave Requests state
    const [leaveRequests, setLeaveRequests] = useState([]);

    // Geo-Radar State
    const [liveSessionActive, setLiveSessionActive] = useState(false);
    const [radarSearching, setRadarSearching] = useState(false);
    const [geoVerifiedStudents, setGeoVerifiedStudents] = useState([]);
    const [qrToken, setQrToken] = useState('');

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

    const loadClassData = async (assignment, dateStr) => {
        setFetchingData(true);
        setStatus({ text: '', type: '' });
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
                pastData.presentStudents?.forEach(email => initialAttendance[email] = 'present');
                pastData.absentStudents?.forEach(email => initialAttendance[email] = 'absent');
                pastData.lateStudents?.forEach(email => initialAttendance[email] = 'late');
                pastData.excusedStudents?.forEach(email => initialAttendance[email] = 'excused');
                setStatus({ text: `Loaded past record for ${dateStr}`, type: 'success' });
            } else {
                studentList.forEach(s => initialAttendance[s.email] = 'present');
            }
            
            setStudents(studentList);
            setAttendance(initialAttendance);

            // 3. Fetch Leave Requests for this class
            const lrQ = query(collection(db, 'leaveRequests'), where('classId', '==', assignment.classId));
            const lrSnap = await getDocs(lrQ);
            const lrList = [];
            lrSnap.forEach(d => lrList.push({ id: d.id, ...d.data() }));
            lrList.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
            setLeaveRequests(lrList);
            
            if (studentList.length === 0) setStatus({ text: 'No students found for this class in the roster.', type: 'error' });
        } catch (error) {
            setStatus({ text: 'Error fetching data: ' + error.message, type: 'error' });
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
            else if (current === 'late') nextState = 'excused';
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
        setStatus({ text: 'Saving...', type: '' });
        
        try {
            const recordId = `${attendanceDate}_${selectedAssignment.classId}_${selectedAssignment.subject}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            
            const presentStudents = Object.keys(attendance).filter(e => attendance[e] === 'present');
            const absentStudents = Object.keys(attendance).filter(e => attendance[e] === 'absent');
            const lateStudents = Object.keys(attendance).filter(e => attendance[e] === 'late');
            const excusedStudents = Object.keys(attendance).filter(e => attendance[e] === 'excused');
            
            await setDoc(doc(db, 'attendance', recordId), {
                date: attendanceDate,
                timestamp: new Date().toISOString(),
                classId: selectedAssignment.classId,
                subject: selectedAssignment.subject,
                teacherEmail: user.email,
                totalEnrolled: students.length,
                presentStudents,
                absentStudents,
                lateStudents,
                excusedStudents
            });
            setStatus({ text: `✅ Saved successfully for ${attendanceDate}`, type: 'success' });
        } catch (error) {
            setStatus({ text: '❌ Failed to save: ' + error.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // -----------------------------------------------------
    // LIVE RADAR LOGIC
    // -----------------------------------------------------
    const toggleLiveRadar = async () => {
        if (liveSessionActive) {
            // End session
            try {
                const ref = doc(db, 'liveSessions', selectedAssignment.classId);
                await setDoc(ref, { active: false }, { merge: true });
                
                // Auto-mark unscanned students as absent
                setAttendance(prev => {
                    const newState = { ...prev };
                    students.forEach(s => {
                        if (!newState[s.email]) newState[s.email] = 'absent';
                    });
                    return newState;
                });

                setLiveSessionActive(false);
                setRadarSearching(false);
                setStatus({ text: "Radar offline.", type: "" });
            } catch (error) {
                setStatus({ text: "Failed to end radar: " + error.message, type: "error" });
            }
            return;
        }

        setRadarSearching(true);
        setStatus({ text: "Acquiring GPS Signal...", type: "" });
        
        if (!navigator.geolocation) {
            setStatus({ text: "Geolocation is not supported by your browser.", type: "error" });
            setRadarSearching(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                if (accuracy > 40) {
                    setStatus({ text: `GPS signal too weak (Accuracy: ${Math.round(accuracy)}m). Needs < 40m. Move closer to a window.`, type: "error" });
                    setRadarSearching(false);
                    return;
                }
                try {
                    const sessionData = {
                        active: true,
                        teacherLat: latitude,
                        teacherLng: longitude,
                        accuracy: accuracy,
                        classId: selectedAssignment.classId,
                        date: attendanceDate,
                        timestamp: new Date().toISOString(),
                    };
                    await setDoc(doc(db, 'liveSessions', selectedAssignment.classId), sessionData);
                    setLiveSessionActive(true);
                    setRadarSearching(false);
                    setStatus({ text: `Radar Active. Broadcast radius: ~15m.`, type: "success" });
                } catch (e) {
                    setStatus({ text: "Error starting radar: " + e.message, type: "error" });
                    setRadarSearching(false);
                }
            },
            (error) => {
                setStatus({ text: "GPS Error: " + error.message, type: "error" });
                setRadarSearching(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // -----------------------------------------------------
    // DEADLINES & CALENDAR TICKERS LOGIC
    // -----------------------------------------------------
    const publishDeadline = async () => {
        if (!deadlineTitle || !deadlineDate || !selectedAssignment) return;
        setIsSaving(true);
        setStatus({ text: '', type: '' });
        try {
            await addDoc(collection(db, 'deadlines'), {
                classId: selectedAssignment.classId,
                title: deadlineTitle,
                description: deadlineDesc,
                dueDate: deadlineDate, // Standard ISO format bound securely to the frontend clock
                teacherId: user.uid,
                createdAt: new Date().toISOString()
            });
            setStatus({ text: 'Deadline published and broadcasted to students!', type: 'success' });
            setDeadlineTitle('');
            setDeadlineDesc('');
            setDeadlineDate('');
        } catch (e) {
            setStatus({ text: 'Error publishing deadline.', type: 'error' });
        }
        setIsSaving(false);
    };

    const deleteDeadline = async (id) => {
        if (!window.confirm('Are you sure you want to completely erase this deadline from student trackers?')) return;
        try {
            await deleteDoc(doc(db, 'deadlines', id));
        } catch(e) {
            console.error('Error erasing deadline:', e);
        }
    };

    useEffect(() => {
        if (!selectedAssignment) {
            setLiveSessionActive(false);
            return;
        }
        
        // Sync the Teacher's Radar state dynamically with Firestore
        const sessionRef = doc(db, 'liveSessions', selectedAssignment.classId);
        const unsubSession = onSnapshot(sessionRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().active && docSnap.data().date === attendanceDate) {
                setLiveSessionActive(true);
            } else {
                setLiveSessionActive(false);
            }
        });

        // Sync verified check-ins
        const q = query(collection(db, 'liveCheckins'), where('classId', '==', selectedAssignment.classId), where('date', '==', attendanceDate));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
            
            setGeoVerifiedStudents(list);
            
            // Auto-mark present in local state for anyone who checked in today!
            if (list.length > 0) {
                setAttendance(prev => {
                    const newState = { ...prev };
                    list.forEach(checkin => {
                        newState[checkin.studentEmail] = 'present';
                    });
                    return newState;
                });
            }
        });

        // 5. Connect Realtime Deadlines Tracker Stream
        const unsubDeadlines = onSnapshot(query(collection(db, 'deadlines'), where('classId', '==', selectedAssignment.classId)), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); // Urgency sorted
            setDeadlines(data);
        });
        
        return () => {
            unsubSession();
            unsubscribe();
            unsubDeadlines();
        };
    }, [selectedAssignment, attendanceDate]);

    // QR Code Automatic Rotation
    useEffect(() => {
        if (!liveSessionActive || !selectedAssignment) {
            setQrToken('');
            return;
        }
        
        const tokenPayload = () => JSON.stringify({
            classId: selectedAssignment.classId,
            date: attendanceDate,
            timestamp: Date.now()
        });

        setQrToken(tokenPayload());
        const interval = setInterval(() => {
            setQrToken(tokenPayload());
        }, 15000); // 15 seconds

        return () => clearInterval(interval);
    }, [liveSessionActive, selectedAssignment, attendanceDate]);

    // -----------------------------------------------------
    // EXPORT & REPORTING LOGIC
    // -----------------------------------------------------
    const downloadDailyCSV = () => {
        if (!selectedAssignment || students.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Email,Student ID,Status\n";
        
        students.forEach(student => {
            const state = attendance[student.email] || 'absent';
            csvContent += `${student.email},${student.studentId || 'Pending'},${state}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `daily_attendance_${selectedAssignment.classId}_${attendanceDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateMonthlyAggregate = async () => {
        setGeneratingReport(true);
        setStatus({ text: `Compiling data for ${reportMonth}...`, type: "" });
        try {
            // Query all attendance for classId
            const attQuery = query(collection(db, 'attendance'), where('classId', '==', selectedAssignment.classId));
            const snap = await getDocs(attQuery);
            
            const monthRecords = [];
            snap.forEach(d => {
                const data = d.data();
                if (data.date && data.date.startsWith(reportMonth)) {
                    monthRecords.push(data);
                }
            });
            
            if (monthRecords.length === 0) {
                setStatus({ text: `No records found in ${reportMonth}.`, type: "error" });
                setGeneratingReport(false);
                return null;
            }
            
            // Aggregate
            const studentStats = {};
            students.forEach(s => {
                studentStats[s.email] = { present: 0, late: 0, excused: 0, absent: 0, totalClasses: monthRecords.length };
            });
            
            monthRecords.forEach(rec => {
                (rec.presentStudents || []).forEach(e => { if(studentStats[e]) studentStats[e].present++; });
                (rec.lateStudents || []).forEach(e => { if(studentStats[e]) studentStats[e].late++; });
                (rec.excusedStudents || []).forEach(e => { if(studentStats[e]) studentStats[e].excused++; });
                (rec.absentStudents || []).forEach(e => { if(studentStats[e]) studentStats[e].absent++; });
            });
            
            // Calculate %
            Object.keys(studentStats).forEach(e => {
                const s = studentStats[e];
                const activeDays = s.present + (s.late * 0.5) + s.excused; // Standardized weighting
                s.percentage = s.totalClasses > 0 ? Math.round((activeDays / s.totalClasses) * 100) : 0;
            });
            
            setGeneratingReport(false);
            return studentStats;
        } catch (error) {
            setStatus({ text: "Report generation failed: " + error.message, type: "error" });
            setGeneratingReport(false);
            return null;
        }
    };
    
    const downloadMonthlyCSV = async () => {
        const stats = await generateMonthlyAggregate();
        if (!stats) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Email,Total Classes,Present,Absent,Late,Excused,Percentage\n`;
        
        Object.keys(stats).forEach(email => {
            const s = stats[email];
            csvContent += `${email},${s.totalClasses},${s.present},${s.absent},${s.late},${s.excused},${s.percentage}%\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `monthly_${selectedAssignment.classId}_${reportMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus({ text: "Monthly CSV Downloaded", type: "success" });
    };
    
    const publishMonthlyReport = async () => {
        const stats = await generateMonthlyAggregate();
        if (!stats) return;
        setStatus({ text: "Publishing Official Report to Student Dashboards...", type: "" });
        try {
            await addDoc(collection(db, 'monthlyReports'), {
                classId: selectedAssignment.classId,
                month: reportMonth,
                publishedBy: user.email,
                teacherName: user.name || 'Instructor',
                timestamp: new Date().toISOString(),
                studentStats: stats
            });
            setStatus({ text: `✅ ${reportMonth} Official Report Successfully Published!`, type: "success" });
        } catch(error) {
            setStatus({ text: "Publish failed: " + error.message, type: "error" });
        }
    };

    // -----------------------------------------------------
    // MATERIALS LOGIC
    // -----------------------------------------------------
    const handleUploadMaterial = async (e) => {
        e.preventDefault();
        if (!uploadFile) return setStatus({ text: "Please select a file.", type: 'error' });
        if (!uploadTitle.trim()) return setStatus({ text: "Title cannot be empty.", type: 'error' });
        
        setIsSaving(true);
        setUploadProgress(10);
        setStatus({ text: "Starting upload...", type: '' });

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
                    setStatus({ text: "Upload failed: " + error.message, type: 'error' });
                    setIsSaving(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    const fileDoc = {
                        title: uploadTitle.trim(),
                        type: uploadType,
                        subject: selectedAssignment.subject,
                        classId: selectedAssignment.classId,
                        uploaderName: user.name || user.email,
                        uploaderUID: user.uid,
                        fileUrl: downloadURL,
                        storagePath: storagePath,
                        downloads: 0,
                        rating: "0",
                        status: "approved",
                        createdAt: new Date().toISOString()
                    };

                    const newDocRef = doc(collection(db, 'files'));
                    await setDoc(newDocRef, fileDoc);

                    setStatus({ text: `✅ Material uploaded to ${selectedAssignment.classId}`, type: 'success' });
                    setUploadFile(null);
                    setUploadTitle('');
                    setUploadProgress(0);
                    setIsSaving(false);
                }
            );
        } catch (err) {
            setStatus({ text: "❌ Error: " + err.message, type: 'error' });
            setIsSaving(false);
        }
    };

    // -----------------------------------------------------
    // ANNOUNCEMENTS LOGIC
    // -----------------------------------------------------
    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementText.trim()) return setStatus({ text: "Announcement is empty.", type: 'error' });
        
        setIsSaving(true);
        setStatus({ text: "Posting...", type: '' });

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
            
            setStatus({ text: `✅ Announcement posted to ${selectedAssignment.classId}`, type: 'success' });
            setAnnouncementText('');
        } catch (err) {
            setStatus({ text: "❌ Error: " + err.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // -----------------------------------------------------
    // LEAVE REQUESTS LOGIC
    // -----------------------------------------------------
    const handleLeaveAction = async (requestId, action) => {
        setIsSaving(true);
        try {
            const ref = doc(db, 'leaveRequests', requestId);
            await setDoc(ref, { status: action, reviewedAt: new Date().toISOString() }, { merge: true });
            
            // Local update
            setLeaveRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: action } : req));
            setStatus({ text: `Request ${action}`, type: 'success' });
        } catch (err) {
            setStatus({ text: "Error updating request: " + err.message, type: 'error' });
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
        if (state === 'excused') return styles.rowExcused;
        return '';
    };

    const getToggleBtnProps = (state) => {
        if (state === 'present') return { className: `${styles.statusToggleBtn} ${styles.btnPresent}`, text: '✓ Present' };
        if (state === 'absent') return { className: `${styles.statusToggleBtn} ${styles.btnAbsent}`, text: '✕ Absent' };
        if (state === 'late') return { className: `${styles.statusToggleBtn} ${styles.btnLate}`, text: '⏱ Late' };
        if (state === 'excused') return { className: `${styles.statusToggleBtn} ${styles.btnExcused}`, text: '⚖️ Excused' };
        return { className: styles.statusToggleBtn, text: '---' };
    };

    if (loading || !user || user.role !== 'teacher') {
        return (
            <div className={styles.container}>
                <div className={styles.loader}>
                    Loading Command Center...
                </div>
            </div>
        );
    }

    const presentCount = Object.values(attendance).filter(s => s === 'present').length;
    const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
    const lateCount = Object.values(attendance).filter(s => s === 'late').length;
    const excusedCount = Object.values(attendance).filter(s => s === 'excused').length;

    const pendingLeaveRequests = leaveRequests.filter(r => r.status === 'pending');

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Command Center</h1>
                <p>Welcome, Prof. {user.name || user.email.split('@')[0]}</p>
            </header>

            <div className={styles.dashboardGrid}>
                
                {/* Left Panel: Class Selection */}
                <div className={styles.leftPanel}>
                    <h2 className={styles.panelTitle}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Your Classes
                    </h2>
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
                            <div className={styles.placeholderIcon}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                            </div>
                            <h2>Select a class</h2>
                            <p>Choose a class from the left menu to manage attendance, materials, and announcements.</p>
                        </div>
                    ) : (
                        <>
                            {/* Tab Navigation */}
                            <div className={styles.tabNav}>
                                <button className={getTabClass('attendance')} onClick={() => {setActiveTab('attendance'); setStatus({text:'', type:''});}}>📋 Attendance</button>
                                <button className={getTabClass('leaveRequests')} onClick={() => {setActiveTab('leaveRequests'); setStatus({text:'', type:''});}}>
                                    📨 Leave Requests {pendingLeaveRequests.length > 0 && <span className={styles.badge}>{pendingLeaveRequests.length}</span>}
                                </button>
                                <button className={getTabClass('materials')} onClick={() => {setActiveTab('materials'); setStatus({text:'', type:''});}}>📁 Materials</button>
                                <button className={getTabClass('announcements')} onClick={() => {setActiveTab('announcements'); setStatus({text:'', type:''});}}>📢 Announcements</button>
                                <button className={getTabClass('deadlines')} onClick={() => {setActiveTab('deadlines'); setStatus({text:'', type:''});}}>📅 Deadlines</button>
                            </div>

                            <div className={styles.tabContent}>
                                
                                {/* TAB 1: ATTENDANCE */}
                                {activeTab === 'attendance' && (
                                    <div className={styles.attendanceTab}>
                                        <div className={styles.contentHeader}>
                                            <div className={styles.headerLeft}>
                                                <h3>Attendance Record</h3>
                                                <div className={styles.datePickerWrapper}>
                                                    <input 
                                                        type="date" 
                                                        value={attendanceDate}
                                                        onChange={handleDateChange}
                                                        className={styles.datePicker}
                                                    />
                                                </div>
                                            </div>
                                            <div className={styles.batchActions}>
                                                <button onClick={toggleLiveRadar} className={`${styles.batchBtn} ${liveSessionActive ? styles.radarActiveBtn : ''}`}>
                                                    {radarSearching ? '🛰 Acquiring Signal...' : liveSessionActive ? '🛑 End Live Radar' : '🛰 Start Live Radar'}
                                                </button>
                                                <button onClick={() => markAll('present')} className={styles.batchBtn}>All Present</button>
                                                <button onClick={() => markAll('absent')} className={styles.batchBtnAlt}>All Absent</button>
                                                <button onClick={downloadDailyCSV} className={styles.exportBtn}>📥 Download CSV</button>
                                            </div>
                                        </div>

                                        <div className={styles.analyticsBox}>
                                            <h3 style={{marginBottom: '12px', fontSize: '1.2rem', color: 'var(--primary)'}}>📊 Monthly Class Analytics</h3>
                                            <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px'}}>Generate and publish official attendance aggregates natively to student dashboards.</p>
                                            <div style={{display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap'}}>
                                                <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className={styles.datePicker} style={{background: 'var(--bg-main)', flex: 1, minWidth: '150px'}} />
                                                <button className={styles.exportBtn} onClick={downloadMonthlyCSV} disabled={generatingReport}>📥 Export CSV</button>
                                                <button className={styles.publishBtn} onClick={publishMonthlyReport} disabled={generatingReport}>📢 Publish Official Report</button>
                                            </div>
                                        </div>

                                        {liveSessionActive && (
                                            <div className={styles.radarZone}>
                                                <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap'}}>
                                                    <div style={{flex: 1, minWidth: '250px'}}>
                                                        <h4>🛰 Live Geofence Monitoring (15m radius)</h4>
                                                        <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Radar is actively scanning for bio-verified sign-ins.</p>
                                                        <div className={styles.geoVerifiedList}>
                                                            {geoVerifiedStudents.map(student => (
                                                                <div key={student.id} className={styles.geoVerifiedCard}>
                                                                    <div className={styles.geoSelfieWrapper}>
                                                                        {student.photoUrl ? (
                                                                            <img src={student.photoUrl} alt="Liveness Capture" className={styles.geoSelfie} />
                                                                        ) : student.verifiedMath ? (
                                                                            <div className={styles.geoSelfie} style={{display:'flex', alignItems:'center', justifyContent:'center', fontSize: '1.5rem', background:'var(--secondary)', color:'var(--neo)'}}>
                                                                                ⌬
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                    <div className={styles.geoDetails}>
                                                                        <span className={styles.geoName}>{student.studentEmail.split('@')[0]}</span>
                                                                        <span className={styles.geoDistance}>~{Math.round(student.distance)}m away</span>
                                                                    </div>
                                                                    <span className={styles.geoCheckIcon}>{student.verifiedMath ? '🦾 ML Verified' : '✅ Verified'}</span>
                                                                </div>
                                                            ))}
                                                            {geoVerifiedStudents.length === 0 && <div className={styles.geoWaiting}><div className={styles.radarPulse}></div>Waiting for student signals...</div>}
                                                        </div>
                                                    </div>
                                                    <div style={{background: '#fff', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
                                                        <h4 style={{color: '#000', margin: '0 0 16px 0', fontSize: '1.1rem'}}>Scan to Check-in</h4>
                                                        {qrToken && <QRCodeCanvas value={qrToken} size={300} level="H" includeMargin={true} />}
                                                        <p style={{color: '#666', fontSize: '0.8rem', marginTop: '12px', margin: '12px 0 0 0'}}>Dynamic Token (Refreshes every 15s)</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {fetchingData ? (
                                            <div className={styles.loader}>Fetching roster...</div>
                                        ) : students.length > 0 ? (
                                            <div className={styles.attendanceBody}>
                                                
                                                <div className={styles.statsBar}>
                                                    <div className={`${styles.statGroup} ${styles.statTotal}`}>
                                                        <span className={styles.statLabel}>Total Enrolled</span>
                                                        <span className={styles.statValue}>{students.length}</span>
                                                    </div>
                                                    <div className={`${styles.statGroup} ${styles.statPresent}`}>
                                                        <span className={styles.statLabel}>Present</span>
                                                        <span className={styles.statValue}>{presentCount}</span>
                                                    </div>
                                                    <div className={`${styles.statGroup} ${styles.statAbsent}`}>
                                                        <span className={styles.statLabel}>Absent</span>
                                                        <span className={styles.statValue}>{absentCount}</span>
                                                    </div>
                                                    <div className={`${styles.statGroup} ${styles.statLate}`}>
                                                        <span className={styles.statLabel}>Late</span>
                                                        <span className={styles.statValue}>{lateCount}</span>
                                                    </div>
                                                    <div className={`${styles.statGroup} ${styles.statExcused}`}>
                                                        <span className={styles.statLabel}>Excused</span>
                                                        <span className={styles.statValue}>{excusedCount}</span>
                                                    </div>
                                                </div>

                                                <div className={styles.listHeader}>
                                                    <div>Student</div>
                                                    <div style={{ textAlign: 'right' }}>Status</div>
                                                </div>
                                                
                                                <div className={styles.studentList}>
                                                    {students.map((student) => {
                                                        const state = attendance[student.email];
                                                        const btnProps = getToggleBtnProps(state);
                                                        return (
                                                            <div key={student.email} className={`${styles.studentRow} ${getRowClass(state)}`}>
                                                                <div className={styles.studentInfo}>
                                                                    <span className={styles.studentEmail}>{student.email}</span>
                                                                    <span className={styles.studentID}>{student.studentId || 'ID Pending'}</span>
                                                                </div>
                                                                <div className={styles.actionCell}>
                                                                    <button onClick={() => toggleAttendanceState(student.email)} className={btnProps.className}>
                                                                        {btnProps.text}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className={styles.actionFooter}>
                                                    <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.error : status.type === 'success' ? styles.success : ''}`}>
                                                        {status.text}
                                                    </p>
                                                    <button onClick={saveAttendance} disabled={isSaving} className={styles.saveBtn}>
                                                        {isSaving ? 'Saving...' : 'Submit Attendance'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.noData}>
                                                <p>{status.text || 'Select a class to view roster.'}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 2: LEAVE REQUESTS */}
                                {activeTab === 'leaveRequests' && (
                                    <div className={styles.leaveRequestsTab}>
                                        <div className={styles.contentHeader} style={{ marginBottom: '16px' }}>
                                            <h3>Leave Requests for {selectedAssignment.classId}</h3>
                                        </div>
                                        <div className={styles.studentList}>
                                            {leaveRequests.length === 0 ? (
                                                <div className={styles.noData}><p>No leave requests found for this class.</p></div>
                                            ) : (
                                                leaveRequests.map(req => (
                                                    <div key={req.id} className={`${styles.studentRow} ${req.status === 'pending' ? styles.rowPending : ''}`}>
                                                        <div className={styles.studentInfo}>
                                                            <span className={styles.studentEmail}>{req.studentName} <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>({req.studentEmail})</span></span>
                                                            <span className={styles.studentID}>Date: <strong>{req.date}</strong></span>
                                                            <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Reason: "{req.reason}"</p>
                                                        </div>
                                                        <div className={styles.actionCell} style={{ flexDirection: 'column', gap: '8px' }}>
                                                            {req.status === 'pending' ? (
                                                                <>
                                                                    <button onClick={() => handleLeaveAction(req.id, 'approved')} className={`${styles.statusToggleBtn} ${styles.btnPresent}`}>✓ Approve</button>
                                                                    <button onClick={() => handleLeaveAction(req.id, 'rejected')} className={`${styles.statusToggleBtn} ${styles.btnAbsent}`}>✕ Reject</button>
                                                                </>
                                                            ) : (
                                                                <span className={`${styles.statusBadge} ${req.status === 'approved' ? styles.badgeApproved : styles.badgeRejected}`}>
                                                                    {req.status.toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: MATERIALS */}
                                {activeTab === 'materials' && (
                                    <div className={styles.formsTab}>
                                        <h3>Upload Material</h3>
                                        <p className={styles.tabDesc}>Upload directly to <strong>{selectedAssignment.classId}</strong>. Materials are automatically approved.</p>
                                        
                                        <form onSubmit={handleUploadMaterial} className={styles.uploadForm}>
                                            <div className={styles.formGroup}>
                                                <label>Title</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g., Chapter 1 Dynamics Notes" 
                                                    value={uploadTitle}
                                                    onChange={e => setUploadTitle(e.target.value)}
                                                    required
                                                    className={styles.inputField}
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Material Type</label>
                                                <select className={styles.inputField} value={uploadType} onChange={e => setUploadType(e.target.value)}>
                                                    <option value="Notes">📘 Notes</option>
                                                    <option value="PYQ">📜 PYQs</option>
                                                    <option value="Assignment">📝 Assignment</option>
                                                </select>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>File Upload (.pdf)</label>
                                                <div className={styles.fileInputWrapper}>
                                                    <svg className={styles.fileIcon} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                                    <span className={styles.fileText}>
                                                        {uploadFile ? uploadFile.name : 'Click or drag PDF here'}
                                                    </span>
                                                    {!uploadFile && <span className={styles.fileSub}>Max file size: 50MB</span>}
                                                    <input 
                                                        type="file" 
                                                        accept=".pdf" 
                                                        onChange={e => setUploadFile(e.target.files[0])}
                                                        required
                                                        className={styles.fileInput}
                                                    />
                                                </div>
                                            </div>

                                            {uploadProgress > 0 && uploadProgress < 100 && (
                                                <div className={styles.progressContainer}>
                                                    <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }}></div>
                                                </div>
                                            )}

                                            <div className={styles.actionFooter}>
                                                <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.error : status.type === 'success' ? styles.success : ''}`}>
                                                    {status.text}
                                                </p>
                                                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                                                    {isSaving ? 'Uploading...' : 'Upload Material'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* TAB 3: ANNOUNCEMENTS */}
                                {activeTab === 'announcements' && (
                                    <div className={styles.formsTab}>
                                        <h3>Broadcast Announcement</h3>
                                        <p className={styles.tabDesc}>Send an instant notification to all students in <strong>{selectedAssignment.classId}</strong>.</p>
                                        
                                        <form onSubmit={handlePostAnnouncement} className={styles.uploadForm}>
                                            <div className={styles.formGroup}>
                                                <label>Message</label>
                                                <textarea 
                                                    placeholder="Type your announcement here..." 
                                                    value={announcementText}
                                                    onChange={e => setAnnouncementText(e.target.value)}
                                                    required
                                                    rows={6}
                                                    className={styles.inputField}
                                                    style={{ resize: 'vertical' }}
                                                />
                                            </div>

                                            <div className={styles.actionFooter}>
                                                <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.error : status.type === 'success' ? styles.success : ''}`}>
                                                    {status.text}
                                                </p>
                                                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                                                    {isSaving ? 'Sending...' : 'Broadcast'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* TAB 5: DEADLINES */}
                                {activeTab === 'deadlines' && (
                                    <div className={styles.materialsTab} style={{animation: 'fadeInUp 0.4s ease forwards'}}>
                                        <div className={styles.contentHeader}>
                                            <div className={styles.headerLeft}>
                                                <h3>Unified Academic Calendar</h3>
                                                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px'}}>Publish urgency trackers directly to student dashboards.</p>
                                            </div>
                                        </div>
                                        
                                        <div className={styles.uploadSection}>
                                            <h4 style={{marginBottom: '16px'}}>Publish New Deadline</h4>
                                            {status.text && <div className={styles[status.type]}>{status.text}</div>}
                                            
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                                                <input type="text" placeholder="Mission or Exam Title (e.g., Midterm Paper II)" className={styles.inputField} value={deadlineTitle} onChange={e => setDeadlineTitle(e.target.value)} />
                                                <textarea placeholder="Critical Guidelines..." className={styles.inputField} rows={3} value={deadlineDesc} onChange={e => setDeadlineDesc(e.target.value)}></textarea>
                                                <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                                                    <label>Due Date & Time Limit:</label>
                                                    <input type="datetime-local" className={styles.datePicker} value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} />
                                                </div>
                                                <button className={styles.saveBtn} onClick={publishDeadline} disabled={isSaving || !deadlineTitle || !deadlineDate}>
                                                    {isSaving ? 'Broadcasting...' : '📢 Broadcast Target Deadline'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <h4 style={{marginTop: '32px', marginBottom: '16px'}}>Active Urgency Trackers</h4>
                                        <div className={styles.leaveList}>
                                            {deadlines.length > 0 ? deadlines.map(d => (
                                                <div key={d.id} className={styles.leaveCard}>
                                                    <div className={styles.leaveInfo}>
                                                        <strong>{d.title}</strong>
                                                        <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{d.description}</p>
                                                        <span style={{color: 'var(--warning)', fontSize: '0.9rem'}}>⏳ System Lockdown at: {new Date(d.dueDate).toLocaleString()}</span>
                                                    </div>
                                                    <div className={styles.leaveActions}>
                                                        <button className={styles.rejectBtn} onClick={() => deleteDeadline(d.id)}>Abort Deadline</button>
                                                    </div>
                                                </div>
                                            )) : <p className={styles.noData}>Scanning... Sub-system shows zero incoming deadlines.</p>}
                                        </div>
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

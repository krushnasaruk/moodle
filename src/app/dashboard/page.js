'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy, limit, addDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { IconUpload, IconDownload, IconStar, IconFolder, IconNotes, IconPyq, IconAssignment, IconLock, IconCalendar } from '@/components/Icons';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { BRANCHES, YEARS, SEMESTERS, COLLEGES, getSubjects } from '@/lib/subjectMap';
import styles from './page.module.css';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js@0.22.2/weights/';

function getUploadIcon(type) {
    switch (type) {
        case 'Notes': return <IconNotes size={20} />;
        case 'PYQ': return <IconPyq size={20} />;
        case 'Assignment': return <IconAssignment size={20} />;
        default: return <IconFolder size={20} />;
    }
}

function getTypeClass(type) {
    switch (type) {
        case 'Notes': return styles.iconNotes;
        case 'PYQ': return styles.iconPyq;
        case 'Assignment': return styles.iconAssignment;
        default: return styles.iconNotes;
    }
}

function getStatusBadge(status) {
    switch (status) {
        case 'pending': return <span className={styles.statusPending}>⏳ Pending</span>;
        case 'approved': return <span className={styles.statusApproved}>✅ Live</span>;
        case 'rejected': return <span className={styles.statusRejected}>❌ Rejected</span>;
        default: return null;
    }
}

export default function DashboardPage() {
    const { user, updateUserProfile } = useAuth();
    const [uploads, setUploads] = useState([]);
    const [loadingUploads, setLoadingUploads] = useState(true);
    const [editing, setEditing] = useState(false);

    // Profile Edit State
    const [editName, setEditName] = useState('');
    const [editCollege, setEditCollege] = useState('');
    const [editBranch, setEditBranch] = useState('');
    const [editYear, setEditYear] = useState('');
    const [editSemester, setEditSemester] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editTheme, setEditTheme] = useState('purple');
    const [editStudentPhone, setEditStudentPhone] = useState('');
    const [editParentPhone, setEditParentPhone] = useState('');
    const [saving, setSaving] = useState(false);

    // Avatar Upload State
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Class Hub State
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 0 });
    const [announcements, setAnnouncements] = useState([]);
    const [classMaterials, setClassMaterials] = useState([]);
    const [loadingClassData, setLoadingClassData] = useState(false);

    // Gamification & Leave Request State
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [leaveDate, setLeaveDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    const [leaveSubmitting, setLeaveSubmitting] = useState(false);
    const [myLeaveRequests, setMyLeaveRequests] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [currentStreak, setCurrentStreak] = useState(0);

    // Geo-Radar & Camera State
    const [activeLiveSession, setActiveLiveSession] = useState(null);
    const [hasCheckedIn, setHasCheckedIn] = useState(null);
    const [monthlyReports, setMonthlyReports] = useState([]);
    const [showScanner, setShowScanner] = useState(false);
    const [scanStatus, setScanStatus] = useState(''); // 'scanning', 'verifying', 'success', 'error'
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [qrStatus, setQrStatus] = useState('');
    const webcamRef = useRef(null);

    // Deadlines Tracking State
    const [deadlines, setDeadlines] = useState([]);
    const [mySubmissions, setMySubmissions] = useState([]);
    const [submittingAssignment, setSubmittingAssignment] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submissionProgress, setSubmissionProgress] = useState(0);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatCountdown = (targetDateStr) => {
        const diff = new Date(targetDateStr) - now;
        if (diff <= 0) return '🚨 System Locked';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        
        if (days > 0) return `${days}d ${hours}h ${mins}m`;
        return `${hours}h ${mins}m ${secs}s`;
    };

    // Bio-Metric Configuration
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [enrollmentStatus, setEnrollmentStatus] = useState(''); // '', 'loading', 'acquiring', 'success', 'error', 'restart'
    const enrollWebcamRef = useRef(null);

    const loadFaceModels = async () => {
        if (modelsLoaded) return;
        try {
            const faceapi = await import('@vladmandic/face-api');
            window.faceapi = faceapi;
            
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            setModelsLoaded(true);
        } catch(e) {
            console.error("Failed to load models:", e);
        }
    };

    useEffect(() => {
        if (!user) { setLoadingUploads(false); return; }
        let cancelled = false;

        const fetchPersonalUploads = async () => {
            setLoadingUploads(true);
            try {
                if (!db) throw new Error('Firestore not initialized');
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
                const fetchPromise = getDocs(collection(db, 'files'));
                const snapshot = await Promise.race([fetchPromise, timeout]);
                if (cancelled) return;
                const data = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(f => f.uploaderUID === user.uid);
                data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                setUploads(data);
            } catch (error) {
                console.error('Error fetching uploads:', error);
                if (!cancelled) setUploads([]);
            }
            if (!cancelled) setLoadingUploads(false);
        };

        const fetchClassData = async () => {
            if (!user.classId) return;
            setLoadingClassData(true);
            try {
                // 1. Fetch entire attendance for the class to calc personal stats
                const attQuery = query(collection(db, 'attendance'), where('classId', '==', user.classId));
                const attSnap = await getDocs(attQuery);
                let p = 0, a = 0, l = 0, e = 0;
                
                const history = [];

                attSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    let status = null;
                    if (data.presentStudents?.includes(user.email)) { p++; status = 'present'; }
                    else if (data.absentStudents?.includes(user.email)) { a++; status = 'absent'; }
                    else if (data.lateStudents?.includes(user.email)) { l++; status = 'late'; }
                    else if (data.excusedStudents?.includes(user.email)) { e++; status = 'excused'; }

                    if (status) {
                        history.push({ date: data.date, status });
                    }
                });

                history.sort((x, y) => new Date(y.date) - new Date(x.date));
                let streak = 0;
                for (let rec of history) {
                    if (rec.status === 'present') streak++;
                    else if (rec.status === 'excused') continue;
                    else break;
                }

                if (!cancelled) {
                    setAttendanceHistory(history.slice(0, 7)); // Last 7 records
                    setCurrentStreak(streak);
                }

                const total = p + a + l + e;
                const pct = total > 0 ? Math.round(((p + (l * 0.5) + e) / total) * 100) : 0;
                if (!cancelled) setAttendanceStats({ present: p, absent: a, late: l, excused: e, total, percentage: pct });

                // 1.5 Fetch My Leave Requests
                const lrQuery = query(collection(db, 'leaveRequests'), where('studentEmail', '==', user.email));
                const lrSnap = await getDocs(lrQuery);
                const lrList = lrSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                lrList.sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp));
                if (!cancelled) setMyLeaveRequests(lrList);

                // 1.6 Fetch My Submissions
                const subQuery = query(collection(db, 'submissions'), where('studentEmail', '==', user.email));
                const subSnap = await getDocs(subQuery);
                const subList = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (!cancelled) setMySubmissions(subList);

                // 2. Fetch Announcements
                const annQuery = query(collection(db, 'announcements'), where('classId', '==', user.classId));
                const annSnap = await getDocs(annQuery);
                const annList = annSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                annList.sort((x, y) => (y.timestamp || '').localeCompare(x.timestamp || ''));
                if (!cancelled) setAnnouncements(annList);

                // 3. Fetch Class Uploads
                const matQuery = query(collection(db, 'files'), where('classId', '==', user.classId));
                const matSnap = await getDocs(matQuery);
                const matList = matSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                matList.sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''));
                if (!cancelled) setClassMaterials(matList);

            } catch(e) {
                console.error("Error fetching class data:", e);
            }
            if (!cancelled) setLoadingClassData(false);
        };

        fetchPersonalUploads();
        fetchClassData();

        return () => { cancelled = true; };
    }, [user]);

    // Live Session Listener
    useEffect(() => {
        if (!user || !user.classId) {
            return () => {};
        }
        
        const unsub = onSnapshot(doc(db, 'liveSessions', user.classId), (docSnap) => {
            if (docSnap.exists() && docSnap.data().active) {
                setActiveLiveSession(docSnap.data());
            } else {
                setActiveLiveSession(null);
                setShowScanner(false);
            }
        });

        // 1.5 Listen for Live Deadlines
        const unsubDeadlines = onSnapshot(query(collection(db, 'deadlines'), where('classId', '==', user.classId)), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const upcoming = data.filter(d => new Date(d.dueDate) > new Date());
            upcoming.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)); // Most urgent first
            setDeadlines(upcoming);
        });

        return () => {
            unsub();
            unsubDeadlines();
        };
    }, [user]);

    // Check if user has already checked in to the active session
    useEffect(() => {
        if (!activeLiveSession || !user) {
            setHasCheckedIn(null);
            return;
        }
        
        const q = query(
            collection(db, 'liveCheckins'), 
            where('classId', '==', activeLiveSession.classId), 
            where('date', '==', activeLiveSession.date),
            where('studentEmail', '==', user.email)
        );
        const unsub = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                setHasCheckedIn(snap.docs[0].data());
            } else {
                setHasCheckedIn(null);
            }
        });
        return () => unsub();
    }, [activeLiveSession, user]);

    // Listen for Official Monthly Reports
    useEffect(() => {
        if (!user || !user.classId) return;
        const q = query(
            collection(db, 'monthlyReports'),
            where('classId', '==', user.classId)
        );
        const unsub = onSnapshot(q, (snap) => {
            const reports = [];
            snap.forEach(d => reports.push({ id: d.id, ...d.data() }));
            // sort by month descending
            reports.sort((a,b) => b.month.localeCompare(a.month));
            setMonthlyReports(reports);
        });
        return () => unsub();
    }, [user]);

    // Haversine Algorithm
    const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Radius of the earth in m
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
        const d = R * c; 
        return d;
    };

    // Handle check in
    const triggerVerification = () => {
        setShowScanner(true);
        setScanStatus('');
    };

    const handleFacialScanAndGeo = async () => {
        if (!activeLiveSession) return;
        if (!user.faceDescriptor) {
            setScanStatus('error: No biometric data found! Enroll your face in Profile settings first.');
            return;
        }

        setScanStatus('verifying');
        
        if (!webcamRef.current || !webcamRef.current.video) {
            setScanStatus('error: camera disconnected or not rendering'); return;
        }

        try {
            // Load models if not loaded
            if (!modelsLoaded) {
                setScanStatus('loading AI Models (this will take a few seconds)...');
                await loadFaceModels();
                setScanStatus('verifying'); // revert text
            }

            // Extract live descriptor
            const faceapi = window.faceapi;
            const videoEl = webcamRef.current.video;
            const detections = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

            if (!detections) {
                setScanStatus('error: No face detected. Ensure good lighting and look straight at the camera.');
                return;
            }

            // Compare with saved descriptor
            const savedDescriptor = new Float32Array(user.faceDescriptor);
            const liveDescriptor = detections.descriptor;
            const distance = faceapi.euclideanDistance(liveDescriptor, savedDescriptor);

            if (distance > 0.55) { // default is 0.6, 0.55 is a bit stricter
                setScanStatus(`error: Identity mismatch! (Distance: ${distance.toFixed(2)} / limit 0.55)`);
                return;
            }

            // Face verified mathematically! Now do fast Geo.
            if (!navigator.geolocation) {
                setScanStatus('error: Geolocation not supported'); return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    
                    if (accuracy > 40) {
                        setScanStatus(`error: GPS signal too weak (Accuracy: ${Math.round(accuracy)}m). Needs < 40m. Move closer to a window.`);
                        return;
                    }

                    const geoDist = getDistanceFromLatLonInM(
                        latitude, longitude, 
                        activeLiveSession.teacherLat, activeLiveSession.teacherLng
                    );

                    if (geoDist > 15) {
                        setScanStatus(`error: ML Math passed, but you're ${Math.round(geoDist)}m away. Must be < 15m.`);
                        return;
                    }

                    // Fast write to Firebase (No storage blobs overhead!)
                    await addDoc(collection(db, 'liveCheckins'), {
                        classId: activeLiveSession.classId,
                        date: activeLiveSession.date,
                        studentEmail: user.email,
                        studentName: user.name || 'Anonymous',
                        distance: geoDist,
                        verifiedMath: true,
                        timestamp: new Date().toISOString()
                    });

                    setScanStatus('success');
                    setTimeout(() => setShowScanner(false), 2000);
                },
                (error) => {
                    setScanStatus('error: GPS Error: ' + error.message);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );

        } catch (e) {
            setScanStatus('error: ML Engine Failure - ' + e.message);
        }
    };

    // QR Scanning Logic
    const triggerQRScan = () => {
        setShowQRScanner(true);
        setQrStatus('');
    };

    const runQRExtraction = () => {
        if (!showQRScanner) return; // double check

        if (!webcamRef.current || !webcamRef.current.video) {
            requestAnimationFrame(runQRExtraction);
            return;
        }

        const video = webcamRef.current.video;
        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
            });
            
            if (code) {
                try {
                    const payload = JSON.parse(code.data);
                    if (payload.classId === activeLiveSession.classId && payload.date === activeLiveSession.date) {
                        setQrStatus('success');
                        
                        addDoc(collection(db, 'liveCheckins'), {
                            classId: activeLiveSession.classId,
                            date: activeLiveSession.date,
                            studentEmail: user.email,
                            studentName: user.name || 'Anonymous',
                            distance: 0,
                            verifiedMath: true,
                            isQR: true,
                            timestamp: new Date().toISOString()
                        });
                        
                        setTimeout(() => setShowQRScanner(false), 2000);
                        return; // Stop scan loop
                    } else {
                        setQrStatus('error: Invalid QR payload');
                    }
                } catch(e) {
                    // Invalid JSON payload, ignore
                }
            }
        }
        
        requestAnimationFrame(runQRExtraction);
    };

    useEffect(() => {
        if (showQRScanner && qrStatus !== 'success') {
            setQrStatus('scanning');
            const timer = setTimeout(() => {
                requestAnimationFrame(runQRExtraction);
            }, 600); // Give webcam warmup time
            return () => clearTimeout(timer);
        }
    }, [showQRScanner]);

    const startEditing = () => {
        setEditName(user.name || '');
        setEditCollege(user.college || '');
        setEditBranch(user.branch || '');
        setEditYear(user.year || '');
        setEditSemester(user.semester || '');
        setEditBio(user.bio || '');
        setEditTheme(user.themeAccent || 'purple');
        setEditStudentPhone(user.studentPhone || '');
        setEditParentPhone(user.parentPhone || '');
        setAvatarPreview(null);
        setAvatarFile(null);
        setEditing(true);
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPEG, PNG, WebP, etc.)');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB');
            return;
        }
        
        setAvatarFile(file);
        // Create preview
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const uploadAvatar = async () => {
        if (!avatarFile || !user) return null;
        setUploadingAvatar(true);
        try {
            const ext = avatarFile.name.split('.').pop();
            const storageRef = ref(storage, `avatars/${user.uid}.${ext}`);
            await uploadBytes(storageRef, avatarFile);
            const downloadURL = await getDownloadURL(storageRef);
            setUploadingAvatar(false);
            return downloadURL;
        } catch (err) {
            console.error('Avatar upload failed:', err);
            setUploadingAvatar(false);
            return null;
        }
    };

    const enrollBiometrics = async () => {
        setEnrollmentStatus('loading');
        await loadFaceModels();
        setEnrollmentStatus('acquiring');
        
        setTimeout(async () => {
            if (!enrollWebcamRef.current || !enrollWebcamRef.current.video) {
                setEnrollmentStatus('error: Webcam feed missing');
                return;
            }
            try {
                const faceapi = window.faceapi;
                const videoEl = enrollWebcamRef.current.video;
                const detections = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
                
                if (!detections) {
                    setEnrollmentStatus('error: No face clearly visible to compute math.');
                    return;
                }
                
                const descriptorArray = Array.from(detections.descriptor);
                
                await updateDoc(doc(db, 'users', user.uid), {
                    faceDescriptor: descriptorArray
                });
                
                // Locally mutate active user object temporarily until next Auth refresh
                user.faceDescriptor = descriptorArray;
                setEnrollmentStatus('success');
            } catch (err) {
                setEnrollmentStatus('error: ' + err.message);
            }
        }, 1500); 
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const subjects = getSubjects(editBranch, editSemester);
            const profileData = {
                name: editName,
                college: editCollege, branch: editBranch, year: editYear,
                semester: editSemester, subjects: subjects,
                bio: editBio, themeAccent: editTheme,
                studentPhone: editStudentPhone, parentPhone: editParentPhone,
                profileComplete: true,
            };

            // Upload avatar if a new one was selected
            if (avatarFile) {
                const photoURL = await uploadAvatar();
                if (photoURL) {
                    profileData.photoURL = photoURL;
                }
            }

            await updateUserProfile(profileData);
            setAvatarPreview(null);
            setAvatarFile(null);
            setEditing(false);
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const submitLeaveRequest = async (e) => {
        e.preventDefault();
        if (!leaveDate || !leaveReason) return;
        setLeaveSubmitting(true);
        try {
            const newReq = {
                studentEmail: user.email,
                studentName: user.name || 'Anonymous',
                classId: user.classId,
                date: leaveDate,
                reason: leaveReason,
                status: 'pending',
                timestamp: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, 'leaveRequests'), newReq);
            setMyLeaveRequests(prev => [{ id: docRef.id, ...newReq }, ...prev]);
            setLeaveModalOpen(false);
            setLeaveDate('');
            setLeaveReason('');
        } catch (err) {
            console.error("Leave request error", err);
        }
        setLeaveSubmitting(false);
    };

    const handleAssignmentSubmit = async (e, deadline) => {
        e.preventDefault();
        if (!submissionFile) return;
        setSubmittingAssignment(deadline.id);
        
        try {
            const ext = submissionFile.name.split('.').pop();
            const filename = `submissions/${deadline.id}/${user.uid}_${Date.now()}.${ext}`;
            const storageRef = ref(storage, filename);
            const uploadTask = uploadBytesResumable(storageRef, submissionFile);
            
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setSubmissionProgress(prog);
                }, 
                (err) => {
                    console.error('Submission upload error', err);
                    setSubmittingAssignment(null);
                    setSubmissionFile(null);
                }, 
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    const newSub = {
                        deadlineId: deadline.id,
                        studentEmail: user.email,
                        studentName: user.name || 'Anonymous',
                        studentPhone: user.studentPhone || '',
                        parentPhone: user.parentPhone || '',
                        fileUrl: downloadURL,
                        submittedAt: new Date().toISOString()
                    };
                    
                    const docRef = await addDoc(collection(db, 'submissions'), newSub);
                    setMySubmissions(prev => [...prev, { id: docRef.id, ...newSub }]);
                    
                    setSubmittingAssignment(null);
                    setSubmissionFile(null);
                    setSubmissionProgress(0);
                }
            );
        } catch(e) {
            console.error(e);
            setSubmittingAssignment(null);
        }
    };

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div className={`${styles.loginPrompt} glass-panel`}>
                        <div className={styles.loginIcon}><IconLock size={64} /></div>
                        <h2 className={styles.loginTitle}>Sign In Required</h2>
                        <p className={styles.loginText}>Track your uploads, saved notes, and contribution points.</p>
                        <Link href="/login" className={styles.loginBtn}>Authenticate Now</Link>
                    </div>
                </div>
            </div>
        );
    }

    const totalDownloads = uploads.reduce((sum, u) => sum + (u.downloads || 0), 0);
    const availableSemesters = editYear ? (SEMESTERS[editYear] || []) : [];

    const THEME_GRADIENTS = {
        purple: 'linear-gradient(135deg, rgba(30, 30, 40, 0.4) 0%, rgba(138, 43, 226, 0.2) 100%)',
        gold: 'linear-gradient(135deg, rgba(30, 30, 40, 0.4) 0%, rgba(245, 158, 11, 0.2) 100%)',
        neo: 'linear-gradient(135deg, rgba(30, 30, 40, 0.4) 0%, rgba(0, 229, 255, 0.2) 100%)',
        crimson: 'linear-gradient(135deg, rgba(30, 30, 40, 0.4) 0%, rgba(255, 0, 127, 0.2) 100%)'
    };

    const headerStyle = {
        background: THEME_GRADIENTS[user.themeAccent] || THEME_GRADIENTS.purple,
    };

    // --- Gamification Logic ---
    const userPoints = user.points || 0;
    let userLevel = 1;
    let nextLevelPoints = 50;
    
    if (userPoints >= 500) { userLevel = 5; nextLevelPoints = 1000; }
    else if (userPoints >= 250) { userLevel = 4; nextLevelPoints = 500; }
    else if (userPoints >= 100) { userLevel = 3; nextLevelPoints = 250; }
    else if (userPoints >= 50) { userLevel = 2; nextLevelPoints = 100; }

    const prevLevelPoints = userLevel === 1 ? 0 : (userLevel === 2 ? 50 : (userLevel === 3 ? 100 : (userLevel === 4 ? 250 : 500)));
    const levelProgress = Math.min(100, Math.max(0, ((userPoints - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100));

    const earnedBadges = [];
    if (uploads.length >= 1) earnedBadges.push({ icon: '🎓', name: 'First Upload', color: '#3b82f6' });
    if (uploads.length >= 5) earnedBadges.push({ icon: '🔥', name: 'Contributor', color: '#f59e0b' });
    if (totalDownloads >= 100) earnedBadges.push({ icon: '⭐', name: 'Influencer', color: '#8a2be2' });
    if (userLevel >= 3) earnedBadges.push({ icon: '🏆', name: 'Veteran', color: '#ff007f' });

    // Determine ring color
    let ringColor = 'var(--success)';
    if (attendanceStats.percentage < 75) ringColor = 'var(--error)';
    else if (attendanceStats.percentage < 85) ringColor = 'var(--warning)';

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                
                {/* Header UI - Premium Apple Card Style */}
                <div className={`${styles.profileHeader} glass-panel`} style={headerStyle}>
                    <div className={styles.profileAvatar}>
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />
                        ) : (
                            <div className={styles.profileAvatarFallback}>
                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                        <div className={styles.levelBadge}>LVL {userLevel}</div>
                        {/* Camera overlay for avatar change */}
                        <button 
                            className={styles.avatarEditOverlay}
                            onClick={() => { startEditing(); setTimeout(() => fileInputRef.current?.click(), 100); }}
                            title="Change profile photo"
                        >
                            📷
                        </button>
                    </div>
                    <div className={styles.profileInfo}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h1>{user.name}</h1>
                            <div className={styles.pointsBadge}>⭐ {userPoints} LP</div>
                            {user.classId && <div className={styles.pointsBadge} style={{ background: 'var(--primary)', color:'white' }}>📘 {user.classId}</div>}
                        </div>
                        <p>{user.email}</p>
                        {user.bio && <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '500px' }}>"{user.bio}"</p>}
                        
                        <div className={styles.progressContainer}>
                            <div className={styles.progressHeader}>
                                <span>Level {userLevel} Progress</span>
                                <span>{userPoints} / {nextLevelPoints} Points</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${levelProgress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.bentoGrid}>

                    {/* NEW: CLASS HUB TILE */}
                    {user.classId && !loadingClassData && (
                        <div className={`${styles.bentoTile} ${styles.classHubTile} glass-panel`}>
                            <div className={styles.hubHeader}>
                                <div>
                                    <h2 className={styles.sectionTitle} style={{margin:0}}>Class Hub</h2>
                                    <p style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>{user.classId} Dashboard</p>
                                </div>
                            </div>
                            
                            <div className={styles.hubGrid}>
                                
                                {activeLiveSession && (
                                    <div className={styles.liveSessionBanner} style={{ gridColumn: '1 / -1' }}>
                                        <div className={styles.livePulseGeo}></div>
                                        <div>
                                            <h3 style={{margin:0, color:'var(--neo)'}}>Live Radar Check-In Active</h3>
                                            <p style={{margin:0, fontSize:'0.85rem', opacity:0.8}}>Teacher is broadcasting within 15m.</p>
                                        </div>
                                        {hasCheckedIn ? (
                                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 'bold' }}>
                                                ✅ Secured
                                            </div>
                                        ) : (
                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                                                <button onClick={triggerQRScan} className={styles.btnSecondary} style={{padding: '8px 16px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)'}}>📷 Scan QR</button>
                                                <button onClick={triggerVerification} className={styles.btnVerifyGeo}>Bio-Verify</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* OFFICIAL MONTHLY REPORTS */}
                                {monthlyReports.length > 0 && (
                                    <div style={{gridColumn: '1 / -1', marginTop: '16px'}}>
                                        <h3 className={styles.sectionTitle} style={{fontSize:'1rem', color:'var(--text-secondary)', marginBottom: '12px'}}>📜 Official Grade Reports</h3>
                                        <div style={{display:'flex', gap:'16px', overflowX:'auto', paddingBottom:'8px'}}>
                                            {monthlyReports.map(report => {
                                                const myStats = report.studentStats[user.email];
                                                if (!myStats) return null; // Filter out if they weren't in the class that month
                                                
                                                return (
                                                    <div key={report.id} style={{minWidth:'200px', background:'rgba(0,0,0,0.3)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'16px'}}>
                                                        <h4 style={{margin:0, color:'var(--primary)'}}>{report.month}</h4>
                                                        <p style={{margin:'4px 0 12px', fontSize:'0.8rem', color:'var(--text-secondary)'}}>Published by {report.teacherName}</p>
                                                        
                                                        <div style={{display:'flex', alignItems:'flex-end', gap:'8px'}}>
                                                            <span style={{fontSize:'2rem', fontWeight:'900', color: myStats.percentage >= 75 ? 'var(--success)' : myStats.percentage >= 50 ? 'var(--warning)' : 'var(--error)'}}>{myStats.percentage}%</span>
                                                            <span style={{fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'6px'}}>Attendance</span>
                                                        </div>
                                                        <div style={{fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'8px'}}>
                                                            Present: {myStats.present}/{myStats.totalClasses}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ACADEMIC DEADLINES WIDGET */}
                                {deadlines.length > 0 && (
                                    <div style={{gridColumn: '1 / -1', marginTop: '16px'}}>
                                        <h3 className={styles.sectionTitle} style={{fontSize:'1rem', color:'var(--text-secondary)', marginBottom: '12px'}}>📅 Urgent Deadlines & Missions</h3>
                                        <div style={{display:'flex', gap:'16px', overflowX:'auto', paddingBottom:'8px'}}>
                                            {deadlines.map(d => {
                                                const diff = new Date(d.dueDate) - now;
                                                const isCritical = diff < (1000 * 60 * 60 * 24); // Less than 24h

                                                return (
                                                    <div key={d.id} className="glass-panel" style={{
                                                        minWidth: '280px', 
                                                        padding: '16px', 
                                                        borderLeft: isCritical ? '4px solid var(--error)' : '4px solid var(--warning)'
                                                    }}>
                                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                                            <h4 style={{margin:0, color:'var(--primary-light)', fontSize: '1.1rem'}}>{d.title}</h4>
                                                            <div style={{
                                                                background: isCritical ? 'rgba(255,0,0,0.1)' : 'rgba(255, 165, 0, 0.1)', 
                                                                color: isCritical ? 'var(--error)' : 'var(--warning)', 
                                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold'
                                                            }}>
                                                                {formatCountdown(d.dueDate)}
                                                            </div>
                                                        </div>
                                                        <p style={{margin:'8px 0', fontSize:'0.9rem', color:'var(--text-secondary)'}}>{d.description}</p>
                                                        <div style={{fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'12px', borderTop: '1px solid var(--border)', paddingTop: '8px'}}>
                                                            Due limit: {new Date(d.dueDate).toLocaleString()}
                                                        </div>
                                                        {d.maxMarks && (
                                                            <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)'}}>
                                                                <h5 style={{margin: '0 0 8px 0'}}>Assignment (Max {d.maxMarks})</h5>
                                                                {(() => {
                                                                    const mySub = mySubmissions.find(s => s.deadlineId === d.id);
                                                                    if (mySub) {
                                                                        if (mySub.marks !== undefined) {
                                                                            return <div style={{color: 'var(--success)', fontWeight:'bold'}}>✨ Graded: {mySub.marks} / {d.maxMarks}</div>;
                                                                        }
                                                                        return <div style={{color: 'var(--primary)', fontSize:'0.9rem'}}>✅ Submitted. Pending grading.</div>;
                                                                    }
                                                                    if (diff < 0) {
                                                                        return <div style={{color: 'var(--error)'}}>Deadline Missed</div>;
                                                                    }
                                                                    if (submittingAssignment === d.id) {
                                                                        return <div style={{fontSize:'0.85rem'}}>Uploading: {submissionProgress}%</div>;
                                                                    }
                                                                    return (
                                                                        <form onSubmit={(e) => handleAssignmentSubmit(e, d)} style={{display: 'flex', flexDirection:'column', gap: '8px'}}>
                                                                            <input type="file" onChange={(e) => setSubmissionFile(e.target.files[0])} accept=".pdf,.doc,.docx,.zip,.png,.jpg" style={{fontSize: '0.8rem'}} required />
                                                                            <button type="submit" className={styles.saveBtn} style={{padding: '4px 8px', fontSize: '0.8rem', width: 'fit-content'}}>Submit File</button>
                                                                        </form>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Attendance Ring */}
                                <div className={styles.attendanceBox}>
                                    <h3>Live Attendance</h3>
                                    <div className={styles.ringWrapper}>
                                        <svg viewBox="0 0 36 36" className={styles.circularChart}>
                                            <path className={styles.circleBg}
                                                d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            {attendanceStats.total > 0 && (
                                                <path className={styles.circleFill}
                                                    strokeDasharray={`${attendanceStats.percentage}, 100`}
                                                    style={{ stroke: ringColor }}
                                                    d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                            )}
                                        </svg>
                                        <div className={styles.ringText}>
                                            <span className={styles.ringPercent}>{attendanceStats.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className={styles.attStatsRow}>
                                        <div className={styles.attStat}><span style={{color:'var(--success)'}}>P:</span> {attendanceStats.present}</div>
                                        <div className={styles.attStat}><span style={{color:'var(--error)'}}>A:</span> {attendanceStats.absent}</div>
                                        <div className={styles.attStat}><span style={{color:'var(--warning)'}}>L:</span> {attendanceStats.late}</div>
                                        <div className={styles.attStat}><span style={{color:'var(--primary-light)'}}>E:</span> {attendanceStats.excused}</div>
                                    </div>
                                    
                                    {/* Timeline & Streak Module */}
                                    <div className={styles.streakModule}>
                                        <div className={styles.streakBadge}>
                                            🔥 {currentStreak} Day Streak
                                        </div>
                                        {attendanceHistory.length > 0 && (
                                            <div className={styles.timeline}>
                                                {attendanceHistory.slice().reverse().map((rec, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`${styles.timelineDot} ${styles[`dot_${rec.status}`]}`}
                                                        title={`${rec.date}: ${rec.status}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {attendanceStats.percentage < 75 && attendanceStats.total > 0 && (
                                        <p className={styles.attWarning}>⚠️ Warning: Attendance is below 75%.</p>
                                    )}

                                    <button className={styles.btnSecondary} onClick={() => setLeaveModalOpen(true)} style={{ width: '100%', marginTop: '16px' }}>
                                        ✉️ Request Leave
                                    </button>
                                </div>

                                {/* Inbox & Announcements Box */}
                                <div className={styles.announcementsBox}>
                                    <div className={styles.boxTabsContainer}>
                                        <h3>Class Updates</h3>
                                    </div>
                                    
                                    <div className={styles.announcementList}>
                                        {/* Show pending/approved leave requests here seamlessly */}
                                        {myLeaveRequests.length > 0 && (
                                            <div className={styles.leaveRequestsList}>
                                                {myLeaveRequests.map(req => (
                                                    <div key={req.id} className={`${styles.announcementCard} ${styles[`request_${req.status}`]}`}>
                                                        <div className={styles.annMeta}>
                                                            <span className={styles.annTeacher}>Leave Request ({req.date})</span>
                                                            <span className={`${styles.statusPill} ${styles[`pill_${req.status}`]}`}>
                                                                {req.status}
                                                            </span>
                                                        </div>
                                                        <p className={styles.annMessage}>{req.reason}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {announcements.length > 0 ? announcements.map(ann => (
                                            <div key={ann.id} className={styles.announcementCard}>
                                                <div className={styles.annMeta}>
                                                    <span className={styles.annTeacher}>{ann.teacherName}</span>
                                                    <span className={styles.annDate}>
                                                        {new Date(ann.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className={styles.annMessage}>{ann.message}</p>
                                            </div>
                                        )) : (
                                            <div className={styles.emptyAnnouncements}>No announcements yet.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Tile 1: Academic Profile */}
                    <div className={`${styles.bentoTile} ${editing ? styles.editingTile : ''} glass-panel`}>
                        {!editing ? (
                            <div className={styles.profileSection}>
                                <div className={styles.profileSectionHeader}>
                                    <h2 className={styles.sectionTitle}><IconNotes size={24} /> Profile Engine</h2>
                                    <button className={styles.editBtn} onClick={startEditing}>Configure</button>
                                </div>
                                {user.branch ? (
                                    <div className={styles.profileGrid}>
                                        <div className={styles.profileField}><span className={styles.fieldLabel}>Display Name</span><span className={styles.fieldValue}>{user.name || 'Not set'}</span></div>
                                        <div className={styles.profileField}><span className={styles.fieldLabel}>College</span><span className={styles.fieldValue}>{user.college || 'Not set'}</span></div>
                                        <div className={styles.profileField}><span className={styles.fieldLabel}>Branch</span><span className={styles.fieldValue}>{user.branch}</span></div>
                                        <div className={styles.profileField}><span className={styles.fieldLabel}>Year</span><span className={styles.fieldValue}>{user.year}</span></div>
                                        <div className={styles.profileField}><span className={styles.fieldLabel}>Semester</span><span className={styles.fieldValue}>{user.semester}</span></div>
                                    </div>
                                ) : (
                                    <div className={styles.noProfile}>
                                        <p>No academic profile set. <button onClick={startEditing} className={styles.link}>Set it up now →</button></p>
                                    </div>
                                )}
                                {user.subjects && user.subjects.length > 0 && (
                                    <div className={styles.subjectChips}>
                                        {user.subjects.map(s => <span key={s} className={styles.subjectChip}>{s}</span>)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.profileSection}>
                                <h2 className={styles.sectionTitle} style={{marginBottom:'20px'}}>Configure Profile</h2>
                                
                                {/* Avatar Upload Section */}
                                <div className={styles.avatarUploadSection}>
                                    <div className={styles.avatarUploadPreview}>
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Preview" />
                                        ) : user.photoURL ? (
                                            <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className={styles.avatarUploadFallback}>
                                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.avatarUploadControls}>
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleAvatarSelect}
                                            style={{ display: 'none' }}
                                        />
                                        <button 
                                            type="button"
                                            className={styles.avatarUploadBtn}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            📷 {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                                        </button>
                                        <p className={styles.avatarUploadHint}>JPEG, PNG, or WebP · Max 5MB</p>
                                    </div>
                                </div>

                                <div className={styles.editGrid}>
                                    <div className={styles.editField} style={{ gridColumn: '1 / -1' }}>
                                        <label>Display Name</label>
                                        <input type="text" maxLength={40} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" />
                                    </div>
                                    <div className={styles.editField} style={{ gridColumn: '1 / -1' }}>
                                        <label>Short Bio</label>
                                        <input type="text" maxLength={60} value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="e.g. Code wizard & coffee consumer" />
                                    </div>
                                    <div className={styles.editField}>
                                        <label>Student Phone</label>
                                        <input type="tel" value={editStudentPhone} onChange={(e) => setEditStudentPhone(e.target.value)} placeholder="+1234567890" />
                                    </div>
                                    <div className={styles.editField}>
                                        <label>Parent Phone</label>
                                        <input type="tel" value={editParentPhone} onChange={(e) => setEditParentPhone(e.target.value)} placeholder="+1987654321" />
                                    </div>
                                    <div className={styles.editField}>
                                        <label>ID Card Theme</label>
                                        <select value={editTheme} onChange={(e) => setEditTheme(e.target.value)}>
                                            <option value="purple">Midnight Purple</option>
                                            <option value="neo">Neo Cyan</option>
                                            <option value="crimson">Crimson Red</option>
                                            <option value="gold">Royal Gold</option>
                                        </select>
                                    </div>
                                    <div className={styles.editField}>
                                        <label>College</label>
                                        <select value={editCollege} onChange={(e) => setEditCollege(e.target.value)}>
                                            <option value="">Select</option>
                                            {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.editField}>
                                        <label>Branch</label>
                                        <select value={editBranch} onChange={(e) => { setEditBranch(e.target.value); setEditSemester(''); }}>
                                            <option value="">Select</option>
                                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.editField}>
                                        <label>Year</label>
                                        <select value={editYear} onChange={(e) => { setEditYear(e.target.value); setEditSemester(''); }}>
                                            <option value="">Select</option>
                                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.editField}>
                                        <label>Semester</label>
                                        <select value={editSemester} onChange={(e) => setEditSemester(e.target.value)} disabled={!editYear}>
                                            <option value="">Select</option>
                                            {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            
                            <div className={styles.formGroup} style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                                <h3>Secure Biometrics</h3>
                                <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px'}}>
                                    Provide a baseline geometric scan of your face. This mathematical data is required for ultra-fast Live Radar Check-Ins. We extract 128 coordinate points.
                                </p>
                                
                                {user.faceDescriptor && enrollmentStatus === '' ? (
                                    <div style={{color:'var(--success)', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px'}}>
                                        ✅ Biometrics Active
                                        <button type="button" onClick={() => setEnrollmentStatus('restart')} className={styles.btnSecondary} style={{padding:'4px 8px', fontSize:'0.8rem'}}>Re-Enroll</button>
                                    </div>
                                ) : (
                                    <div style={{display:'flex', flexDirection:'column', gap:'12px', background:'rgba(0,0,0,0.3)', padding:'16px', borderRadius:'12px', border:'1px solid rgba(0, 229, 255, 0.3)'}}>
                                        {(enrollmentStatus === 'loading' || enrollmentStatus === 'acquiring' || enrollmentStatus === 'restart') && (
                                            <div style={{width:'100%', height:'200px', borderRadius:'8px', overflow:'hidden', position:'relative'}}>
                                                <Webcam audio={false} ref={enrollWebcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user" }} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                            </div>
                                        )}
                                        
                                        {enrollmentStatus === '' || enrollmentStatus === 'restart' ? (
                                            <button type="button" onClick={enrollBiometrics} className={styles.btnVerifyGeo} style={{width:'100%', margin:0}}>Initialize ML Scanner</button>
                                        ) : enrollmentStatus === 'loading' ? (
                                            <div style={{textAlign:'center', color:'var(--neo)'}}>Downloading AI Math Models (Wait)...</div>
                                        ) : enrollmentStatus === 'acquiring' ? (
                                            <div style={{textAlign:'center', color:'var(--warning)'}}>Extracting 128-point face topography... Hold still.</div>
                                        ) : enrollmentStatus === 'success' ? (
                                            <div style={{textAlign:'center', color:'var(--success)', fontWeight:'bold'}}>✅ Registration Complete! Math embedded.</div>
                                        ) : (
                                            <div style={{textAlign:'center', color:'var(--error)'}}>❌ {enrollmentStatus.split('error: ')[1]} <br/><span style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => setEnrollmentStatus('restart')}>Try Again</span></div>
                                        )}
                                    </div>
                                )}
                            </div>

                                <div className={styles.editActions} style={{marginTop:'30px'}}>
                                    <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
                                    <button className={styles.saveBtn} onClick={saveProfile} disabled={saving || uploadingAvatar}>
                                        {uploadingAvatar ? 'Uploading Photo...' : saving ? 'Saving...' : 'Save Configuration'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tile 2: Stats & Badges */}
                    <div className={`${styles.bentoTile} glass-panel`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Metrics</h2>
                        <div className={styles.bentoStats}>
                            <div className={styles.bentoStatCard}>
                                <div className={styles.statIcon}><IconUpload size={20} /></div>
                                <div>
                                    <div className={styles.bentoStatNum}>{uploads.length}</div>
                                    <div className={styles.bentoStatLabel}>Uploads</div>
                                </div>
                            </div>
                            <div className={styles.bentoStatCard}>
                                <div className={styles.statIcon}><IconDownload size={20} /></div>
                                <div>
                                    <div className={styles.bentoStatNum}>{totalDownloads}</div>
                                    <div className={styles.bentoStatLabel}>Downloads</div>
                                </div>
                            </div>
                        </div>

                        {earnedBadges.length > 0 && (
                            <div style={{ marginTop: 'auto' }}>
                                <h3 className={styles.bentoStatLabel} style={{ marginBottom: '12px' }}>Earned Trophies</h3>
                                <div className={styles.badgesWrapper}>
                                    {earnedBadges.map(badge => (
                                        <div key={badge.name} className={styles.badgeItem} style={{ borderLeftColor: badge.color }}>
                                            <span className={styles.badgeIcon}>{badge.icon}</span>
                                            <span className={styles.badgeName}>{badge.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NEW: Teacher Added Material Tile (if in Roster) */}
                    {user.classId && classMaterials.length > 0 && (
                        <div className={`${styles.bentoTile} ${styles.uploadsTile} glass-panel`}>
                            <h2 className={styles.sectionTitle} style={{color: 'var(--secondary)'}}>📘 Teacher Materials</h2>
                            <p style={{color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem'}}>Curated directly for {user.classId}.</p>
                            <div className={styles.uploadsList}>
                                {classMaterials.map((item) => (
                                    <div key={item.id} className={styles.uploadItem}>
                                        <div className={`${styles.uploadIcon} ${getTypeClass(item.type)}`}>{getUploadIcon(item.type)}</div>
                                        <div className={styles.uploadDetails}>
                                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.uploadTitle} style={{textDecoration: 'none', color: 'inherit'}}>{item.title}</a>
                                            <div className={styles.uploadMeta}>
                                                {item.type} · {item.subject} · Authored By {item.uploaderName}
                                            </div>
                                        </div>
                                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadLink} style={{color: 'var(--secondary)'}}>
                                            <IconDownload size={18} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tile 3: My Uploads */}
                    <div className={`${styles.bentoTile} ${styles.uploadsTile} glass-panel`}>
                        <h2 className={styles.sectionTitle}><IconFolder size={24} /> My Repository</h2>
                        {loadingUploads ? (
                            <div className={styles.emptyState}><div className={styles.emptyText}>Syncing...</div></div>
                        ) : uploads.length === 0 ? (
                            <div className={styles.emptyStateGamified}>
                                <div className={styles.bountyIcon}>🎯</div>
                                <div className={styles.emptyText} style={{ fontSize: '1.25rem', color: '#fff' }}>Bounty Available: First Contributor</div>
                                <div className={styles.emptySub} style={{ margin: '12px 0 24px', opacity: 0.8 }}>
                                    Your personal repository is currently empty. Upload your first PDF to unlock the <strong style={{ color: 'var(--primary-light)' }}>🎓 Foundation</strong> badge and earn <strong style={{ color: 'var(--accent)' }}>50 Points</strong>!
                                </div>
                                <Link href="/upload" className={styles.btnBounty}>
                                    Claim Bounty →
                                </Link>
                            </div>
                        ) : (
                            <div className={styles.uploadsList}>
                                {uploads.map((item) => (
                                    <div key={item.id} className={styles.uploadItem}>
                                        <div className={`${styles.uploadIcon} ${getTypeClass(item.type)}`}>{getUploadIcon(item.type)}</div>
                                        <div className={styles.uploadDetails}>
                                            <div className={styles.uploadTitle}>{item.title}</div>
                                            <div className={styles.uploadMeta}>
                                                {item.type} · {item.subject} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                                                {' · '}{getStatusBadge(item.status)}
                                            </div>
                                        </div>
                                        <div className={styles.uploadStats}>
                                            <span><IconDownload size={14} /> {item.downloads || 0}</span>
                                            <span><IconStar size={14} /> {item.rating || '—'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LEAVE REQUEST MODAL */}
            {leaveModalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setLeaveModalOpen(false); }}>
                    <div className={`${styles.modalContent} glass-panel`}>
                        <h2 style={{ marginBottom: '8px' }}>Request Leave of Absence</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>This request will be sent directly to your teacher for approval.</p>
                        
                        <form onSubmit={submitLeaveRequest}>
                            <div className={styles.formGroup}>
                                <label>Date of Absence</label>
                                <input 
                                    type="date" 
                                    value={leaveDate} 
                                    onChange={e => setLeaveDate(e.target.value)} 
                                    required 
                                    className={styles.inputField} 
                                />
                            </div>
                            <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                                <label>Reason</label>
                                <textarea 
                                    value={leaveReason} 
                                    onChange={e => setLeaveReason(e.target.value)} 
                                    required 
                                    placeholder="Briefly explain your reason (e.g., Medical, Event, Transport Issue)"
                                    className={styles.inputField} 
                                    rows={4} 
                                />
                            </div>
                            
                            <div className={styles.modalActions} style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setLeaveModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.saveBtn} disabled={leaveSubmitting}>
                                    {leaveSubmitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LIVE QR SCANNER MODAL */}
            {showQRScanner && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} ${styles.scannerModal} glass-panel`}>
                        <h2>Scan Teacher's QR</h2>
                        <p style={{marginBottom: '16px', color: 'var(--text-secondary)'}}>Point your camera at the dynamic QR code on the board.</p>
                        
                        <div className={styles.webcamWrapper}>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ facingMode: "environment" }}
                                className={styles.webcamVideo}
                            />
                            {qrStatus === 'scanning' && <div className={styles.scannerLine}></div>}
                        </div>

                        <div className={styles.scanStatusBox}>
                            {qrStatus === 'scanning' && <p style={{color: 'var(--primary-light)'}}>Locating QR Code...</p>}
                            {qrStatus === 'success' && <p style={{color: 'var(--success)', fontWeight:'bold'}}>✅ QR Verified! Checked In.</p>}
                            {qrStatus.startsWith('error') && <p style={{color: 'var(--error)'}}>❌ {qrStatus.split('error: ')[1]}</p>}
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowQRScanner(false)} style={{width: '100%'}}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* LIVE BIO SCANNER MODAL */}
            {showScanner && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} ${styles.scannerModal} glass-panel`}>
                        <h2>Bio-Metric Check-In</h2>
                        <p style={{marginBottom: '16px', color: 'var(--text-secondary)'}}>Scanning face and triangulating coordinates...</p>
                        
                        <div className={styles.webcamWrapper}>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ facingMode: "user" }}
                                className={styles.webcamVideo}
                            />
                            <div className={styles.scannerLine}></div>
                        </div>

                        <div className={styles.scanStatusBox}>
                            {scanStatus === '' && <p>Align face in frame, allow location access, and hold still.</p>}
                            {scanStatus === 'verifying' && <p style={{color: 'var(--warning)'}}>Verifying ML Identity and GPS Math...</p>}
                            {scanStatus === 'success' && <p style={{color: 'var(--success)', fontWeight:'bold'}}>✅ Verified! Lightning Check-In Complete.</p>}
                            {scanStatus.startsWith('loading') && <p style={{color: 'var(--neo)'}}>Downloading Deep Learning weights...</p>}
                            {scanStatus.startsWith('error') && <p style={{color: 'var(--error)'}}>❌ {scanStatus.split('error: ')[1]}</p>}
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowScanner(false)}>Cancel</button>
                            <button 
                                className={styles.saveBtn} 
                                onClick={handleFacialScanAndGeo}
                                disabled={scanStatus === 'verifying' || scanStatus === 'success'}
                                style={{ background: 'var(--neo)', color: '#000', fontWeight: '800' }}
                            >
                                {scanStatus === 'verifying' ? 'Extracting Bio-Data...' : 'Extract Bio-Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function SeedRoster() {
    const { user } = useAuth();
    const [rosterInput, setRosterInput] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const sampleJSON = `[
  {
    "email": "student1@example.com",
    "role": "student",
    "classId": "FY-CS-A"
  },
  {
    "email": "teacher1@example.com",
    "role": "teacher",
    "assignments": [
      { "classId": "FY-CS-A", "subject": "Math" },
      { "classId": "FY-CS-B", "subject": "Math" }
    ]
  }
]`;

    const handleSeed = async () => {
        if (!user) {
            setStatus('You must be logged in!');
            return;
        }

        try {
            setLoading(true);
            setStatus('Parsing JSON...');
            const data = JSON.parse(rosterInput);
            
            if (!Array.isArray(data)) {
                throw new Error("Input must be a JSON array.");
            }

            setStatus(`Processing ${data.length} records...`);
            
            for (let i = 0; i < data.length; i++) {
                const record = data[i];
                if (!record.email) continue;
                
                // Using email as the Document ID for incredibly fast lookups
                const docId = record.email.toLowerCase();
                await setDoc(doc(db, 'roster', docId), record);
                setStatus(`Saved ${i+1}/${data.length}: ${record.email}`);
            }

            setStatus('✅ All records seeded to the roster successfully!');
        } catch (e) {
            setStatus('❌ Error: ' + e.message);
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Roster Management</h1>
                <p>Bulk upload student and teacher assignments via JSON. They will be auto-assigned upon their next login.</p>
            </div>

            {user ? (
                <div className={styles.formSection}>
                    <p className={styles.loginStatus}>✓ Logged in as: {user.email}</p>
                    
                    <div className={styles.splitLayout}>
                        <div className={styles.inputArea}>
                            <label>Paste JSON Array Here:</label>
                            <textarea 
                                value={rosterInput}
                                onChange={(e) => setRosterInput(e.target.value)}
                                placeholder="Paste your JSON here..."
                                className={styles.textarea}
                            />
                            <button 
                                onClick={handleSeed}
                                disabled={loading || !rosterInput}
                                className={styles.button}
                            >
                                {loading ? 'Seeding Database...' : 'Upload Roster'}
                            </button>
                            <p className={styles.status}>{status}</p>
                        </div>
                        
                        <div className={styles.guideArea}>
                            <h3>Format Guide</h3>
                            <pre className={styles.codeBlock}>{sampleJSON}</pre>
                            <p className={styles.note}><b>Note:</b> You can upload students for all 5 classes simultaneously in one large array. Ensure emails are spelled correctly.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <p className={styles.error}>⚠️ You must log in first to use this utility.</p>
            )}
        </div>
    );
}

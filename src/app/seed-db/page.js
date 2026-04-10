'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function SeedDB() {
    const { user } = useAuth();
    const [status, setStatus] = useState('');

    const handleSeed = async () => {
        if (!user) {
            setStatus('You must be logged in!');
            return;
        }

        setStatus('Fetching metadata... (this copies the files to /uploads)');
        try {
            const res = await fetch('/api/seed-files');
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch API res');

            setStatus(`Seeding ${data.metadataList.length} files to Firestore...`);
            
            for (let i = 0; i < data.metadataList.length; i++) {
                const meta = data.metadataList[i];
                meta.uploader = user.name || 'Admin';
                meta.uploaderUID = user.uid;
                meta.uploaderEmail = user.email;
                await addDoc(collection(db, 'files'), meta);
                setStatus(`Seeded ${i+1}/${data.metadataList.length}: ${meta.title}`);
            }

            setStatus('All files bifurcated and inserted successfully! You can verify in Notes, PYQs, and Assignments pages.');
        } catch (e) {
            setStatus('Error: ' + e.message);
            console.error(e);
        }
    };

    return (
        <div style={{ padding: '40px', marginTop: '100px', background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-primary)' }}>
            <h1 style={{fontSize: '2rem', marginBottom: '1rem'}}>Secret Admin Seed Tool</h1>
            <p style={{marginBottom: '2rem'}}>Use this page to magically move all BEE and IKS files to your database.</p>
            {user ? (
                <>
                    <p style={{color: 'green', marginBottom: '1rem'}}>✓ Logged in as {user.email}</p>
                    <button 
                        onClick={handleSeed}
                        style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Start Seeding Database
                    </button>
                    <p style={{ marginTop: '20px', fontFamily: 'monospace' }}>{status}</p>
                </>
            ) : (
                <p style={{color: 'red'}}>⚠️ You must go to the Login page and sign in first.</p>
            )}
        </div>
    );
}

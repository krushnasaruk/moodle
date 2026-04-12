import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Handles the download point logic:
 * 1. Increments the download count of the file.
 * 2. Awards points to the uploader if a different user is downloading.
 * 
 * @param {string} fileId - The ID of the file being downloaded
 * @param {string} uploaderUID - The UID of the person who uploaded the file
 * @param {string} currentUserUID - The UID of the person currently downloading
 */
export const awardDownloadPoints = async (fileId, uploaderUID, currentUserUID) => {
    if (!db || !fileId) return;

    try {
        // 1. Increment file download count
        const fileRef = doc(db, 'files', fileId);
        await updateDoc(fileRef, {
            downloads: increment(1)
        });

        // 2. Award points to uploader (if it's not a self-download)
        if (uploaderUID && uploaderUID !== currentUserUID) {
            const uploaderRef = doc(db, 'users', uploaderUID);
            await updateDoc(uploaderRef, {
                points: increment(10) // 10 points per community download
            });
        }
    } catch (error) {
        console.warn('Point award failed:', error.message);
    }
};

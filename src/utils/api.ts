import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function submitData(data: any): Promise<{ success: boolean; message?: string }> {
    try {
        // Determine collection based on data type
        let collectionName = 'submissions';
        if (data.type === 'waitlist') collectionName = 'waitlist';
        else if (data.type === 'contact') collectionName = 'contact';
        else if (data.type === 'idea') collectionName = 'ideas';

        const payload = {
            ...data,
            timestamp: serverTimestamp()
        };

        // Remove 'action' if present as it was for the Cloud Function
        if ('action' in payload) delete payload.action;

        // Direct write to Firestore to bypass HTTPS 403 Forbidden issues
        await addDoc(collection(db, collectionName), payload);

        return { success: true };
    } catch (error: any) {
        console.error("Submission Error (Firestore):", error);
        // Fallback for user friendliness
        throw new Error(error.message || "Failed to submit form. Please check your connection.");
    }
}

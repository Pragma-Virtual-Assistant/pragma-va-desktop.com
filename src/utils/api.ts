export async function submitData(data: any): Promise<{ success: boolean; message?: string }> {
    // Uses Firebase Cloud Function
    const firebaseUrl = import.meta.env.VITE_API_BASE_URL;

    if (!firebaseUrl) {
        console.warn("No API URL configured (VITE_API_BASE_URL)");
        // Simulate success in dev mode if nothing configured
        return { success: true, message: 'Simulated Success' };
    }

    try {
        const response = await fetch(firebaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                action: 'submit' // Explicit action for Cloud Function routing 
            }),
        });

        const text = await response.text();
        let result: any;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse API response as JSON. Raw response (first 200 chars):", text.substring(0, 200));
            throw new Error(`Invalid API response format (HTML returned? Check logs).`);
        }

        if (!response.ok || result.result === 'error') {
            throw new Error(result.message || 'Submission failed');
        }

        return { success: true };
    } catch (error: any) {
        console.error("Submission Error:", error);
        throw error;
    }
}

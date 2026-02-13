export async function submitData(data: any): Promise<{ success: boolean; message?: string }> {
    try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok || result.result === 'error') {
            throw new Error(result.message || 'Submission failed');
        }

        return { success: true, message: result.message };
    } catch (error: any) {
        console.error("API Error:", error);
        throw new Error(error.message || "Failed to communicate with server. Please check your connection.");
    }
}

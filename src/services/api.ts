const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Call {
    callSid: string;
    from: string;
    transcript?: any[]; // Allow array of TranscriptLine
    analysis?: {
        urgency: 'critical' | 'urgent' | 'stable';
        confidence: number;
        symptoms: string[];
        patientType: string;
        summary: string;
        keywords: string[];
        recommendedActions: string[];
    };
    timestamp: Date;
    status: string;
    duration?: number;
    dispatchedAmbulance?: string;
    notes?: string;
}

export const callsApi = {
    async getAllCalls(): Promise<Call[]> {
        try {
            const response = await fetch(`${API_URL}/api/calls`);
            const data = await response.json();
            return data.calls || [];
        } catch (error) {
            console.error('Error fetching calls:', error);
            return [];
        }
    },

    async getCall(callSid: string): Promise<Call | null> {
        try {
            const response = await fetch(`${API_URL}/api/calls/${callSid}`);
            const data = await response.json();
            return data.call || null;
        } catch (error) {
            console.error('Error fetching call:', error);
            return null;
        }
    },

    async updateCall(callSid: string, updates: Partial<Call>): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/api/calls/${callSid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error updating call:', error);
            return false;
        }
    },

    async createCall(call: Partial<Call>): Promise<Call | null> {
        try {
            const response = await fetch(`${API_URL}/api/calls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(call)
            });
            const data = await response.json();
            return data.call || null;
        } catch (error) {
            console.error('Error creating call:', error);
            return null;
        }
    }
};

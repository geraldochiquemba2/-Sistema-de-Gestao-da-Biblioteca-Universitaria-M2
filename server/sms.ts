import { log } from "./vite";

const ECSEND_API_KEY = process.env.ECSEND_API_KEY;
const ECSEND_BASE_URL = "https://api.ecsend.com/api/v1"; // Assuming v1 based on typical APIs, but will check documentation if available or use generic endpoint

interface SmsResponse {
    success: boolean;
    message: string;
    data?: any;
}

export async function sendSMS(to: string, message: string): Promise<SmsResponse> {
    if (!ECSEND_API_KEY) {
        console.warn("ECSEND_API_KEY not found. SMS sending disabled.");
        return { success: false, message: "API key not configured" };
    }

    try {
        // Basic validation for Angolan numbers if needed, but the API might handle it.
        // Ecsend likely expects international format without + or with +. 
        // Let's ensure it starts with optimal format. 
        // If 'to' is '923...', prepend '244'.
        let recipient = to.replace(/\s+/g, '');
        if (recipient.startsWith("9") && recipient.length === 9) {
            recipient = "244" + recipient;
        }

        // Using fetch to send request
        const response = await fetch(`${ECSEND_BASE_URL}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ECSEND_API_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                recipient: recipient,
                message: message,
                sender_id: "Biblioteca" // Optional, often customizable
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`Ecsend API Error: ${response.status} - ${errorData}`);
            return { success: false, message: `Failed to send SMS: ${response.statusText}` };
        }

        const data = await response.json();
        return { success: true, message: "SMS sent successfully", data };

    } catch (error: any) {
        console.error("Error sending SMS:", error);
        return { success: false, message: error.message || "Internal server error" };
    }
}

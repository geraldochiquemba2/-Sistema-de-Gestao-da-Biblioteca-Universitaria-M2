import { log } from "./vite";

const ECSEND_API_KEY = process.env.ECSEND_API_KEY?.trim();
const ECSEND_BASE_URL = "https://ecsend.paysgator.com/api/v1";

interface SmsResponse {
    success: boolean;
    message: string;
    data?: any;
}

export async function sendSMS(to: string, message: string): Promise<SmsResponse> {
    if (!ECSEND_API_KEY) {
        console.warn("[SMS] ECSEND_API_KEY not found. SMS sending disabled.");
        return { success: false, message: "API key not configured" };
    }

    try {
        // Ecsend expects international format (e.g., +244...)
        let recipient = to.replace(/[\s\-\(\)]/g, '');
        if (recipient.startsWith("9") && recipient.length === 9) {
            recipient = "+244" + recipient;
        } else if (recipient.startsWith("244")) {
            recipient = "+" + recipient;
        }

        console.log(`[SMS] Attempting to send SMS to: ${recipient}`);

        const payload = {
            to: recipient,
            text: message,
            senderId: "" // Empty string often defaults to provider-managed numeric ID
        };

        console.log(`[SMS] Payload: ${JSON.stringify(payload)}`);

        const response = await fetch(`${ECSEND_BASE_URL}/sms/send`, {
            method: "POST",
            headers: {
                "X-Api-Key": ECSEND_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log(`[SMS] API Response Status: ${response.status}`);
        console.log(`[SMS] API Response Body: ${responseText}`);

        if (!response.ok) {
            console.error(`[SMS] Ecsend API Error: ${response.status} - ${responseText}`);
            return { success: false, message: `Failed to send SMS: ${response.status} ${response.statusText}` };
        }

        try {
            const data = JSON.parse(responseText);
            return { success: true, message: "SMS sent successfully", data };
        } catch (e) {
            return { success: true, message: "SMS sent but response was not JSON", data: responseText };
        }

    } catch (error: any) {
        console.error("[SMS] Error sending SMS:", error);
        return { success: false, message: error.message || "Internal server error" };
    }
}

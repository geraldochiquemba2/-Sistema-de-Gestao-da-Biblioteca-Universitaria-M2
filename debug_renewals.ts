
import { storage } from "./server/storage";

async function debug() {
    const requests = await storage.getAllRenewalRequests();
    console.log("All Renewal Requests:");
    requests.forEach(r => {
        console.log(`ID: ${r.id}, LoanID: ${r.loanId}, Status: ${r.status}, UserID: ${r.userId}`);
    });

    const pending = requests.filter(r => r.status === "pending");
    console.log(`\nPending Requests: ${pending.length}`);
}

debug().catch(console.error);

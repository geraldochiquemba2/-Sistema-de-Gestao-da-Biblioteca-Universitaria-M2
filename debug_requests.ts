
import { db } from "./server/db";
import { loanRequests } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkRequests() {
    console.log("Checking loan requests in database...");
    const allRequests = await db.select().from(loanRequests);

    console.log(`Total requests found: ${allRequests.length}`);

    allRequests.forEach(r => {
        console.log(`- Request ID: ${r.id}, User: ${r.userId}, Book: ${r.bookId}, Status: ${r.status}, Date: ${r.requestDate}`);
    });

    process.exit(0);
}

checkRequests().catch(console.error);

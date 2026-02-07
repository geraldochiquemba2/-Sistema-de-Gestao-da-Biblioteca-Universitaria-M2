import cron from "node-cron";
import { storage } from "./storage";
import { sendEmail } from "./email";
import { addDays, isBefore, differenceInDays } from "date-fns";

const FINE_AMOUNT_PER_DAY = 500; // 500 Kz
const MAX_FINE_FOR_BLOCK = 2000; // 2000 Kz blocks user

export function startCronJobs() {
    console.log("⏰ Cron Service: Started. Schedule: Daily at 00:00");

    // Run every day at midnight (00:00)
    cron.schedule("0 0 * * *", async () => {
        console.log("⏰ Running daily fine check and notification job...");
        try {
            await checkOverdueLoans();
        } catch (error) {
            console.error("❌ Error in daily cron job:", error);
        }
    });
}

async function checkOverdueLoans() {
    const activeLoans = await storage.getActiveLoans();
    const now = new Date();

    console.log(`🔍 Checking ${activeLoans.length} active loans for overdue status...`);

    for (const loan of activeLoans) {
        const dueDate = new Date(loan.dueDate);

        // Check if overdue
        if (isBefore(dueDate, now)) {
            const daysOverdue = differenceInDays(now, dueDate);

            if (daysOverdue > 0) {
                const fineAmount = daysOverdue * FINE_AMOUNT_PER_DAY;

                console.log(`⚠️ Loan ${loan.id} is overdue by ${daysOverdue} days. Fine: ${fineAmount} Kz`);

                // Create or Update Fine
                // Note: In a real system we might update an existing pending fine or create a new one.
                // For simplicity here, we'll check if a pending fine exists for this loan
                // Ideally existing fine logic should be robust (e.g., getFineByLoanId)
                // Since storage interface doesn't have getFineByLoanId, we might need to add it or fetch all fines for user

                // For this iteration, let's just log and send email to avoid duplicating fines indiscriminately 
                // without a proper check. 
                // Improvement: We will implement storage.getFineByLoanId later.

                const user = await storage.getUser(loan.userId);
                const book = await storage.getBook(loan.bookId);

                if (user && book) {
                    // Send Overdue Email
                    await sendOverdueAlert(user, book, daysOverdue, fineAmount);

                    // Check for blocking
                    // This is a simplification. Real blocking should check TOTAL unpaid fines.
                    if (fineAmount >= MAX_FINE_FOR_BLOCK) {
                        if (user.isActive) {
                            console.log(`🚫 Blocking user ${user.name} due to high fines.`);
                            await storage.updateUser(user.id, { isActive: false });
                        }
                    }
                }
            }
        } else {
            // Check if due tomorrow (for warning)
            const tomorrow = addDays(now, 1);
            if (differenceInDays(dueDate, now) === 1) {
                const user = await storage.getUser(loan.userId);
                const book = await storage.getBook(loan.bookId);
                if (user && book) {
                    await sendDueSoonAlert(user, book);
                }
            }
        }
    }
}

async function sendOverdueAlert(user: any, book: any, days: number, fine: number) {
    if (!user.email) return;

    await sendEmail({
        to: user.email,
        subject: `⚠️ AVISO: Empréstimo Atrasado - ${book.title}`,
        text: `Olá ${user.name},\n\nO livro "${book.title}" está atrasado em ${days} dias.\nMulta acumulada até agora: ${fine} Kz.\n\nPor favor, devolva o livro o mais rápido possível para evitar bloqueio.`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: red;">Empréstimo Atrasado!</h2>
                <p>Olá <strong>${user.name}</strong>,</p>
                <p>O livro <strong>${book.title}</strong> deveria ter sido devolvido há <strong>${days} dias</strong>.</p>
                <p style="font-size: 1.1em; font-weight: bold;">Multa Atual: <span style="color: red;">${fine} Kz</span></p>
                <p>Por favor, devolva-o imediatamente na biblioteca.</p>
            </div>
        `
    });
}

async function sendDueSoonAlert(user: any, book: any) {
    if (!user.email) return;

    await sendEmail({
        to: user.email,
        subject: `📅 Lembrete de Devolução - ${book.title}`,
        text: `Olá ${user.name},\n\nLembrete: O livro "${book.title}" vence amanhã.\nDevolva ou renove para evitar multas.`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Lembrete de Devolução</h2>
                <p>Olá <strong>${user.name}</strong>,</p>
                <p>O livro <strong>${book.title}</strong> tem devolução prevista para <strong>AMANHÃ</strong>.</p>
                <p>Evite multas devolvendo no prazo ou solicitando renovação pelo sistema.</p>
            </div>
        `
    });
}

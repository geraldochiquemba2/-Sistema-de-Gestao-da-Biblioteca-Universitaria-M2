import nodemailer from "nodemailer";

// Interface for email message
interface MailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

// Create a transporter
// If environment variables are set, use them (Production/Gmail/Outlook)
// Otherwise, create an Ethereal account (Development/Free)
let transporter: nodemailer.Transporter;

async function createTransporter() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Production / SMTP
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || "smtp.gmail.com",
            port: parseInt(process.env.EMAIL_PORT || "587"),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        console.log(`📧 Email Service: Configured with SMTP (${process.env.EMAIL_HOST || "smtp.gmail.com"})`);
    } else {
        // Development / Ethereal
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log("📧 Email Service: Configured with Ethereal (Dev Mode)");
            console.log(`   User: ${testAccount.user}`);
            console.log(`   Pass: ${testAccount.pass}`);
        } catch (error) {
            console.error("❌ Failed to create Ethereal account:", error);
        }
    }
}

// Initialize the transporter
createTransporter();

/**
 * Send an email
 */
export async function sendEmail({ to, subject, text, html }: MailOptions) {
    if (!transporter) {
        await createTransporter();
    }

    try {
        const info = await transporter.sendMail({
            from: '"Biblioteca ISPTEC" <noreply@biblioteca.isptec.co.ao>', // sender address
            to,
            subject,
            text,
            html,
        });

        console.log("📨 Email sent: %s", info.messageId);

        // If using Ethereal, log the preview URL
        if (nodemailer.getTestMessageUrl(info)) {
            console.log("👀 Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
}

/**
 * Send Loan Confirmation Email
 */
export async function sendLoanConfirmation(user: any, book: any, dueDate: Date) {
    if (!user.email) return;

    const formattedDate = new Date(dueDate).toLocaleDateString("pt-PT");

    await sendEmail({
        to: user.email,
        subject: "📚 Confirmação de Empréstimo - Biblioteca ISPTEC",
        text: `Olá ${user.name},\n\nVocê realizou o empréstimo do livro "${book.title}".\nData de devolução: ${formattedDate}.\n\nBoa leitura!`,
        html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Confirmação de Empréstimo</h2>
        <p>Olá <strong>${user.name}</strong>,</p>
        <p>Confirmamos o empréstimo do seguinte livro:</p>
        <ul>
          <li><strong>Livro:</strong> ${book.title}</li>
          <li><strong>Autor:</strong> ${book.author}</li>
          <li><strong>Data de Devolução:</strong> ${formattedDate}</li>
        </ul>
        <p>Fique atento ao prazo para evitar multas.</p>
        <p><em>Biblioteca ISPTEC</em></p>
      </div>
    `,
    });
}

/**
 * Send Renewal Request Alert (To Admins)
 * In a real app, you might fetch all admins. For now, we'll log or send to a fixed admin email if configured.
 */
export async function sendRenewalRequestAlert(user: any, book: any, loan: any) {
    // Ideally user.email would be the admin's email, or we have a configured ADMIN_EMAIL
    // For this demo, let's assume we send a copy to the user saying "Request Received"
    if (!user.email) return;

    await sendEmail({
        to: user.email,
        subject: "🔄 Solicitação de Renovação Recebida",
        text: `Olá ${user.name},\n\nRecebemos seu pedido de renovação para o livro "${book.title}".\nAguarde a aprovação do administrador.`,
        html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Solicitação Recebida</h2>
          <p>Olá <strong>${user.name}</strong>,</p>
          <p>Seu pedido de renovação para o livro <strong>${book.title}</strong> foi registrado.</p>
          <p>Status: <span style="color: orange;">Pendente de Aprovação</span></p>
          <p>Você será notificado assim que o administrador processar seu pedido.</p>
        </div>
      `,
    });
}

/**
 * Send Renewal Decision Email
 */
export async function sendRenewalDecision(user: any, book: any, approved: boolean, newDueDate?: Date) {
    if (!user.email) return;

    const subject = approved ? "✅ Renovação Aprovada - Biblioteca ISPTEC" : "❌ Renovação Rejeitada - Biblioteca ISPTEC";
    const formattedDate = newDueDate ? new Date(newDueDate).toLocaleDateString("pt-PT") : "";

    const htmlContent = approved
        ? `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: green;">Renovação Aprovada!</h2>
        <p>Olá <strong>${user.name}</strong>,</p>
        <p>Seu pedido de renovação para o livro <strong>${book.title}</strong> foi aprovado.</p>
        <p><strong>Nova Data de Devolução:</strong> ${formattedDate}</p>
        <p>Boa leitura!</p>
      </div>
    `
        : `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: red;">Renovação Rejeitada</h2>
        <p>Olá <strong>${user.name}</strong>,</p>
        <p>Infelizmente, seu pedido de renovação para o livro <strong>${book.title}</strong> não pôde ser aprovado neste momento.</p>
        <p>Por favor, devolva o livro na data original ou entre em contato com a biblioteca.</p>
      </div>
    `;

    const textContent = approved
        ? `Olá ${user.name},\n\nSua renovação para "${book.title}" foi aprovada.\nNova data: ${formattedDate}.`
        : `Olá ${user.name},\n\nSua renovação para "${book.title}" foi rejeitada.\nPor favor, devolva o livro.`;

    await sendEmail({
        to: user.email,
        subject,
        text: textContent,
        html: htmlContent,
    });
}

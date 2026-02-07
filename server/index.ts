import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { startCronJobs } from "./cron";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Check if database needs seeding
  try {
    const adminEmail = "admin@isptec.co.ao";
    const [existingAdmin] = await storage.getUserByUsername(adminEmail)
      .then(u => u ? [u] : [])
      .catch(() => []); // Fallback if getUserByUsername only returns one

    // Check by email differently if needed or just assume username search needs simple fix
    // To be safe, let's get all users and find the admin
    const allUsers = await storage.getAllUsers();
    const adminUser = allUsers.find(u => u.email === adminEmail);

    if (!adminUser) {
      log("Seeding default admin user...");
      const adminData = {
        username: adminEmail, // username must match email for this auth system
        password: "123456789",
        name: "Administrador",
        email: adminEmail,
        userType: "admin" as const,
        isActive: true,
      };

      const parsedData = insertUserSchema.parse(adminData);
      await storage.createUser(parsedData);
      log("Default admin user created successfully.");
    } else if (adminUser.username !== adminEmail) {
      // Fix mismatch if user exists but has wrong username (e.g. 'admin' vs 'admin@isptec.co.ao')
      log("Fixing admin username mismatch...");
      await storage.updateUser(adminUser.id, { username: adminEmail });
      log("Admin username fixed.");
    }

    // Force reset password for the specific user reporting issues
    const problematicEmail = "20230043@isptec.co.ao";
    const problematicUser = allUsers.find(u => u.username === problematicEmail || u.email === problematicEmail);
    if (problematicUser) {
      log(`Resetting password for ${problematicEmail}...`);
      await storage.updateUser(problematicUser.id, {
        password: "123456",
        name: "Geraldo Abreu Leão Chiquemba"
      });
      log("Password and name fixed successfully.");
    }

    // Cleanup test data artifacts (Test Book, Test Student) if they exist
    const testBookName = "Test Book";
    const testBooks = await storage.searchBooks(testBookName);
    for (const book of testBooks) {
      if (book.title.includes("Test Book")) {
        log(`Cleaning up test book: ${book.title}...`);
        const bookLoans = await storage.getLoansByBook(book.id);
        for (const loan of bookLoans) {
          await storage.deleteLoan(loan.id);
        }
        await storage.deleteBook(book.id);
        log("Test book deleted.");
      }
    }

    // Cleanup Test Student if exists
    const testStudentName = "Test Student";
    // We don't have searchUsers, so filter manually
    const testStudent = allUsers.find(u => u.name === testStudentName || u.username.includes("test.com"));
    if (testStudent) {
      log(`Cleaning up test student: ${testStudent.name}...`);
      // Check if they have loans (should be gone if they only had test book loans, but check anyway)
      const userLoans = await storage.getLoansByUser(testStudent.id);
      for (const loan of userLoans) {
        await storage.deleteLoan(loan.id);
      }
      // We might need to delete fines too if they exist, but let's try deleteUser
      try {
        await storage.deleteUser(testStudent.id);
        log("Test student deleted.");
      } catch (e) {
        log("Could not delete test student (likely has other dependencies like fines). Skipping.");
      }
    }

  } catch (err: any) {
    log(`Error ensuring default user: ${err.message}`);
  }

  // Start Cron Jobs
  startCronJobs();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

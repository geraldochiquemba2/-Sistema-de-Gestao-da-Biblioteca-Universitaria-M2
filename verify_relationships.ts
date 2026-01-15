
import { storage } from "./server/storage.js";
import type { InsertUser, InsertBook, InsertCategory, InsertLoan } from "./shared/schema.js";

async function verify() {
    console.log("Starting verification of relationships...");

    try {
        // 1. Create a Category
        console.log("Creating Category...");
        const category = await storage.createCategory({
            name: "Test Category " + Date.now(),
            description: "A test category",
        });
        console.log("Category created:", category.id);

        // 2. Create a Book
        console.log("Creating Book...");
        const book = await storage.createBook({
            title: "Test Book " + Date.now(),
            author: "Test Author",
            isbn: "123456789" + Math.floor(Math.random() * 1000),
            publisher: "Test Publisher",
            yearPublished: 2024,
            categoryId: category.id,
            department: "engenharia",
            tag: "white",
            totalCopies: 5,
            availableCopies: 5,
            description: "A test book",
            coverImage: "",
        });
        console.log("Book created:", book.id);

        // 3. Create a Student User
        console.log("Creating Student...");
        const student = await storage.createUser({
            username: "student_" + Date.now(),
            password: "password123",
            name: "Test Student",
            email: "student_" + Date.now() + "@test.com",
            userType: "student",
            isActive: true,
        });
        console.log("Student created:", student.id);

        // 4. Create a Loan (Student borrows Book)
        console.log("Creating Loan...");
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const loan = await storage.createLoan({
            userId: student.id,
            bookId: book.id,
            loanDate: new Date(),
            dueDate: dueDate,
            status: "active",
            renewalCount: 0,
        });
        console.log("Loan created:", loan.id);

        // 5. Verify Loan retrieval
        console.log("Verifying Loan retrieval...");
        const retrievedLoan = await storage.getLoan(loan.id);
        if (!retrievedLoan) throw new Error("Loan not found!");

        if (retrievedLoan.userId !== student.id) throw new Error("Loan user mismatch!");
        if (retrievedLoan.bookId !== book.id) throw new Error("Loan book mismatch!");

        console.log("✅ SUCCESS: All relationships verified successfully.");
        console.log(`Student ${student.name} (ID: ${student.id}) successfully borrowed '${book.title}' (ID: ${book.id}).`);

    } catch (error) {
        console.error("❌ FAILED: Verification failed", error);
        process.exit(1);
    }
}

verify();

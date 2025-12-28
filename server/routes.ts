import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookSchema, insertUserSchema, insertLoanSchema, insertReservationSchema, insertFineSchema, insertCategorySchema } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

// Business rules constants
const LOAN_RULES = {
  teacher: {
    maxBooks: 4,
    loanDays: 15,
    dailyBookDays: 1,
  },
  student: {
    maxBooks: 2,
    loanDays: 5,
    dailyBookDays: 1,
  },
  staff: {
    maxBooks: 2,
    loanDays: 5,
    dailyBookDays: 1,
  },
};

const TAG_LOAN_DAYS = {
  red: 0, // Cannot be loaned (library use only)
  yellow: 1,
  white: 5,
};

const FINE_AMOUNT_PER_DAY = 500; // 500 Kz
const MAX_FINE_FOR_LOAN = 2000; // >= 2000 Kz blocks new loans
const MAX_RENEWALS = 2;
const MAX_RESERVATIONS_PER_USER = 3;
const RESERVATION_PICKUP_HOURS = 48;

// Helper functions
function calculateDueDate(userType: string, bookTag: string): Date {
  const now = new Date();
  let days = 0;

  if (bookTag === "red") {
    return now; // Cannot be loaned
  }

  // Tag overrides user type
  if (bookTag === "yellow") {
    days = TAG_LOAN_DAYS.yellow; // Always 1 day for yellow tag
  } else if (bookTag === "white") {
    // White tag uses user-specific loan period
    if (userType === "teacher") {
      days = LOAN_RULES.teacher.loanDays; // 15 days
    } else {
      days = LOAN_RULES.student.loanDays; // 5 days
    }
  }

  now.setDate(now.getDate() + days);
  return now;
}

function calculateFine(dueDate: Date, returnDate: Date): { amount: number; daysOverdue: number } {
  const overdueDays = Math.floor((returnDate.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
  if (overdueDays <= 0) {
    return { amount: 0, daysOverdue: 0 };
  }
  return {
    amount: overdueDays * FINE_AMOUNT_PER_DAY,
    daysOverdue: overdueDays,
  };
}

async function getUserTotalFines(userId: string): Promise<number> {
  const fines = await storage.getFinesByUser(userId);
  const pendingFines = fines.filter(f => f.status === "pending");
  return pendingFines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0);
}

async function canUserLoan(userId: string, bookId: string): Promise<{ canLoan: boolean; reason?: string }> {
  const user = await storage.getUser(userId);
  if (!user || !user.isActive) {
    return { canLoan: false, reason: "Utilizador não encontrado ou inativo" };
  }

  const book = await storage.getBook(bookId);
  if (!book) {
    return { canLoan: false, reason: "Livro não encontrado" };
  }

  if (book.availableCopies <= 0) {
    return { canLoan: false, reason: "Livro indisponível" };
  }

  if (book.tag === "red") {
    return { canLoan: false, reason: "Este livro é apenas para uso na biblioteca (etiqueta vermelha)" };
  }

  // Check fines
  const totalFines = await getUserTotalFines(userId);
  if (totalFines >= MAX_FINE_FOR_LOAN) {
    return { canLoan: false, reason: `Você tem multas pendentes de ${totalFines} Kz. Pague para liberar novos empréstimos.` };
  }

  // Check loan limits
  const userLoans = await storage.getLoansByUser(userId);
  const activeLoans = userLoans.filter(l => l.status === "active");
  
  const maxBooks = user.userType === "teacher" 
    ? LOAN_RULES.teacher.maxBooks 
    : user.userType === "staff"
    ? LOAN_RULES.staff.maxBooks
    : LOAN_RULES.student.maxBooks;

  if (activeLoans.length >= maxBooks) {
    return { canLoan: false, reason: `Limite de ${maxBooks} livros atingido` };
  }

  // Check if user already has this book
  const hasThisBook = activeLoans.some(l => l.bookId === bookId);
  if (hasThisBook) {
    return { canLoan: false, reason: "Você já tem este livro emprestado" };
  }

  // For students and staff: check if they already have a book with the same title (unique titles only)
  if (user.userType === "student" || user.userType === "staff") {
    const activeLoanBooks = await Promise.all(
      activeLoans.map(loan => storage.getBook(loan.bookId))
    );
    const hasSameTitle = activeLoanBooks.some(b => b && b.title === book.title);
    if (hasSameTitle) {
      return { canLoan: false, reason: "Você já tem um livro com este título emprestado. Estudantes e funcionários não podem ter títulos repetidos." };
    }
  }

  // For teachers: only 1 copy per title (they can have up to 4 books, but only 1 copy of each title)
  if (user.userType === "teacher") {
    const activeLoanBooks = await Promise.all(
      activeLoans.map(loan => storage.getBook(loan.bookId))
    );
    const hasSameTitle = activeLoanBooks.some(b => b && b.title === book.title);
    if (hasSameTitle) {
      return { canLoan: false, reason: "Você já tem uma obra deste título emprestada. Docentes podem ter apenas 1 obra por título." };
    }
  }

  return { canLoan: true };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Utilizador inativo" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          email: user.email,
          userType: user.userType 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Erro no servidor" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        userType: u.userType,
        isActive: u.isActive,
        createdAt: u.createdAt,
      }));
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar utilizadores" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar utilizador" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar utilizador" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar utilizador" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar categoria" });
    }
  });

  // Book routes
  app.get("/api/books", async (req, res) => {
    try {
      const { search, department, categoryId } = req.query;
      let books = await storage.getAllBooks();
      
      // Apply search filter
      if (search && typeof search === "string") {
        const searchLower = search.toLowerCase();
        books = books.filter(book => 
          book.title.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower) ||
          (book.isbn && book.isbn.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply department filter
      if (department && typeof department === "string") {
        books = books.filter(book => book.department === department);
      }
      
      // Apply category filter
      if (categoryId && typeof categoryId === "string") {
        books = books.filter(book => book.categoryId === categoryId);
      }
      
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar livros" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ message: "Livro não encontrado" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar livro" });
    }
  });

  app.post("/api/books", async (req, res) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar livro" });
    }
  });

  app.patch("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.updateBook(req.params.id, req.body);
      if (!book) {
        return res.status(404).json({ message: "Livro não encontrado" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar livro" });
    }
  });

  app.delete("/api/books/:id", async (req, res) => {
    try {
      const success = await storage.deleteBook(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Livro não encontrado" });
      }
      res.json({ message: "Livro deletado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar livro" });
    }
  });

  // Loan routes
  app.get("/api/loans", async (req, res) => {
    try {
      const { userId, bookId, status } = req.query;
      let loans;
      
      if (userId && typeof userId === "string") {
        loans = await storage.getLoansByUser(userId);
      } else if (bookId && typeof bookId === "string") {
        loans = await storage.getLoansByBook(bookId);
      } else if (status === "active") {
        loans = await storage.getActiveLoans();
      } else if (status === "overdue") {
        loans = await storage.getOverdueLoans();
      } else {
        loans = await storage.getAllLoans();
      }
      
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar empréstimos" });
    }
  });

  app.post("/api/loans", async (req, res) => {
    try {
      const { userId, bookId } = req.body;
      
      // Validate loan eligibility
      const eligibility = await canUserLoan(userId, bookId);
      if (!eligibility.canLoan) {
        return res.status(400).json({ message: eligibility.reason });
      }

      const user = await storage.getUser(userId);
      const book = await storage.getBook(bookId);
      
      if (!user || !book) {
        return res.status(404).json({ message: "Utilizador ou livro não encontrado" });
      }

      // Calculate due date based on user type and book tag
      const dueDate = calculateDueDate(user.userType, book.tag);

      // Create loan
      const loan = await storage.createLoan({
        userId,
        bookId,
        dueDate,
        status: "active",
        returnDate: null,
        renewalCount: 0,
      });

      // Update book availability
      await storage.updateBook(bookId, {
        availableCopies: book.availableCopies - 1,
      });

      res.status(201).json(loan);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar empréstimo" });
    }
  });

  // Return book
  app.post("/api/loans/:id/return", async (req, res) => {
    try {
      const loan = await storage.getLoan(req.params.id);
      if (!loan) {
        return res.status(404).json({ message: "Empréstimo não encontrado" });
      }

      if (loan.status !== "active") {
        return res.status(400).json({ message: "Empréstimo já foi devolvido" });
      }

      const returnDate = new Date();
      const dueDate = new Date(loan.dueDate);

      // Calculate fine if overdue
      const fineInfo = calculateFine(dueDate, returnDate);
      
      // Update loan
      await storage.updateLoan(loan.id, {
        status: "returned",
        returnDate,
      });

      // Create fine if overdue
      if (fineInfo.amount > 0) {
        await storage.createFine({
          loanId: loan.id,
          userId: loan.userId,
          amount: fineInfo.amount.toString(),
          daysOverdue: fineInfo.daysOverdue,
          status: "pending",
          paymentDate: null,
        });
      }

      // Update book availability
      const book = await storage.getBook(loan.bookId);
      if (book) {
        await storage.updateBook(loan.bookId, {
          availableCopies: book.availableCopies + 1,
        });

        // Check for pending reservations
        const reservations = await storage.getReservationsByBook(loan.bookId);
        const pendingReservations = reservations
          .filter(r => r.status === "pending")
          .sort((a, b) => new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime());

        if (pendingReservations.length > 0) {
          const nextReservation = pendingReservations[0];
          const expirationDate = new Date();
          expirationDate.setHours(expirationDate.getHours() + RESERVATION_PICKUP_HOURS);

          await storage.updateReservation(nextReservation.id, {
            status: "notified",
            notificationDate: new Date(),
            expirationDate,
          });
        }
      }

      res.json({ message: "Livro devolvido com sucesso", fine: fineInfo.amount });
    } catch (error) {
      res.status(500).json({ message: "Erro ao devolver livro" });
    }
  });

  // Renew loan
  app.post("/api/loans/:id/renew", async (req, res) => {
    try {
      const loan = await storage.getLoan(req.params.id);
      if (!loan) {
        return res.status(404).json({ message: "Empréstimo não encontrado" });
      }

      if (loan.status !== "active") {
        return res.status(400).json({ message: "Apenas empréstimos ativos podem ser renovados" });
      }

      if (loan.renewalCount >= MAX_RENEWALS) {
        return res.status(400).json({ message: `Limite de ${MAX_RENEWALS} renovações atingido` });
      }

      // Check for pending reservations from OTHER users
      const reservations = await storage.getReservationsByBook(loan.bookId);
      const hasPendingReservations = reservations.some(r => 
        (r.status === "pending" || r.status === "notified") && r.userId !== loan.userId
      );
      
      if (hasPendingReservations) {
        return res.status(400).json({ message: "Não é possível renovar. Existem reservas pendentes para este livro." });
      }

      // Check for unpaid fines
      const totalFines = await getUserTotalFines(loan.userId);
      if (totalFines > 0) {
        return res.status(400).json({ message: "Você tem multas pendentes. Pague para renovar empréstimos." });
      }

      // Calculate new due date
      const user = await storage.getUser(loan.userId);
      const book = await storage.getBook(loan.bookId);
      
      if (!user || !book) {
        return res.status(404).json({ message: "Utilizador ou livro não encontrado" });
      }

      const newDueDate = calculateDueDate(user.userType, book.tag);

      await storage.updateLoan(loan.id, {
        dueDate: newDueDate,
        renewalCount: loan.renewalCount + 1,
      });

      res.json({ message: "Empréstimo renovado com sucesso", newDueDate });
    } catch (error) {
      res.status(500).json({ message: "Erro ao renovar empréstimo" });
    }
  });

  // Reservation routes
  app.get("/api/reservations", async (req, res) => {
    try {
      const { userId, bookId } = req.query;
      let reservations;
      
      if (userId && typeof userId === "string") {
        reservations = await storage.getReservationsByUser(userId);
      } else if (bookId && typeof bookId === "string") {
        reservations = await storage.getReservationsByBook(bookId);
      } else {
        reservations = await storage.getAllReservations();
      }
      
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar reservas" });
    }
  });

  app.post("/api/reservations", async (req, res) => {
    try {
      const { userId, bookId } = req.body;
      
      // Check reservation limit - only count pending and notified
      const userReservations = await storage.getReservationsByUser(userId);
      const activeReservations = userReservations.filter(r => 
        r.status === "pending" || r.status === "notified"
      );
      
      if (activeReservations.length >= MAX_RESERVATIONS_PER_USER) {
        return res.status(400).json({ message: `Limite de ${MAX_RESERVATIONS_PER_USER} reservas simultâneas atingido` });
      }

      // Check if book exists
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Livro não encontrado" });
      }

      // Check if user already has a reservation for this book
      const hasReservation = userReservations.some(r => 
        r.bookId === bookId && (r.status === "pending" || r.status === "notified")
      );
      
      if (hasReservation) {
        return res.status(400).json({ message: "Você já tem uma reserva ativa para este livro" });
      }

      const reservation = await storage.createReservation({
        userId,
        bookId,
        status: "pending",
        notificationDate: null,
        expirationDate: null,
      });

      res.status(201).json(reservation);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar reserva" });
    }
  });

  app.patch("/api/reservations/:id", async (req, res) => {
    try {
      const reservation = await storage.updateReservation(req.params.id, req.body);
      if (!reservation) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar reserva" });
    }
  });

  // Fine routes
  app.get("/api/fines", async (req, res) => {
    try {
      const { userId } = req.query;
      let fines;
      
      if (userId && typeof userId === "string") {
        fines = await storage.getFinesByUser(userId);
      } else {
        fines = await storage.getAllFines();
      }
      
      res.json(fines);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar multas" });
    }
  });

  app.post("/api/fines/:id/pay", async (req, res) => {
    try {
      const fine = await storage.getFine(req.params.id);
      if (!fine) {
        return res.status(404).json({ message: "Multa não encontrada" });
      }

      if (fine.status === "paid") {
        return res.status(400).json({ message: "Multa já foi paga" });
      }

      await storage.updateFine(fine.id, {
        status: "paid",
        paymentDate: new Date(),
      });

      res.json({ message: "Multa paga com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao pagar multa" });
    }
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const books = await storage.getAllBooks();
      const users = await storage.getAllUsers();
      const loans = await storage.getAllLoans();
      const fines = await storage.getAllFines();

      const activeLoans = loans.filter(l => l.status === "active");
      const overdueLoans = await storage.getOverdueLoans();
      const pendingFines = fines.filter(f => f.status === "pending");
      const totalFinesAmount = pendingFines.reduce((sum, f) => sum + parseFloat(f.amount), 0);

      res.json({
        totalBooks: books.length,
        availableBooks: books.reduce((sum, b) => sum + b.availableCopies, 0),
        totalUsers: users.length,
        activeLoans: activeLoans.length,
        overdueLoans: overdueLoans.length,
        pendingFines: pendingFines.length,
        totalFinesAmount,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  app.post("/api/books/ocr", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ message: "Imagem não fornecida" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia os seguintes dados desta capa de livro em formato JSON: title, author, isbn, publisher, yearPublished. Se não encontrar algum campo, deixe vazio." },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Falha ao extrair dados da imagem");
      }

      res.json(JSON.parse(content));
    } catch (error: any) {
      console.error("OCR Error:", error);
      res.status(500).json({ message: "Erro ao processar imagem: " + error.message });
    }
  });

  app.post("/api/books/web-search", async (req, res) => {
    try {
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ message: "Título não fornecido" });
      }

      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=1`);
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return res.status(404).json({ message: "Nenhum livro encontrado na internet." });
      }

      const volumeInfo = data.items[0].volumeInfo;
      const isbnObj = volumeInfo.industryIdentifiers?.find((id: any) => id.type === "ISBN_13") || volumeInfo.industryIdentifiers?.[0];

      res.json({
        title: volumeInfo.title,
        author: volumeInfo.authors?.join(", "),
        isbn: isbnObj?.identifier,
        publisher: volumeInfo.publisher,
        yearPublished: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate.split("-")[0]) : null,
        description: volumeInfo.description,
        categories: volumeInfo.categories?.join(", ")
      });
    } catch (error: any) {
      console.error("Web Search Error:", error);
      res.status(500).json({ message: "Erro ao pesquisar na internet: " + error.message });
    }
  });

  // Reports
  app.get("/api/reports/popular-books", async (req, res) => {
    try {
      const loans = await storage.getAllLoans();
      const bookLoanCount = new Map<string, number>();

      loans.forEach(loan => {
        const count = bookLoanCount.get(loan.bookId) || 0;
        bookLoanCount.set(loan.bookId, count + 1);
      });

      const sortedBooks = Array.from(bookLoanCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const popularBooks = await Promise.all(
        sortedBooks.map(async ([bookId, count]) => {
          const book = await storage.getBook(bookId);
          return { book, loanCount: count };
        })
      );

      res.json(popularBooks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar relatório" });
    }
  });

  app.get("/api/reports/active-users", async (req, res) => {
    try {
      const loans = await storage.getAllLoans();
      const userLoanCount = new Map<string, number>();

      loans.forEach(loan => {
        const count = userLoanCount.get(loan.userId) || 0;
        userLoanCount.set(loan.userId, count + 1);
      });

      const sortedUsers = Array.from(userLoanCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const activeUsers = await Promise.all(
        sortedUsers.map(async ([userId, count]) => {
          const user = await storage.getUser(userId);
          return { user, loanCount: count };
        })
      );

      res.json(activeUsers);
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar relatório" });
    }
  });

  // Loan Requests
  app.get("/api/loan-requests", async (req, res) => {
    try {
      const { userId, status } = req.query;
      let requests;
      
      if (userId && typeof userId === "string") {
        requests = await storage.getLoanRequestsByUser(userId);
      } else if (status && typeof status === "string") {
        requests = await storage.getLoanRequestsByStatus(status);
      } else {
        requests = await storage.getAllLoanRequests();
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar solicitações" });
    }
  });

  app.post("/api/loan-requests", async (req, res) => {
    try {
      const { userId, bookId } = req.body;
      
      const request = await storage.createLoanRequest({
        userId,
        bookId,
        status: "pending",
        reviewedBy: null,
        reviewDate: null,
        notes: null,
      });
      
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar solicitação" });
    }
  });

  app.post("/api/loan-requests/:id/approve", async (req, res) => {
    try {
      const request = await storage.getLoanRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      const user = await storage.getUser(request.userId);
      const book = await storage.getBook(request.bookId);
      
      if (!user || !book) {
        return res.status(404).json({ message: "Utilizador ou livro não encontrado" });
      }

      const dueDate = calculateDueDate(user.userType, book.tag);

      const loan = await storage.createLoan({
        userId: request.userId,
        bookId: request.bookId,
        dueDate,
        status: "active",
        returnDate: null,
        renewalCount: 0,
      });

      await storage.updateBook(request.bookId, {
        availableCopies: book.availableCopies - 1,
      });

      await storage.updateLoanRequest(request.id, {
        status: "approved",
        reviewedBy: req.body.reviewedBy,
        reviewDate: new Date(),
      });

      res.json({ message: "Solicitação aprovada", loan });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao aprovar solicitação" });
    }
  });

  app.post("/api/loan-requests/:id/reject", async (req, res) => {
    try {
      const request = await storage.getLoanRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      await storage.updateLoanRequest(request.id, {
        status: "rejected",
        reviewedBy: req.body.reviewedBy,
        reviewDate: new Date(),
        notes: req.body.notes || null,
      });

      res.json({ message: "Solicitação rejeitada" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao rejeitar solicitação" });
    }
  });

  // Renewal Requests
  app.get("/api/renewal-requests", async (req, res) => {
    try {
      const { userId, status } = req.query;
      let requests;
      
      if (userId && typeof userId === "string") {
        requests = await storage.getRenewalRequestsByUser(userId);
      } else if (status && typeof status === "string") {
        requests = await storage.getRenewalRequestsByStatus(status);
      } else {
        requests = await storage.getAllRenewalRequests();
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar solicitações de renovação" });
    }
  });

  app.post("/api/renewal-requests", async (req, res) => {
    try {
      const { loanId, userId } = req.body;
      
      const request = await storage.createRenewalRequest({
        loanId,
        userId,
        status: "pending",
        reviewedBy: null,
        reviewDate: null,
        notes: null,
      });
      
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar solicitação de renovação" });
    }
  });

  app.post("/api/renewal-requests/:id/approve", async (req, res) => {
    try {
      const request = await storage.getRenewalRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      const loan = await storage.getLoan(request.loanId);
      if (!loan) {
        return res.status(404).json({ message: "Empréstimo não encontrado" });
      }

      const user = await storage.getUser(loan.userId);
      const book = await storage.getBook(loan.bookId);
      
      if (!user || !book) {
        return res.status(404).json({ message: "Utilizador ou livro não encontrado" });
      }

      const newDueDate = calculateDueDate(user.userType, book.tag);

      await storage.updateLoan(loan.id, {
        dueDate: newDueDate,
        renewalCount: loan.renewalCount + 1,
      });

      await storage.updateRenewalRequest(request.id, {
        status: "approved",
        reviewedBy: req.body.reviewedBy,
        reviewDate: new Date(),
      });

      res.json({ message: "Renovação aprovada", newDueDate });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao aprovar renovação" });
    }
  });

  app.post("/api/renewal-requests/:id/reject", async (req, res) => {
    try {
      const request = await storage.getRenewalRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      await storage.updateRenewalRequest(request.id, {
        status: "rejected",
        reviewedBy: req.body.reviewedBy,
        reviewDate: new Date(),
        notes: req.body.notes || null,
      });

      res.json({ message: "Renovação rejeitada" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao rejeitar renovação" });
    }
  });


  app.post("/api/books/ocr", async (req, res) => {
    try {
      const { image } = req.body; // base64 image
      if (!image) {
        return res.status(400).json({ message: "Imagem é obrigatória" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia o título, autor, ISBN (se houver), editora e ano de publicação desta capa de livro. Retorne APENAS um objeto JSON com os campos: title, author, isbn, publisher, yearPublished (número). Se não encontrar algum campo, deixe-o como null ou string vazia." },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Falha na extração de dados");
      }

      res.json(JSON.parse(content));
    } catch (error: any) {
      console.error("Erro no OCR:", error);
      res.status(500).json({ message: "Erro ao processar imagem: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

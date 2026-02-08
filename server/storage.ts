import {
  type User,
  type InsertUser,
  type Book,
  type InsertBook,
  type Loan,
  type InsertLoan,
  type Reservation,
  type InsertReservation,
  type Fine,
  type InsertFine,
  type Category,
  type InsertCategory,
  type LoanRequest,
  type InsertLoanRequest,
  type RenewalRequest,
  type InsertRenewalRequest,
  users,
  books,
  loans,
  categories,
  reservations,
  fines,
  loanRequests,
  renewalRequests,
  type Review,
  type InsertReview,
  reviews
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, or, lt } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  // Book methods
  getBook(id: string): Promise<Book | undefined>;
  getAllBooks(): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: string, book: Partial<Book>): Promise<Book | undefined>;
  deleteBook(id: string): Promise<boolean>;

  // Category methods
  getCategory(id: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Loan methods
  getLoan(id: string): Promise<Loan | undefined>;
  getAllLoans(): Promise<Loan[]>;
  getLoansByUser(userId: string): Promise<Loan[]>;
  getLoansByBook(bookId: string): Promise<Loan[]>;
  getActiveLoans(): Promise<Loan[]>;
  getOverdueLoans(): Promise<Loan[]>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: string, loan: Partial<Loan>): Promise<Loan | undefined>;
  deleteLoan(id: string): Promise<boolean>;

  // Reservation methods
  getReservation(id: string): Promise<Reservation | undefined>;
  getAllReservations(): Promise<Reservation[]>;
  getReservationsByUser(userId: string): Promise<Reservation[]>;
  getReservationsByBook(bookId: string): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: string, reservation: Partial<Reservation>): Promise<Reservation | undefined>;

  // Fine methods
  getFine(id: string): Promise<Fine | undefined>;
  getAllFines(): Promise<Fine[]>;
  getFinesByUser(userId: string): Promise<Fine[]>;
  createFine(fine: InsertFine): Promise<Fine>;
  updateFine(id: string, fine: Partial<Fine>): Promise<Fine | undefined>;
  getFinesByLoan(loanId: string): Promise<Fine[]>;

  // Loan Request methods
  getLoanRequest(id: string): Promise<LoanRequest | undefined>;
  getAllLoanRequests(): Promise<LoanRequest[]>;
  getLoanRequestsByUser(userId: string): Promise<LoanRequest[]>;
  getLoanRequestsByStatus(status: string): Promise<LoanRequest[]>;
  createLoanRequest(loanRequest: InsertLoanRequest): Promise<LoanRequest>;
  updateLoanRequest(id: string, loanRequest: Partial<LoanRequest>): Promise<LoanRequest | undefined>;

  // Renewal Request methods
  getRenewalRequest(id: string): Promise<RenewalRequest | undefined>;
  getAllRenewalRequests(): Promise<RenewalRequest[]>;
  getRenewalRequestsByUser(userId: string): Promise<RenewalRequest[]>;
  getRenewalRequestsByStatus(status: string): Promise<RenewalRequest[]>;
  createRenewalRequest(renewalRequest: InsertRenewalRequest): Promise<RenewalRequest>;
  updateRenewalRequest(id: string, renewalRequest: Partial<RenewalRequest>): Promise<RenewalRequest | undefined>;

  // Review methods
  getReview(id: string): Promise<Review | undefined>;
  getReviewsByBook(bookId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, review: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: string): Promise<boolean>;
  deleteRenewalRequest(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    const [deletedUser] = await db.delete(users).where(eq(users.id, id)).returning();
    return !!deletedUser;
  }

  // Book methods
  async getBook(id: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async getAllBooks(): Promise<Book[]> {
    return await db.select().from(books);
  }

  async searchBooks(query: string): Promise<Book[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    return await db.select().from(books).where(
      or(
        ilike(books.title, lowerQuery),
        ilike(books.author, lowerQuery),
        ilike(books.isbn, lowerQuery)
      )
    );
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db.insert(books).values(insertBook).returning();
    return book;
  }

  async updateBook(id: string, bookData: Partial<Book>): Promise<Book | undefined> {
    const [updatedBook] = await db
      .update(books)
      .set(bookData)
      .where(eq(books.id, id))
      .returning();
    return updatedBook;
  }

  async deleteBook(id: string): Promise<boolean> {
    const [deletedBook] = await db.delete(books).where(eq(books.id, id)).returning();
    return !!deletedBook;
  }

  // Category methods
  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  // Loan methods
  async getLoan(id: string): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan;
  }

  async getAllLoans(): Promise<Loan[]> {
    return await db.select().from(loans);
  }

  async getLoansByUser(userId: string): Promise<Loan[]> {
    return await db.select().from(loans).where(eq(loans.userId, userId));
  }

  async getLoansByBook(bookId: string): Promise<Loan[]> {
    return await db.select().from(loans).where(eq(loans.bookId, bookId));
  }

  async getActiveLoans(): Promise<Loan[]> {
    return await db.select().from(loans).where(eq(loans.status, "active"));
  }

  async getOverdueLoans(): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(and(eq(loans.status, "active"), lt(loans.dueDate, new Date())));
  }

  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const [loan] = await db.insert(loans).values(insertLoan).returning();
    return loan;
  }

  async updateLoan(id: string, loanData: Partial<Loan>): Promise<Loan | undefined> {
    const [updatedLoan] = await db
      .update(loans)
      .set(loanData)
      .where(eq(loans.id, id))
      .returning();
    return updatedLoan;
  }

  async deleteLoan(id: string): Promise<boolean> {
    const [deletedLoan] = await db.delete(loans).where(eq(loans.id, id)).returning();
    return !!deletedLoan;
  }

  // Reservation methods
  async getReservation(id: string): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation;
  }

  async getAllReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations);
  }

  async getReservationsByUser(userId: string): Promise<Reservation[]> {
    return await db.select().from(reservations).where(eq(reservations.userId, userId));
  }

  async getReservationsByBook(bookId: string): Promise<Reservation[]> {
    return await db.select().from(reservations).where(eq(reservations.bookId, bookId));
  }

  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const [reservation] = await db.insert(reservations).values(insertReservation).returning();
    return reservation;
  }

  async updateReservation(id: string, reservationData: Partial<Reservation>): Promise<Reservation | undefined> {
    const [updatedReservation] = await db
      .update(reservations)
      .set(reservationData)
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation;
  }

  // Fine methods
  async getFine(id: string): Promise<Fine | undefined> {
    const [fine] = await db.select().from(fines).where(eq(fines.id, id));
    return fine;
  }

  async getAllFines(): Promise<Fine[]> {
    return await db.select().from(fines);
  }

  async getFinesByUser(userId: string): Promise<Fine[]> {
    return await db.select().from(fines).where(eq(fines.userId, userId));
  }

  async createFine(insertFine: InsertFine): Promise<Fine> {
    const [fine] = await db.insert(fines).values(insertFine).returning();
    return fine;
  }

  async updateFine(id: string, fineData: Partial<Fine>): Promise<Fine | undefined> {
    const [updatedFine] = await db
      .update(fines)
      .set(fineData)
      .where(eq(fines.id, id))
      .returning();
    return updatedFine;
  }

  async getFinesByLoan(loanId: string): Promise<Fine[]> {
    return await db.select().from(fines).where(eq(fines.loanId, loanId));
  }

  // Loan Request methods
  async getLoanRequest(id: string): Promise<LoanRequest | undefined> {
    const [request] = await db.select().from(loanRequests).where(eq(loanRequests.id, id));
    return request;
  }

  async getAllLoanRequests(): Promise<LoanRequest[]> {
    return await db.select().from(loanRequests);
  }

  async getLoanRequestsByUser(userId: string): Promise<LoanRequest[]> {
    return await db.select().from(loanRequests).where(eq(loanRequests.userId, userId));
  }

  async getLoanRequestsByStatus(status: string): Promise<LoanRequest[]> {
    // We need to cast the string status to the enum type if strict, but drizzle usually handles string -> enum comparison if valid.
    // Casting to any to avoid strict type issues if enum mismatch, though it should be fine.
    return await db.select().from(loanRequests).where(eq(loanRequests.status, status as any));
  }

  async createLoanRequest(insertLoanRequest: InsertLoanRequest): Promise<LoanRequest> {
    const [request] = await db.insert(loanRequests).values(insertLoanRequest).returning();
    return request;
  }

  async updateLoanRequest(id: string, loanRequestData: Partial<LoanRequest>): Promise<LoanRequest | undefined> {
    const [updatedRequest] = await db
      .update(loanRequests)
      .set(loanRequestData)
      .where(eq(loanRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Renewal Request methods
  async getRenewalRequest(id: string): Promise<RenewalRequest | undefined> {
    const [request] = await db.select().from(renewalRequests).where(eq(renewalRequests.id, id));
    return request;
  }

  async getAllRenewalRequests(): Promise<RenewalRequest[]> {
    return await db.select().from(renewalRequests);
  }

  async getRenewalRequestsByUser(userId: string): Promise<RenewalRequest[]> {
    return await db.select().from(renewalRequests).where(eq(renewalRequests.userId, userId));
  }

  async getRenewalRequestsByStatus(status: string): Promise<RenewalRequest[]> {
    return await db.select().from(renewalRequests).where(eq(renewalRequests.status, status as any));
  }

  async createRenewalRequest(insertRenewalRequest: InsertRenewalRequest): Promise<RenewalRequest> {
    const [request] = await db.insert(renewalRequests).values(insertRenewalRequest).returning();
    return request;
  }

  async updateRenewalRequest(id: string, renewalRequestData: Partial<RenewalRequest>): Promise<RenewalRequest | undefined> {
    const [updatedRequest] = await db
      .update(renewalRequests)
      .set(renewalRequestData)
      .where(eq(renewalRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteRenewalRequest(id: string): Promise<boolean> {
    const [deletedRequest] = await db.delete(renewalRequests).where(eq(renewalRequests.id, id)).returning();
    return !!deletedRequest;
  }

  // Review methods
  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getReviewsByBook(bookId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.bookId, bookId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async updateReview(id: string, reviewData: Partial<Review>): Promise<Review | undefined> {
    const [updatedReview] = await db
      .update(reviews)
      .set(reviewData)
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview;
  }

  async deleteReview(id: string): Promise<boolean> {
    const [deletedReview] = await db.delete(reviews).where(eq(reviews.id, id)).returning();
    return !!deletedReview;
  }
}

export const storage = new DatabaseStorage();


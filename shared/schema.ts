import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userTypeEnum = pgEnum("user_type", ["student", "teacher", "staff", "admin"]);
export const bookTagEnum = pgEnum("book_tag", ["red", "yellow", "white"]);
export const departmentEnum = pgEnum("department", ["engenharia", "ciencias-sociais", "outros"]);
export const loanStatusEnum = pgEnum("loan_status", ["active", "returned", "overdue"]);
export const reservationStatusEnum = pgEnum("reservation_status", ["pending", "notified", "completed", "cancelled"]);
export const fineStatusEnum = pgEnum("fine_status", ["pending", "paid"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  userType: userTypeEnum("user_type").notNull().default("student"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// Authors table
export const authors = pgTable("authors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  biography: text("biography"),
});

// Books table
export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  author: text("author").notNull(), // String for legacy/simple entry
  authorId: varchar("author_id").references(() => authors.id), // Link to Authors table
  isbn: text("isbn").unique(),
  publisher: text("publisher"),
  yearPublished: integer("year_published"),
  categoryId: varchar("category_id").references(() => categories.id),
  department: departmentEnum("department").notNull().default("outros"),
  tag: bookTagEnum("tag").notNull().default("white"),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  description: text("description"),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Loans table
export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookId: varchar("book_id").notNull().references(() => books.id),
  loanDate: timestamp("loan_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  returnDate: timestamp("return_date"),
  status: loanStatusEnum("status").notNull().default("active"),
  renewalCount: integer("renewal_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reservations table
export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookId: varchar("book_id").notNull().references(() => books.id),
  status: reservationStatusEnum("status").notNull().default("pending"),
  reservationDate: timestamp("reservation_date").notNull().defaultNow(),
  notificationDate: timestamp("notification_date"),
  expirationDate: timestamp("expiration_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Fines table
export const fines = pgTable("fines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").notNull().references(() => loans.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: fineStatusEnum("status").notNull().default("pending"),
  daysOverdue: integer("days_overdue").notNull(),
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Loan Requests table
export const loanRequests = pgTable("loan_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookId: varchar("book_id").notNull().references(() => books.id),
  status: requestStatusEnum("status").notNull().default("pending"),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewDate: timestamp("review_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Renewal Requests table
export const renewalRequests = pgTable("renewal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").notNull().references(() => loans.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: requestStatusEnum("status").notNull().default("pending"),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewDate: timestamp("review_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookId: varchar("book_id").notNull().references(() => books.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertAuthorSchema = createInsertSchema(authors).omit({ id: true });
export const insertBookSchema = createInsertSchema(books).omit({ id: true, createdAt: true });
export const insertLoanSchema = createInsertSchema(loans).omit({ id: true, createdAt: true, loanDate: true, returnDate: true, renewalCount: true });
export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true, createdAt: true, status: true, notificationDate: true, expirationDate: true });
export const insertFineSchema = createInsertSchema(fines).omit({ id: true, createdAt: true });
export const insertLoanRequestSchema = createInsertSchema(loanRequests).omit({ id: true, requestDate: true, createdAt: true });
export const insertRenewalRequestSchema = createInsertSchema(renewalRequests).omit({ id: true, requestDate: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Author = typeof authors.$inferSelect;
export type InsertAuthor = z.infer<typeof insertAuthorSchema>;

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type Fine = typeof fines.$inferSelect;
export type InsertFine = z.infer<typeof insertFineSchema>;

export type LoanRequest = typeof loanRequests.$inferSelect;
export type InsertLoanRequest = z.infer<typeof insertLoanRequestSchema>;

export type RenewalRequest = typeof renewalRequests.$inferSelect;
export type InsertRenewalRequest = z.infer<typeof insertRenewalRequestSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

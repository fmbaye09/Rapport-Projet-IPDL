import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["user", "chef_dept", "direction", "comptable"]);
export const statusEnum = pgEnum("status", ["draft", "pending", "validated", "rejected", "consolidated"]);
export const budgetTypeEnum = pgEnum("budget_type", ["recette", "depense"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("user"),
  department: text("department"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  type: budgetTypeEnum("type").notNull(),
  parentCode: text("parent_code"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});

export const budgetLines = pgTable("budget_lines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => budgetCategories.id),
  year: integer("year").notNull(),
  proposedAmount: numeric("proposed_amount", { precision: 15, scale: 2 }).notNull(),
  realizedAmount: numeric("realized_amount", { precision: 15, scale: 2 }),
  description: text("description"),
  status: statusEnum("status").notNull().default("draft"),
  validatedBy: integer("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgetHistory = pgTable("budget_history", {
  id: serial("id").primaryKey(),
  budgetLineId: integer("budget_line_id").notNull().references(() => budgetLines.id),
  action: text("action").notNull(),
  oldValues: text("old_values"),
  newValues: text("new_values"),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgetReports = pgTable("budget_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  year: integer("year").notNull(),
  type: text("type").notNull(),
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  budgetLines: many(budgetLines),
  validatedBudgetLines: many(budgetLines, { relationName: "validator" }),
  budgetHistory: many(budgetHistory),
  budgetReports: many(budgetReports),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ many }) => ({
  budgetLines: many(budgetLines),
}));

export const budgetLinesRelations = relations(budgetLines, ({ one, many }) => ({
  user: one(users, { fields: [budgetLines.userId], references: [users.id] }),
  category: one(budgetCategories, { fields: [budgetLines.categoryId], references: [budgetCategories.id] }),
  validator: one(users, { fields: [budgetLines.validatedBy], references: [users.id], relationName: "validator" }),
  history: many(budgetHistory),
}));

export const budgetHistoryRelations = relations(budgetHistory, ({ one }) => ({
  budgetLine: one(budgetLines, { fields: [budgetHistory.budgetLineId], references: [budgetLines.id] }),
  user: one(users, { fields: [budgetHistory.userId], references: [users.id] }),
}));

export const budgetReportsRelations = relations(budgetReports, ({ one }) => ({
  user: one(users, { fields: [budgetReports.userId], references: [users.id] }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
});

export const insertBudgetLineSchema = createInsertSchema(budgetLines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBudgetLineSchema = insertBudgetLineSchema.partial().omit({
  userId: true,
});

export const insertBudgetHistorySchema = createInsertSchema(budgetHistory).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetReportSchema = createInsertSchema(budgetReports).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetLine = typeof budgetLines.$inferSelect;
export type InsertBudgetLine = z.infer<typeof insertBudgetLineSchema>;
export type BudgetHistory = typeof budgetHistory.$inferSelect;
export type InsertBudgetHistory = z.infer<typeof insertBudgetHistorySchema>;
export type BudgetReport = typeof budgetReports.$inferSelect;
export type InsertBudgetReport = z.infer<typeof insertBudgetReportSchema>;

// Extended types with relations
export type BudgetLineWithDetails = BudgetLine & {
  user: User;
  category: BudgetCategory;
  validator?: User;
};

export type UserWithRole = User & {
  budgetLines?: BudgetLine[];
};

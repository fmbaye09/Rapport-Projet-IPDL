import { 
  users, 
  budgetCategories, 
  budgetLines, 
  budgetHistory, 
  budgetReports,
  type User, 
  type InsertUser,
  type BudgetCategory,
  type InsertBudgetCategory,
  type BudgetLine,
  type InsertBudgetLine,
  type BudgetLineWithDetails,
  type InsertBudgetHistory,
  type BudgetReport,
  type InsertBudgetReport
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Budget category operations
  getBudgetCategories(): Promise<BudgetCategory[]>;
  getBudgetCategoryByCode(code: string): Promise<BudgetCategory | undefined>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  
  // Budget line operations
  getBudgetLines(filters?: { year?: number; userId?: number; status?: string }): Promise<BudgetLineWithDetails[]>;
  getBudgetLine(id: number): Promise<BudgetLineWithDetails | undefined>;
  createBudgetLine(line: InsertBudgetLine): Promise<BudgetLine>;
  updateBudgetLine(id: number, line: Partial<InsertBudgetLine>): Promise<BudgetLine | undefined>;
  deleteBudgetLine(id: number): Promise<boolean>;
  
  // Budget analysis
  getBudgetSummary(year: number): Promise<{
    totalProposed: number;
    totalRealized: number;
    totalRecettes: number;
    totalDepenses: number;
    realizationRate: number;
  }>;
  
  getBudgetVariances(year: number): Promise<Array<{
    categoryCode: string;
    categoryLabel: string;
    proposed: number;
    realized: number;
    variance: number;
    variancePercent: number;
  }>>;
  
  // History operations
  createBudgetHistory(history: InsertBudgetHistory): Promise<void>;
  getBudgetHistory(budgetLineId: number): Promise<any[]>;
  
  // Report operations
  createBudgetReport(report: InsertBudgetReport): Promise<BudgetReport>;
  getBudgetReports(userId?: number): Promise<BudgetReport[]>;
  deleteBudgetReport(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getBudgetCategories(): Promise<BudgetCategory[]> {
    return await db.select().from(budgetCategories).where(eq(budgetCategories.isActive, true));
  }

  async getBudgetCategoryByCode(code: string): Promise<BudgetCategory | undefined> {
    const [category] = await db
      .select()
      .from(budgetCategories)
      .where(and(eq(budgetCategories.code, code), eq(budgetCategories.isActive, true)));
    return category || undefined;
  }

  async createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory> {
    const [newCategory] = await db.insert(budgetCategories).values(category).returning();
    return newCategory;
  }

  async getBudgetLines(filters?: { year?: number; userId?: number; status?: string }): Promise<BudgetLineWithDetails[]> {
    let whereConditions: any[] = [];
    
    if (filters?.year) {
      whereConditions.push(eq(budgetLines.year, filters.year));
    }
    if (filters?.userId) {
      whereConditions.push(eq(budgetLines.userId, filters.userId));
    }
    if (filters?.status) {
      whereConditions.push(eq(budgetLines.status, filters.status as any));
    }

    const query = db
      .select({
        id: budgetLines.id,
        userId: budgetLines.userId,
        categoryId: budgetLines.categoryId,
        year: budgetLines.year,
        proposedAmount: budgetLines.proposedAmount,
        realizedAmount: budgetLines.realizedAmount,
        description: budgetLines.description,
        status: budgetLines.status,
        validatedBy: budgetLines.validatedBy,
        validatedAt: budgetLines.validatedAt,
        rejectionReason: budgetLines.rejectionReason,
        createdAt: budgetLines.createdAt,
        updatedAt: budgetLines.updatedAt,
        user: users,
        category: budgetCategories,
        validator: {
          id: sql`validator.id`,
          name: sql`validator.name`,
          email: sql`validator.email`,
          role: sql`validator.role`,
          department: sql`validator.department`,
          isActive: sql`validator.is_active`,
          createdAt: sql`validator.created_at`,
          password: sql`validator.password`,
        }
      })
      .from(budgetLines)
      .leftJoin(users, eq(budgetLines.userId, users.id))
      .leftJoin(budgetCategories, eq(budgetLines.categoryId, budgetCategories.id))
      .leftJoin(sql`users as validator`, sql`budget_lines.validated_by = validator.id`)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(budgetLines.createdAt));

    return await query as any;
  }

  async getBudgetLine(id: number): Promise<BudgetLineWithDetails | undefined> {
    const [line] = await db
      .select({
        id: budgetLines.id,
        userId: budgetLines.userId,
        categoryId: budgetLines.categoryId,
        year: budgetLines.year,
        proposedAmount: budgetLines.proposedAmount,
        realizedAmount: budgetLines.realizedAmount,
        description: budgetLines.description,
        status: budgetLines.status,
        validatedBy: budgetLines.validatedBy,
        validatedAt: budgetLines.validatedAt,
        rejectionReason: budgetLines.rejectionReason,
        createdAt: budgetLines.createdAt,
        updatedAt: budgetLines.updatedAt,
        user: users,
        category: budgetCategories,
        validator: {
          id: sql`validator.id`,
          name: sql`validator.name`,
          email: sql`validator.email`,
          role: sql`validator.role`,
          department: sql`validator.department`,
          isActive: sql`validator.is_active`,
          createdAt: sql`validator.created_at`,
          password: sql`validator.password`,
        }
      })
      .from(budgetLines)
      .leftJoin(users, eq(budgetLines.userId, users.id))
      .leftJoin(budgetCategories, eq(budgetLines.categoryId, budgetCategories.id))
      .leftJoin(sql`users as validator`, sql`budget_lines.validated_by = validator.id`)
      .where(eq(budgetLines.id, id));

    return line as any || undefined;
  }

  async createBudgetLine(line: InsertBudgetLine): Promise<BudgetLine> {
    const [newLine] = await db.insert(budgetLines).values(line).returning();
    return newLine;
  }

  async updateBudgetLine(id: number, updateData: Partial<InsertBudgetLine>): Promise<BudgetLine | undefined> {
    const [line] = await db
      .update(budgetLines)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(budgetLines.id, id))
      .returning();
    return line || undefined;
  }

  async deleteBudgetLine(id: number): Promise<boolean> {
    const result = await db.delete(budgetLines).where(eq(budgetLines.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getBudgetSummary(year: number): Promise<{
    totalProposed: number;
    totalRealized: number;
    totalRecettes: number;
    totalDepenses: number;
    realizationRate: number;
  }> {
    const result = await db
      .select({
        totalProposed: sql<number>`SUM(CAST(${budgetLines.proposedAmount} AS NUMERIC))`,
        totalRealized: sql<number>`SUM(CAST(${budgetLines.realizedAmount} AS NUMERIC))`,
        totalRecettes: sql<number>`SUM(CASE WHEN ${budgetCategories.type} = 'recette' THEN CAST(${budgetLines.proposedAmount} AS NUMERIC) ELSE 0 END)`,
        totalDepenses: sql<number>`SUM(CASE WHEN ${budgetCategories.type} = 'depense' THEN CAST(${budgetLines.proposedAmount} AS NUMERIC) ELSE 0 END)`,
      })
      .from(budgetLines)
      .leftJoin(budgetCategories, eq(budgetLines.categoryId, budgetCategories.id))
      .where(eq(budgetLines.year, year));

    const summary = result[0];
    const realizationRate = summary.totalProposed > 0 ? 
      (summary.totalRealized / summary.totalProposed) * 100 : 0;

    return {
      totalProposed: summary.totalProposed || 0,
      totalRealized: summary.totalRealized || 0,
      totalRecettes: summary.totalRecettes || 0,
      totalDepenses: summary.totalDepenses || 0,
      realizationRate: realizationRate,
    };
  }

  async getBudgetVariances(year: number): Promise<Array<{
    categoryCode: string;
    categoryLabel: string;
    proposed: number;
    realized: number;
    variance: number;
    variancePercent: number;
  }>> {
    const result = await db
      .select({
        categoryCode: budgetCategories.code,
        categoryLabel: budgetCategories.label,
        proposed: sql<number>`SUM(CAST(${budgetLines.proposedAmount} AS NUMERIC))`,
        realized: sql<number>`SUM(CAST(${budgetLines.realizedAmount} AS NUMERIC))`,
      })
      .from(budgetLines)
      .leftJoin(budgetCategories, eq(budgetLines.categoryId, budgetCategories.id))
      .where(eq(budgetLines.year, year))
      .groupBy(budgetCategories.code, budgetCategories.label);

    return result.map(row => {
      const variance = (row.realized || 0) - (row.proposed || 0);
      const variancePercent = row.proposed > 0 ? (variance / row.proposed) * 100 : 0;
      
      return {
        categoryCode: row.categoryCode || '',
        categoryLabel: row.categoryLabel || '',
        proposed: row.proposed || 0,
        realized: row.realized || 0,
        variance,
        variancePercent,
      };
    });
  }

  async createBudgetHistory(history: InsertBudgetHistory): Promise<void> {
    await db.insert(budgetHistory).values(history);
  }

  async getBudgetHistory(budgetLineId: number): Promise<any[]> {
    return await db
      .select()
      .from(budgetHistory)
      .where(eq(budgetHistory.budgetLineId, budgetLineId))
      .orderBy(desc(budgetHistory.createdAt));
  }

  async createBudgetReport(report: InsertBudgetReport): Promise<BudgetReport> {
    const [newReport] = await db.insert(budgetReports).values(report).returning();
    return newReport;
  }

  async getBudgetReports(userId?: number): Promise<BudgetReport[]> {
    if (userId) {
      return await db
        .select()
        .from(budgetReports)
        .where(eq(budgetReports.userId, userId))
        .orderBy(desc(budgetReports.createdAt));
    }
    
    return await db
      .select()
      .from(budgetReports)
      .orderBy(desc(budgetReports.createdAt));
  }

  async deleteBudgetReport(id: number): Promise<boolean> {
    const result = await db.delete(budgetReports).where(eq(budgetReports.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();

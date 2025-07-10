import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBudgetLineSchema, insertBudgetCategorySchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import { budgetCategories } from "@shared/budget-codes";

// Session configuration
declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateBudgetLineSchema = z.object({
  categoryId: z.number().optional(),
  proposedAmount: z.string().optional(),
  realizedAmount: z.string().optional(),
  year: z.number().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "pending", "validated", "rejected", "consolidated"]).optional(),
  validatedBy: z.number().optional(),
  rejectionReason: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Initialize budget categories
  await initializeBudgetCategories();

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireRole = (roles: string[]) => {
    return async (req: any, res: any, next: any) => {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      req.user = user;
      next();
    };
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          department: user.department 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          department: user.department 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Budget category routes
  app.get("/api/budget-categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getBudgetCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget categories" });
    }
  });

  // Budget line routes
  app.get("/api/budget-lines", requireAuth, async (req, res) => {
    try {
      const { year, status } = req.query;
      const user = await storage.getUser(req.session.userId!);
      
      let filters: any = {};
      
      if (year) filters.year = parseInt(year as string);
      if (status) filters.status = status as string;
      
      // Regular users only see their own budget lines
      if (user?.role === "user") {
        filters.userId = req.session.userId;
      }
      
      const budgetLines = await storage.getBudgetLines(filters);
      res.json(budgetLines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget lines" });
    }
  });

  app.post("/api/budget-lines", requireAuth, async (req, res) => {
    try {
      const budgetLineData = insertBudgetLineSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const budgetLine = await storage.createBudgetLine(budgetLineData);
      
      // Create history entry
      await storage.createBudgetHistory({
        budgetLineId: budgetLine.id,
        action: "created",
        newValues: JSON.stringify(budgetLineData),
        userId: req.session.userId!
      });
      
      res.status(201).json(budgetLine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create budget line" });
    }
  });

  app.get("/api/budget-lines/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budgetLine = await storage.getBudgetLine(id);
      
      if (!budgetLine) {
        return res.status(404).json({ message: "Budget line not found" });
      }
      
      // Check permissions
      const user = await storage.getUser(req.session.userId!);
      if (user?.role === "user" && budgetLine.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(budgetLine);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget line" });
    }
  });

  app.put("/api/budget-lines/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = updateBudgetLineSchema.parse(req.body);
      
      const existingLine = await storage.getBudgetLine(id);
      if (!existingLine) {
        return res.status(404).json({ message: "Budget line not found" });
      }
      
      // Check permissions
      const user = await storage.getUser(req.session.userId!);
      if (user?.role === "user" && existingLine.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedLine = await storage.updateBudgetLine(id, updateData);
      
      // Create history entry
      await storage.createBudgetHistory({
        budgetLineId: id,
        action: "updated",
        oldValues: JSON.stringify(existingLine),
        newValues: JSON.stringify(updateData),
        userId: req.session.userId!
      });
      
      res.json(updatedLine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update budget line" });
    }
  });

  app.delete("/api/budget-lines/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existingLine = await storage.getBudgetLine(id);
      if (!existingLine) {
        return res.status(404).json({ message: "Budget line not found" });
      }
      
      // Check permissions - only owners or higher roles can delete
      const user = await storage.getUser(req.session.userId!);
      if (user?.role === "user" && existingLine.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const deleted = await storage.deleteBudgetLine(id);
      
      if (deleted) {
        // Create history entry
        await storage.createBudgetHistory({
          budgetLineId: id,
          action: "deleted",
          oldValues: JSON.stringify(existingLine),
          userId: req.session.userId!
        });
        
        res.json({ message: "Budget line deleted successfully" });
      } else {
        res.status(404).json({ message: "Budget line not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget line" });
    }
  });

  // Budget analysis routes
  app.get("/api/budget-analysis/summary/:year", requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const summary = await storage.getBudgetSummary(year);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget summary" });
    }
  });

  app.get("/api/budget-analysis/variances/:year", requireAuth, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const variances = await storage.getBudgetVariances(year);
      res.json(variances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget variances" });
    }
  });

  // Consolidation routes (for department heads and above)
  app.get("/api/consolidation/pending", requireRole(["chef_dept", "direction", "comptable"]), async (req, res) => {
    try {
      const { year } = req.query;
      const filters: any = { status: "pending" };
      if (year) filters.year = parseInt(year as string);
      
      const pendingLines = await storage.getBudgetLines(filters);
      res.json(pendingLines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending budget lines" });
    }
  });

  // Route pour soumettre une ligne budgétaire pour validation
  app.post("/api/budget-lines/:id/submit", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existingLine = await storage.getBudgetLine(id);
      if (!existingLine) {
        return res.status(404).json({ message: "Budget line not found" });
      }
      
      // Check permissions - only owners can submit their own lines
      const user = await storage.getUser(req.session.userId!);
      if (user?.role === "user" && existingLine.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Only draft lines can be submitted
      if (existingLine.status !== "draft") {
        return res.status(400).json({ message: "Only draft lines can be submitted" });
      }
      
      const updatedLine = await storage.updateBudgetLine(id, { status: "pending" });
      
      // Create history entry
      await storage.createBudgetHistory({
        budgetLineId: id,
        action: "submitted",
        oldValues: JSON.stringify({ status: "draft" }),
        newValues: JSON.stringify({ status: "pending" }),
        userId: req.session.userId!
      });
      
      res.json(updatedLine);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit budget line" });
    }
  });

  app.post("/api/consolidation/validate/:id", requireRole(["chef_dept", "direction", "comptable"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { approved, rejectionReason } = req.body;
      
      const status = approved ? "validated" : "rejected";
      const updateData: any = { 
        status,
        validatedBy: req.session.userId 
      };
      
      if (!approved && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      const updatedLine = await storage.updateBudgetLine(id, updateData);
      
      // Create history entry
      await storage.createBudgetHistory({
        budgetLineId: id,
        action: approved ? "validated" : "rejected",
        newValues: JSON.stringify(updateData),
        userId: req.session.userId!
      });
      
      res.json(updatedLine);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate budget line" });
    }
  });

  // Report routes
  app.get("/api/reports", requireAuth, async (req, res) => {
    try {
      const reports = await storage.getBudgetReports(req.session.userId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports/generate", requireAuth, async (req, res) => {
    try {
      const { year, type, format } = req.body;
      
      // This would typically generate actual Excel/PDF files
      // For now, we'll create a mock report entry
      const report = await storage.createBudgetReport({
        userId: req.session.userId!,
        year: parseInt(year),
        type: `${type}_${format}`,
        filename: `Budget_${year}_${type}.${format}`,
        filePath: `/reports/Budget_${year}_${type}.${format}`,
        fileSize: Math.floor(Math.random() * 1000000) + 50000, // Mock file size
      });
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.delete("/api/reports/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBudgetReport(id);
      
      if (deleted) {
        res.json({ message: "Report deleted successfully" });
      } else {
        res.status(404).json({ message: "Report not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize budget categories with UCAD data
async function initializeBudgetCategories() {
  try {
    const existingCategories = await storage.getBudgetCategories();
    
    if (existingCategories.length === 0) {
      console.log("Initializing budget categories...");
      
      for (const category of budgetCategories) {
        await storage.createBudgetCategory(category);
      }
      
      console.log("Budget categories initialized successfully");
    }
  } catch (error) {
    console.error("Failed to initialize budget categories:", error);
  }
}

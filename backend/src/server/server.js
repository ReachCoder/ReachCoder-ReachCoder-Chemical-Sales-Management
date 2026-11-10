
import express from "express";
import cors from "cors";
import "dotenv/config";

import { prisma } from "../config/prisma.js";
import customerRoutes from "../routes/customer.routes.js";
import productRoutes from "../routes/product.routes.js";
import saleRoutes from "../routes/sale.routes.js";
import paymentRoutes from "../routes/payment.routes.js";
import dashboardRoutes from "../routes/dashboard.routes.js";
import auditLogRoutes from "../routes/audit-log.routes.js";
import telegramNotificationRoutes from "../routes/telegram-notification.routes.js";
import stockRoutes from "../routes/stock.routes.js";
import stockReportRoutes from "../routes/stock-report.routes.js";
import salesReportRoutes from "../routes/sales-report.routes.js";
import paymentReportRoutes from "../routes/payment-report.routes.js";
import customerReportRoutes from "../routes/customer-report.routes.js";
import authRoutes from "../routes/auth.routes.js";
import userRoutes from "../routes/user.routes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger.js";

const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "https://reach-coder-reach-coder-chemical-sa-eight.vercel.app",
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Customer Routes
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/telegram-notifications", telegramNotificationRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/stock-report", stockReportRoutes);
app.use("/api/sales-report", salesReportRoutes);
app.use("/api/payment-report", paymentReportRoutes);
app.use("/api/customer-report", customerReportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);


// Home API
app.get("/", (req, res) => {
  res.json({
    message: "Chemical Sales Management API",
    status: "Running",
  });
});

// Test Database
app.get("/api/test-db", async (req, res) => {
  try {
    const customers = await prisma.customers.findMany({
      take: 5,
    });

    res.json({
      success: true,
      message: "Database connected successfully",
      customers: customers.map((customer) => ({
        ...customer,
        id: customer.id.toString(),
      })),
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      code: error.code || null,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

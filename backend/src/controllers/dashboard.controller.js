
import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../config/prisma.js";

// Low stock threshold
const LOW_STOCK_THRESHOLD = 10;

// Convert BigInt and Decimal to JSON-safe values
const jsonSafe = (value) => {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Prisma.Decimal) {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(jsonSafe);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        jsonSafe(val),
      ])
    );
  }

  return value;
};

// GET DASHBOARD SUMMARY
export const getDashboard = async (req, res) => {
  try {
    // Get dashboard data from database
    const [
      totalSales,
      salesSummary,
      paymentsSummary,
      totalCustomers,
      totalProducts,
      lowStockCount,
      lowStockProducts,
    ] = await Promise.all([
      // Total sales count
      prisma.sales.count(),

      // Total revenue
      prisma.sales.aggregate({
        _sum: {
          total_amount: true,
        },
      }),

      // Total payments received
      prisma.payments.aggregate({
        _sum: {
          amount_paid: true,
        },
      }),

      // Total customers
      prisma.customers.count(),

      // Total active products
      prisma.products.count({
        where: {
          is_active: true,
        },
      }),

      // Count low stock products
      prisma.products.count({
        where: {
          is_active: true,
          stock_quantity: {
            lte: LOW_STOCK_THRESHOLD,
          },
        },
      }),

      // Get low stock product details
      prisma.products.findMany({
        where: {
          is_active: true,
          stock_quantity: {
            lte: LOW_STOCK_THRESHOLD,
          },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock_quantity: true,
          price: true,
        },
        orderBy: {
          stock_quantity: "asc",
        },
      }),
    ]);

    // Calculate revenue and payments
    const totalRevenue =
      salesSummary._sum.total_amount ||
      new Prisma.Decimal(0);

    const totalPayments =
      paymentsSummary._sum.amount_paid ||
      new Prisma.Decimal(0);

    // Calculate remaining balance
    const remainingBalance = totalRevenue.minus(totalPayments);

    return res.status(200).json({
      success: true,
      message: "Dashboard data retrieved successfully",

      data: jsonSafe({
        summary: {
          total_sales: totalSales,
          total_revenue: totalRevenue,
          total_payments: totalPayments,
          remaining_balance: remainingBalance,
          total_customers: totalCustomers,
          total_products: totalProducts,
          low_stock_products: lowStockCount,
        },

        low_stock_threshold: LOW_STOCK_THRESHOLD,

        low_stock_list: lowStockProducts,
      }),
    });
  } catch (error) {
    console.error("Get dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard data",
      error: error.message,
    });
  }
};

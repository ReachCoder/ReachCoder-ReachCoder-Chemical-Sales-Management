
import { prisma } from "../config/prisma.js";

const jsonSafe = (value) =>
  JSON.parse(
    JSON.stringify(value, (_, item) =>
      typeof item === "bigint" ? item.toString() : item
    )
  );

// GET /api/stock-report
export const getStockReport = async (req, res) => {
  try {
    const LOW_STOCK_THRESHOLD = 10;

    const [
      totalProducts,
      activeProducts,
      stockSummary,
      lowStockProducts,
      outOfStockProducts,
      movementSummary,
      recentMovements,
    ] = await Promise.all([
      prisma.products.count(),

      prisma.products.count({
        where: { is_active: true },
      }),

      prisma.products.aggregate({
        where: { is_active: true },
        _sum: { stock_quantity: true },
      }),

      prisma.products.findMany({
        where: {
          is_active: true,
          stock_quantity: {
            gt: 0,
            lte: LOW_STOCK_THRESHOLD,
          },
        },
        orderBy: { stock_quantity: "asc" },
        select: {
          id: true,
          name: true,
          sku: true,
          stock_quantity: true,
        },
      }),

      prisma.products.findMany({
        where: {
          is_active: true,
          stock_quantity: 0,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock_quantity: true,
        },
      }),

      prisma.stock_movements.groupBy({
        by: ["movement_type"],
        _count: { id: true },
        _sum: { quantity: true },
      }),

      prisma.stock_movements.findMany({
        take: 10,
        orderBy: { created_at: "desc" },
        include: {
          products: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          users: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
      }),
    ]);

    const movement = {
      IN: { transactions: 0, quantity: 0 },
      OUT: { transactions: 0, quantity: 0 },
    };

    for (const item of movementSummary) {
      if (movement[item.movement_type]) {
        movement[item.movement_type] = {
          transactions: item._count.id,
          quantity: item._sum.quantity || 0,
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts,
          totalStock: stockSummary._sum.stock_quantity || 0,
        },
        stockStatus: {
          lowStockThreshold: LOW_STOCK_THRESHOLD,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          lowStockProducts: jsonSafe(lowStockProducts),
          outOfStockProducts: jsonSafe(outOfStockProducts),
        },
        movements: movement,
        recentMovements: jsonSafe(recentMovements),
      },
    });
  } catch (error) {
    console.error("Get stock report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate stock report",
      error: error.message,
    });
  }
};

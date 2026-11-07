
import { prisma } from "../config/prisma.js";

const jsonSafe = (data) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

// POST /api/stock/in
// បញ្ចូលស្តុក
export const stockIn = async (req, res) => {
  try {
    const { product_id, user_id, quantity, note } = req.body;

    if (!product_id || !user_id || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "product_id, user_id and a positive integer quantity are required",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.products.findUnique({
        where: { id: BigInt(product_id) },
      });

      if (!product || !product.is_active) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const user = await tx.users.findUnique({
        where: { id: BigInt(user_id) },
      });

      if (!user || !user.is_active) {
        throw new Error("USER_NOT_FOUND");
      }

      const stockBefore = product.stock_quantity;
      const stockAfter = stockBefore + quantity;

      const updated = await tx.products.updateMany({
        where: {
          id: product.id,
          stock_quantity: stockBefore,
          is_active: true,
        },
        data: {
          stock_quantity: stockAfter,
        },
      });

      if (updated.count !== 1) {
        throw new Error("STOCK_UPDATE_CONFLICT");
      }

      const movement = await tx.stock_movements.create({
        data: {
          product_id: product.id,
          user_id: user.id,
          movement_type: "IN",
          quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          note: note || null,
        },
        include: {
          products: true,
          users: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
      });

      return movement;
    });

    return res.status(201).json({
      success: true,
      message: "Stock added successfully",
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Stock In Error:", error);

    const errors = {
      PRODUCT_NOT_FOUND: [404, "Product not found or inactive"],
      USER_NOT_FOUND: [404, "User not found or inactive"],
      STOCK_UPDATE_CONFLICT: [409, "Stock changed. Please try again"],
    };

    if (errors[error.message]) {
      const [status, message] = errors[error.message];
      return res.status(status).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add stock",
      error: error.message,
    });
  }
};

// POST /api/stock/out
// ដកស្តុក
export const stockOut = async (req, res) => {
  try {
    const { product_id, user_id, quantity, note } = req.body;

    if (!product_id || !user_id || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "product_id, user_id and a positive integer quantity are required",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.products.findUnique({
        where: { id: BigInt(product_id) },
      });

      if (!product || !product.is_active) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const user = await tx.users.findUnique({
        where: { id: BigInt(user_id) },
      });

      if (!user || !user.is_active) {
        throw new Error("USER_NOT_FOUND");
      }

      const stockBefore = product.stock_quantity;

      if (stockBefore < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const stockAfter = stockBefore - quantity;

      const updated = await tx.products.updateMany({
        where: {
          id: product.id,
          stock_quantity: stockBefore,
          is_active: true,
        },
        data: {
          stock_quantity: stockAfter,
        },
      });

      if (updated.count !== 1) {
        throw new Error("STOCK_UPDATE_CONFLICT");
      }

      const movement = await tx.stock_movements.create({
        data: {
          product_id: product.id,
          user_id: user.id,
          movement_type: "OUT",
          quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          note: note || null,
        },
        include: {
          products: true,
          users: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
      });

      return movement;
    });

    return res.status(201).json({
      success: true,
      message: "Stock removed successfully",
      data: jsonSafe(result),
    });
  } catch (error) {
    console.error("Stock Out Error:", error);

    const errors = {
      PRODUCT_NOT_FOUND: [404, "Product not found or inactive"],
      USER_NOT_FOUND: [404, "User not found or inactive"],
      INSUFFICIENT_STOCK: [400, "Not enough stock"],
      STOCK_UPDATE_CONFLICT: [409, "Stock changed. Please try again"],
    };

    if (errors[error.message]) {
      const [status, message] = errors[error.message];
      return res.status(status).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to remove stock",
      error: error.message,
    });
  }
};

// GET /api/stock/movements
// មើលប្រវត្តិស្តុក
export const getStockMovements = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const { movement_type, product_id } = req.query;

    const where = {};

    if (movement_type) {
      if (!["IN", "OUT"].includes(movement_type)) {
        return res.status(400).json({
          success: false,
          message: "movement_type must be IN or OUT",
        });
      }
      where.movement_type = movement_type;
    }

    if (product_id) {
      try {
        where.product_id = BigInt(product_id);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid product_id",
        });
      }
    }

    const [movements, total] = await prisma.$transaction([
      prisma.stock_movements.findMany({
        where,
        include: {
          products: true,
          users: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stock_movements.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: jsonSafe(movements),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Stock Movements Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve stock movements",
      error: error.message,
    });
  }
};

// GET /api/stock/movements/:id
// មើលប្រវត្តិតាម ID
export const getStockMovementById = async (req, res) => {
  try {
    let id;

    try {
      id = BigInt(req.params.id);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid movement ID",
      });
    }

    const movement = await prisma.stock_movements.findUnique({
      where: { id },
      include: {
        products: true,
        users: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    });

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: "Stock movement not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: jsonSafe(movement),
    });
  } catch (error) {
    console.error("Get Stock Movement Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve stock movement",
      error: error.message,
    });
  }
};


import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../config/prisma.js";
import { sendTelegramMessage } from "../services/telegram.service.js";
import { sendLowStockAlert } from "../services/stock-alert.service.js";

// Convert BigInt and Decimal to strings before returning JSON
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

// GET ALL SALES
export const getSales = async (req, res) => {
  try {
    const sales = await prisma.sales.findMany({
      include: {
        customers: true,
        sale_items: true,
        payments: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: sales.length,
      data: jsonSafe(sales),
    });
  } catch (error) {
    console.error("Get sales error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get sales",
      error: error.message,
    });
  }
};

// GET SALE BY ID
export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID",
      });
    }

    const sale = await prisma.sales.findUnique({
      where: {
        id: BigInt(id),
      },
      include: {
        customers: true,
        sale_items: true,
        payments: true,
      },
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: jsonSafe(sale),
    });
  } catch (error) {
    console.error("Get sale by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get sale",
      error: error.message,
    });
  }
};

// CREATE SALE
export const createSale = async (req, res) => {
  try {
    const { customer_id, user_id, items, note } = req.body;

    // Validate required fields
    if (
      !customer_id ||
      !user_id ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "customer_id, user_id and items are required",
      });
    }

    // Validate IDs
    if (
      !/^\d+$/.test(String(customer_id)) ||
      !/^\d+$/.test(String(user_id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer_id or user_id",
      });
    }

    // Validate items and combine duplicate product IDs
    const productQuantities = new Map();

    for (const item of items) {
      const productId = String(item.product_id ?? "");
      const quantity = Number(item.quantity);

      if (!/^\d+$/.test(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product_id",
        });
      }

      if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive integer",
        });
      }

      const currentQuantity = productQuantities.get(productId) || 0;
      const newQuantity = currentQuantity + quantity;

      if (!Number.isSafeInteger(newQuantity)) {
        return res.status(400).json({
          success: false,
          message: "Total product quantity is too large",
        });
      }

      productQuantities.set(productId, newQuantity);
    }

    const customerId = BigInt(customer_id);
    const userId = BigInt(user_id);
    const lowStockProducts = [];

    // Generate sale number
    const saleNumber = `SALE-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // CREATE SALE INSIDE TRANSACTION
    const sale = await prisma.$transaction(async (tx) => {
      // Check customer
      const customer = await tx.customers.findUnique({
        where: {
          id: customerId,
        },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      // Check user
      const user = await tx.users.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.is_active === false) {
        throw new Error("User is inactive");
      }

      let totalAmount = new Prisma.Decimal(0);
      const saleItemsData = [];

      // Check products, calculate total and deduct stock
      for (const [productId, quantity] of productQuantities) {
        const product = await tx.products.findUnique({
          where: {
            id: BigInt(productId),
          },
        });

        if (!product) {
          throw new Error(`Product ID ${productId} not found`);
        }

        if (product.is_active === false) {
          throw new Error(`Product ${product.name} is inactive`);
        }

        const stockBefore = product.stock_quantity;

        if (stockBefore < quantity) {
          throw new Error(
            `Not enough stock for ${product.name}. Available: ${stockBefore}, Requested: ${quantity}`
          );
        }

        const subtotal = new Prisma.Decimal(product.price).mul(quantity);

        totalAmount = totalAmount.plus(subtotal);

        // Do not insert subtotal because it is a generated column
        saleItemsData.push({
          product_id: product.id,
          product_name_snapshot: product.name,
          quantity,
          unit_price: product.price,
        });

        // Deduct stock safely.
        // Match the stock value read above to avoid recording
        // an incorrect stock_before during concurrent updates.
        const stockUpdate = await tx.products.updateMany({
          where: {
            id: product.id,
            stock_quantity: stockBefore,
            is_active: true,
          },
          data: {
            stock_quantity: {
              decrement: quantity,
            },
          },
        });

        if (stockUpdate.count !== 1) {
          throw new Error(
            `Stock changed for ${product.name}. Please try again`
          );
        }

        const stockAfter = stockBefore - quantity;

        // CREATE STOCK MOVEMENT (OUT)
        await tx.stock_movements.create({
          data: {
            product_id: product.id,
            user_id: userId,
            movement_type: "OUT",
            quantity,
            stock_before: stockBefore,
            stock_after: stockAfter,
            note: `Sale ${saleNumber}`,
          },
        });

        // Check if stock drops from above 10 to 10 or below
        if (
          stockBefore > 10 &&
          stockAfter <= 10
        ) {
          lowStockProducts.push({
            product: {
              id: product.id,
              name: product.name,
              sku: product.sku,
            },
            currentStock: stockAfter,
          });
        }
      }

      // Create sale
      const newSale = await tx.sales.create({
        data: {
          sale_number: saleNumber,
          customer_id: customerId,
          user_id: userId,
          total_amount: totalAmount,
          note: typeof note === "string" ? note.trim() || null : null,
          sale_items: {
            create: saleItemsData,
          },
        },
        include: {
          customers: true,
          sale_items: true,
          payments: true,
        },
      });

      return newSale;
    });

    // =====================================
    // SEND TELEGRAM SALE NOTIFICATION
    // =====================================

    try {
      const itemsMessage = sale.sale_items
        .map((item) => {
          const subtotal = new Prisma.Decimal(item.unit_price)
            .mul(item.quantity);

          return `- ${item.product_name_snapshot} x ${item.quantity} = $${subtotal.toFixed(2)}`;
        })
        .join("\n");

      const customerName =
        sale.customers?.name || `Customer ID: ${sale.customer_id}`;

      const telegramMessage = `
🛒 NEW SALE

Sale Number: ${sale.sale_number}
Customer: ${customerName}

Products:
${itemsMessage}

Total Amount: $${new Prisma.Decimal(sale.total_amount).toFixed(2)}

Date: ${new Date().toLocaleString("en-GB", {
        timeZone: "Asia/Phnom_Penh",
      })}

Chemical Sales Management System
      `.trim();

      // Save notification as PENDING
      const notification = await prisma.telegram_notifications.create({
        data: {
          customer_id: sale.customer_id,
          sale_id: sale.id,
          chat_id: process.env.TELEGRAM_CHAT_ID || null,
          message: telegramMessage,
          status: "PENDING",
        },
      });

      try {
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!chatId) {
          throw new Error("Telegram Chat ID is missing");
        }

        await sendTelegramMessage(telegramMessage, chatId);

        await prisma.telegram_notifications.update({
          where: {
            id: notification.id,
          },
          data: {
            status: "SENT",
            sent_at: new Date(),
            error_message: null,
          },
        });
      } catch (telegramError) {
        console.error("Telegram send error:", telegramError);

        await prisma.telegram_notifications.update({
          where: {
            id: notification.id,
          },
          data: {
            status: "FAILED",
            error_message: telegramError.message,
          },
        });
      }
    } catch (notificationError) {
      // Notification failure must not cancel an already-created sale
      console.error("Save notification error:", notificationError);
    }

    // =====================================
    // SEND LOW STOCK TELEGRAM ALERT
    // =====================================

    for (const item of lowStockProducts) {
      try {
        await sendLowStockAlert({
          product: item.product,
          currentStock: item.currentStock,
          saleId: sale.id,
        });
      } catch (error) {
        console.error(
          `Low stock alert failed for ${item.product.name}:`,
          error
        );
      }
    }

    // =====================================
    // RETURN SALE RESPONSE
    // =====================================

    return res.status(201).json({
      success: true,
      message: "Sale created successfully",
      data: jsonSafe(sale),
    });
  } catch (error) {
    console.error("Create sale error:", error);

    const message = error.message || "Failed to create sale";

    const isClientError =
      message.includes("not found") ||
      message.includes("inactive") ||
      message.includes("Not enough stock") ||
      message.includes("Stock changed");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: isClientError ? message : "Failed to create sale",
      error: message,
    });
  }
};

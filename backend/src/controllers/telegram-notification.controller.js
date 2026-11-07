
import { prisma } from "../config/prisma.js";
import { sendTelegramMessage } from "../services/telegram.service.js";

// Convert BigInt, Decimal and Date to JSON-safe values
const jsonSafe = (value) => {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value.toFixed === "function") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(jsonSafe);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        jsonSafe(val),
      ])
    );
  }

  return value;
};

// GET ALL NOTIFICATIONS
export const getAllNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const { status } = req.query;

    const where = {};

    if (status) {
      where.status = String(status).toUpperCase();
    }

    const [notifications, total] = await Promise.all([
      prisma.telegram_notifications.findMany({
        where,
        include: {
          customers: true,
          sales: true,
          payments: true,
        },
        orderBy: {
          created_at: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.telegram_notifications.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: jsonSafe(notifications),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve notifications",
    });
  }
};

// GET NOTIFICATION BY ID
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification =
      await prisma.telegram_notifications.findUnique({
        where: {
          id: BigInt(id),
        },
        include: {
          customers: true,
          sales: true,
          payments: true,
        },
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: jsonSafe(notification),
    });
  } catch (error) {
    console.error("Get notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve notification",
    });
  }
};

// CREATE AND SEND NOTIFICATION
export const createNotification = async (req, res) => {
  try {
    const {
      customer_id,
      sale_id,
      payment_id,
      chat_id,
      message,
    } = req.body;

    if (
      message === undefined ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    const validateOptionalId = (value) =>
      value === undefined ||
      value === null ||
      /^\d+$/.test(String(value));

    if (
      !validateOptionalId(customer_id) ||
      !validateOptionalId(sale_id) ||
      !validateOptionalId(payment_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer_id, sale_id or payment_id",
      });
    }

    if (customer_id != null) {
      const customer = await prisma.customers.findUnique({
        where: { id: BigInt(customer_id) },
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    }

    if (sale_id != null) {
      const sale = await prisma.sales.findUnique({
        where: { id: BigInt(sale_id) },
      });

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }
    }

    if (payment_id != null) {
      const payment = await prisma.payments.findUnique({
        where: { id: BigInt(payment_id) },
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }
    }

    const targetChatId =
      typeof chat_id === "string" && chat_id.trim()
        ? chat_id.trim()
        : process.env.TELEGRAM_CHAT_ID;

    // Save notification as PENDING
    const notification =
      await prisma.telegram_notifications.create({
        data: {
          customer_id:
            customer_id != null ? BigInt(customer_id) : null,
          sale_id: sale_id != null ? BigInt(sale_id) : null,
          payment_id:
            payment_id != null ? BigInt(payment_id) : null,
          chat_id: targetChatId || null,
          message: message.trim(),
          status: "PENDING",
        },
      });

    try {
      await sendTelegramMessage(
        message.trim(),
        targetChatId
      );

      const updated =
        await prisma.telegram_notifications.update({
          where: { id: notification.id },
          data: {
            status: "SENT",
            sent_at: new Date(),
            error_message: null,
          },
        });

      return res.status(201).json({
        success: true,
        message: "Telegram notification sent successfully",
        data: jsonSafe(updated),
      });
    } catch (telegramError) {
      const updated =
        await prisma.telegram_notifications.update({
          where: { id: notification.id },
          data: {
            status: "FAILED",
            error_message: telegramError.message,
          },
        });

      return res.status(201).json({
        success: true,
        message: "Notification saved but Telegram sending failed",
        data: jsonSafe(updated),
      });
    }
  } catch (error) {
    console.error("Create notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
};

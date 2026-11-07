
import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../config/prisma.js";
import { sendTelegramMessage } from "../services/telegram.service.js";

// =====================================
// JSON SAFE
// =====================================

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

// =====================================
// GET ALL PAYMENTS
// =====================================

export const getPayments = async (req, res) => {
  try {
    const payments = await prisma.payments.findMany({
      include: {
        sales: {
          include: {
            customers: true,
          },
        },
        users: true,
      },
      orderBy: {
        payment_date: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: jsonSafe(payments),
    });
  } catch (error) {
    console.error("Get payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get payments",
      error: error.message,
    });
  }
};

// =====================================
// GET PAYMENT BY ID
// =====================================

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await prisma.payments.findUnique({
      where: {
        id: BigInt(id),
      },
      include: {
        sales: {
          include: {
            customers: true,
          },
        },
        users: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: jsonSafe(payment),
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get payment",
      error: error.message,
    });
  }
};

// =====================================
// CREATE PAYMENT
// =====================================

export const createPayment = async (req, res) => {
  try {
    const {
      sale_id,
      user_id,
      amount_paid,
      payment_method = "CASH",
      payment_date,
      note,
    } = req.body;

    // Validate required fields
    if (
      sale_id === undefined ||
      user_id === undefined ||
      amount_paid === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "sale_id, user_id and amount_paid are required",
      });
    }

    // Validate IDs
    if (
      !/^\d+$/.test(String(sale_id)) ||
      !/^\d+$/.test(String(user_id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale_id or user_id",
      });
    }

    // Validate amount
    const amountString = String(amount_paid).trim();

    if (
      !/^\d+(\.\d{1,2})?$/.test(amountString) ||
      !Number.isFinite(Number(amountString)) ||
      Number(amountString) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "amount_paid must be a positive number with up to 2 decimal places",
      });
    }

    // Validate payment method
    if (
      typeof payment_method !== "string" ||
      payment_method.trim().length === 0 ||
      payment_method.trim().length > 30
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment_method",
      });
    }

    // Validate payment date
    let parsedPaymentDate;

    if (payment_date !== undefined) {
      parsedPaymentDate = new Date(payment_date);

      if (Number.isNaN(parsedPaymentDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment_date",
        });
      }
    }

    const saleId = BigInt(sale_id);
    const userId = BigInt(user_id);
    const amount = new Prisma.Decimal(amountString);

    // =====================================
    // DATABASE TRANSACTION
    // =====================================

    const result = await prisma.$transaction(
      async (tx) => {
        // Check sale
        const sale = await tx.sales.findUnique({
          where: {
            id: saleId,
          },
        });

        if (!sale) {
          throw new Error("Sale not found");
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

        // Calculate previous payment
        const paymentSummary = await tx.payments.aggregate({
          where: {
            sale_id: saleId,
          },
          _sum: {
            amount_paid: true,
          },
        });

        const previousPaid =
          paymentSummary._sum.amount_paid ||
          new Prisma.Decimal(0);

        const totalAmount = new Prisma.Decimal(
          sale.total_amount
        );

        const remaining = totalAmount.minus(previousPaid);

        // Prevent overpayment
        if (amount.greaterThan(remaining)) {
          throw new Error(
            `Payment exceeds remaining balance. Remaining: ${remaining.toFixed(2)}`
          );
        }

        // Create payment
        const payment = await tx.payments.create({
          data: {
            sale_id: saleId,
            user_id: userId,
            amount_paid: amount,
            payment_method: payment_method.trim().toUpperCase(),

            ...(parsedPaymentDate
              ? { payment_date: parsedPaymentDate }
              : {}),

            note:
              typeof note === "string"
                ? note.trim() || null
                : null,
          },
          include: {
            sales: {
              include: {
                customers: true,
              },
            },
            users: true,
          },
        });

        const totalPaid = previousPaid.plus(amount);

        const newRemaining = totalAmount.minus(totalPaid);

        return {
          payment,
          summary: {
            total_amount: totalAmount,
            previous_paid: previousPaid,
            amount_paid: amount,
            total_paid: totalPaid,
            remaining_balance: newRemaining,
          },
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    // =====================================
    // TELEGRAM NOTIFICATION
    // =====================================

    const payment = result.payment;

    const customer = payment.sales?.customers;

    // Customer name fallback
    const customerName =
      customer?.name ||
      customer?.customer_name ||
      `Customer ID: ${payment.sales?.customer_id}`;

    const telegramMessage = `
💰 NEW PAYMENT RECEIVED

Payment ID: ${payment.id}
Sale ID: ${payment.sale_id}

Customer: ${customerName}

Amount Paid: $${new Prisma.Decimal(
      payment.amount_paid
    ).toFixed(2)}

Payment Method: ${payment.payment_method}

Total Amount: $${result.summary.total_amount.toFixed(2)}
Previous Paid: $${result.summary.previous_paid.toFixed(2)}
Total Paid: $${result.summary.total_paid.toFixed(2)}
Remaining Balance: $${result.summary.remaining_balance.toFixed(2)}

Date: ${new Date(payment.payment_date).toLocaleString()}
`;

    // Save notification and send Telegram
    try {
      const notification =
        await prisma.telegram_notifications.create({
          data: {
            customer_id:
              payment.sales?.customer_id ?? null,

            sale_id: payment.sale_id,

            payment_id: payment.id,

            chat_id:
              process.env.TELEGRAM_CHAT_ID || null,

            message: telegramMessage,

            status: "PENDING",
          },
        });

      try {
        // Send Telegram
        await sendTelegramMessage(
          telegramMessage,
          process.env.TELEGRAM_CHAT_ID
        );

        // Update SENT
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
        // Update FAILED
        await prisma.telegram_notifications.update({
          where: {
            id: notification.id,
          },
          data: {
            status: "FAILED",
            error_message: telegramError.message,
          },
        });

        console.error(
          "Telegram sending failed:",
          telegramError.message
        );
      }

    } catch (notificationError) {
      console.error(
        "Notification database error:",
        notificationError.message
      );
    }

    // =====================================
    // RETURN RESPONSE
    // =====================================

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: jsonSafe(result),
    });

  } catch (error) {
    console.error("Create payment error:", error);

    const message =
      error.message || "Failed to create payment";

    const isClientError =
      message.includes("not found") ||
      message.includes("inactive") ||
      message.includes("exceeds remaining balance");

    return res.status(isClientError ? 400 : 500).json({
      success: false,

      message: isClientError
        ? message
        : "Failed to create payment",

      error: message,
    });
  }
};

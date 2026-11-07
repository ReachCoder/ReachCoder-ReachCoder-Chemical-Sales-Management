
import { prisma } from "../config/prisma.js";
import { sendTelegramMessage } from "./telegram.service.js";

const LOW_STOCK_THRESHOLD = 10;

export const sendLowStockAlert = async ({
  product,
  currentStock,
  saleId,
}) => {
  if (currentStock > LOW_STOCK_THRESHOLD) {
    return;
  }

  const telegramMessage = `
⚠️ LOW STOCK ALERT

Product: ${product.name}
SKU: ${product.sku || "N/A"}

Current Stock: ${currentStock}
Minimum Stock: ${LOW_STOCK_THRESHOLD}

Sale ID: ${saleId}

Please restock this product.

Chemical Sales Management System
  `.trim();

  const notification = await prisma.telegram_notifications.create({
    data: {
      sale_id: saleId,
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
  } catch (error) {
    console.error("Low stock Telegram error:", error);

    await prisma.telegram_notifications.update({
      where: {
        id: notification.id,
      },
      data: {
        status: "FAILED",
        error_message: error.message,
      },
    });
  }
};

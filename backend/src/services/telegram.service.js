
import "dotenv/config";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEFAULT_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const sendTelegramMessage = async (
  message,
  chatId = DEFAULT_CHAT_ID
) => {
  if (!BOT_TOKEN || !chatId) {
    throw new Error("Telegram Bot Token or Chat ID is missing");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result.description || "Failed to send Telegram message"
    );
  }

  return result.result;
};

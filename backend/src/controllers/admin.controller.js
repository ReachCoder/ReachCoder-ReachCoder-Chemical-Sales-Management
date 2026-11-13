
import { prisma } from "../config/prisma.js";

const BUSINESS_TABLES = [
  "telegram_notifications",
  "payments",
  "sale_items",
  "stock_movements",
  "sales",
  "audit_logs",
  "customers",
  "products",
];

const getVerifiedTarget = () => {
  const target = process.env.DATABASE_TARGET;
  const connectionString = process.env.DATABASE_URL;

  if (!target || !connectionString) {
    throw new Error("Database target is not configured");
  }

  const url = new URL(connectionString);
  const host = url.hostname.toLowerCase();
  const database = url.pathname.replace("/", "");

  if (database !== "chemical_sales_db") {
    throw new Error("Unexpected database name");
  }

  if (target === "NEON" && !host.endsWith(".neon.tech")) {
    throw new Error("Database host does not match NEON target");
  }

  if (
    target === "LOCAL" &&
    !["localhost", "127.0.0.1", "::1"].includes(host)
  ) {
    throw new Error("Database host does not match LOCAL target");
  }

  if (!["LOCAL", "NEON"].includes(target)) {
    throw new Error("Invalid database target");
  }

  return target;
};

// Preview business data
export const previewCleanup = async (req, res) => {
  try {
    const target = getVerifiedTarget();
    const counts = {};

    for (const table of BUSINESS_TABLES) {
      counts[table] = await prisma[table].count();
    }

    const usersCount = await prisma.users.count();

    res.json({
      success: true,
      target,
      database: "chemical_sales_db",
      businessData: counts,
      totalBusinessRecords: Object.values(counts).reduce(
        (sum, count) => sum + count,
        0
      ),
      preserved: {
        users: usersCount,
        migrations: true,
      },
    });
  } catch (error) {
    console.error("Preview cleanup error:", error.message);

    res.status(400).json({
      success: false,
      message: "Database target verification failed",
    });
  }
};

// Execute business data cleanup
export const executeCleanup = async (req, res) => {
  try {
    const target = getVerifiedTarget();
    const { confirmation, expectedCounts } = req.body;

    if (confirmation !== `CLEAR ${target} BUSINESS DATA`) {
      return res.status(400).json({
        success: false,
        message: "Confirmation does not match database target",
      });
    }

    if (
      !expectedCounts ||
      typeof expectedCounts !== "object" ||
      Array.isArray(expectedCounts) ||
      Object.keys(expectedCounts).length !== BUSINESS_TABLES.length ||
      BUSINESS_TABLES.some(
        (table) =>
          !Number.isSafeInteger(expectedCounts[table]) ||
          expectedCounts[table] < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid preview counts are required",
      });
    }

    const deleted = await prisma.$transaction(
      async (tx) => {
        const currentCounts = {};

        for (const table of BUSINESS_TABLES) {
          currentCounts[table] = await tx[table].count();
        }

        const unchanged = BUSINESS_TABLES.every(
          (table) => currentCounts[table] === expectedCounts[table]
        );

        if (!unchanged) {
          throw new Error("PREVIEW_CHANGED");
        }

        const result = {};

        for (const table of BUSINESS_TABLES) {
          const response = await tx[table].deleteMany();
          result[table] = response.count;
        }

        return result;
      },
      {
        isolationLevel: "Serializable",
      }
    );

    res.json({
      success: true,
      target,
      message: "Business data cleared successfully",
      deleted,
      preserved: ["users", "_prisma_migrations"],
    });
  } catch (error) {
    console.error("Execute cleanup error:", error);

    if (error.message === "PREVIEW_CHANGED") {
      return res.status(409).json({
        success: false,
        message: "Data changed since preview. Please preview again.",
      });
    }

    res.status(400).json({
      success: false,
      message: "Cleanup failed. Transaction was not committed.",
    });
  }
};

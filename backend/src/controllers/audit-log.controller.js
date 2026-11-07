
import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../config/prisma.js";

const jsonSafe = (value) => {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Prisma.Decimal) return value.toString();
  if (value instanceof Date) return value.toISOString();

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

// GET ALL AUDIT LOGS
export const getAllAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );
    const skip = (page - 1) * limit;

    const { action, entity, user_id } = req.query;

    const where = {};

    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entity) where.entity = { contains: entity, mode: "insensitive" };

    if (user_id) {
      if (!/^\d+$/.test(user_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user_id",
        });
      }

      where.user_id = BigInt(user_id);
    }

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.audit_logs.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: jsonSafe(logs),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve audit logs",
    });
  }
};

// GET AUDIT LOG BY ID
export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit log ID",
      });
    }

    const log = await prisma.audit_logs.findUnique({
      where: { id: BigInt(id) },
      include: {
        users: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: jsonSafe(log),
    });
  } catch (error) {
    console.error("Get audit log error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve audit log",
    });
  }
};

// CREATE AUDIT LOG
export const createAuditLog = async (req, res) => {
  try {
    const { user_id, action, entity, entity_id, details } = req.body;

    if (!action || !entity) {
      return res.status(400).json({
        success: false,
        message: "action and entity are required",
      });
    }

    if (
      typeof action !== "string" ||
      action.trim().length > 100 ||
      typeof entity !== "string" ||
      entity.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "action and entity must be strings with max 100 characters",
      });
    }

    if (
      user_id !== undefined &&
      user_id !== null &&
      !/^\d+$/.test(String(user_id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user_id",
      });
    }

    if (
      entity_id !== undefined &&
      entity_id !== null &&
      !/^\d+$/.test(String(entity_id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid entity_id",
      });
    }

    const log = await prisma.audit_logs.create({
      data: {
        user_id:
          user_id !== undefined && user_id !== null
            ? BigInt(user_id)
            : null,
        action: action.trim(),
        entity: entity.trim(),
        entity_id:
          entity_id !== undefined && entity_id !== null
            ? BigInt(entity_id)
            : null,
        details: details ?? undefined,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Audit log created successfully",
      data: jsonSafe(log),
    });
  } catch (error) {
    console.error("Create audit log error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create audit log",
    });
  }
};

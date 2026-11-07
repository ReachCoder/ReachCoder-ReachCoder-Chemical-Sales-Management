
import express from "express";

import {
  getAllAuditLogs,
  getAuditLogById,
  createAuditLog,
} from "../controllers/audit-log.controller.js";

const router = express.Router();

router.get("/", getAllAuditLogs);
router.get("/:id", getAuditLogById);
router.post("/", createAuditLog);

export default router;

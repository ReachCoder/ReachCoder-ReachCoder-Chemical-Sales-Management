
import express from "express";

import {
  previewCleanup,
  executeCleanup,
} from "../controllers/admin.controller.js";

import {
  authenticateToken,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/cleanup/preview",
  authenticateToken,
  authorizeRoles("ADMIN"),
  previewCleanup
);

router.post(
  "/cleanup/execute",
  authenticateToken,
  authorizeRoles("ADMIN"),
  executeCleanup
);

export default router;

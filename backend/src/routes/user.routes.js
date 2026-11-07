import express from "express";

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  changeUserPassword,
} from "../controllers/user.controller.js";

import {
  authenticateToken,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin only
router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/status", updateUserStatus);
router.patch("/:id/password", changeUserPassword);

export default router;
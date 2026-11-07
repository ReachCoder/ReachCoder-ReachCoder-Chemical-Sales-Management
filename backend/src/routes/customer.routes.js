
import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";

import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";

const router = express.Router();

// Protect all customer routes
router.use(authenticateToken);

router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;


import express from "express";

import {
  getPayments,
  getPaymentById,
  createPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.get("/", getPayments);
router.get("/:id", getPaymentById);
router.post("/", createPayment);

export default router;

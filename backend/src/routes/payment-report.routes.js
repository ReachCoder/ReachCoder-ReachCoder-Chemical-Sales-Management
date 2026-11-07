import express from "express";
import { getPaymentReport } from "../controllers/payment-report.controller.js";

const router = express.Router();

router.get("/", getPaymentReport);

export default router;
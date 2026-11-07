import express from "express";
import { getCustomerReport } from "../controllers/customer-report.controller.js";

const router = express.Router();

router.get("/", getCustomerReport);

export default router;
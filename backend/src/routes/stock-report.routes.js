
import express from "express";
import { getStockReport } from "../controllers/stock-report.controller.js";

const router = express.Router();

router.get("/", getStockReport);

export default router;

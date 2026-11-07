
import express from "express";

import {
  getSales,
  getSaleById,
  createSale,
} from "../controllers/sale.controller.js";

const router = express.Router();

router.get("/", getSales);
router.get("/:id", getSaleById);
router.post("/", createSale);

export default router;

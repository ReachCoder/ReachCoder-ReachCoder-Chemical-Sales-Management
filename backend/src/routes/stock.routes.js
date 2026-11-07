
import express from "express";

import {
  stockIn,
  stockOut,
  getStockMovements,
  getStockMovementById,
} from "../controllers/stock.controller.js";

const router = express.Router();

router.post("/in", stockIn);
router.post("/out", stockOut);

router.get("/movements", getStockMovements);
router.get("/movements/:id", getStockMovementById);

export default router;

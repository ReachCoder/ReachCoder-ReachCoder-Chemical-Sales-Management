

import { prisma } from "../config/prisma.js";

// Helper: Convert BigInt and Decimal to JSON-safe values
const formatProduct = (product) => ({
  ...product,
  id: product.id.toString(),
  price: product.price.toString(),
});

// GET: Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: products.map(formatProduct),
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get products",
    });
  }
};

// GET: Get product by ID
export const getProductById = async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await prisma.products.findUnique({
      where: {
        id: BigInt(req.params.id),
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: formatProduct(product),
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get product",
    });
  }
};

// POST: Create product
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      price,
      stock_quantity,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock_quantity);

    if (
      price === undefined ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number",
      });
    }

    if (
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity must be a non-negative integer",
      });
    }

    const product = await prisma.products.create({
      data: {
        name: name.trim(),
        sku: sku?.trim() || null,
        description: description?.trim() || null,
        price: parsedPrice,
        stock_quantity: parsedStock,
      },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: formatProduct(product),
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "SKU already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// PUT: Update product
export const updateProduct = async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const {
      name,
      sku,
      description,
      price,
      stock_quantity,
      is_active,
    } = req.body;

    const data = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty",
        });
      }
      data.name = name.trim();
    }

    if (sku !== undefined) {
      data.sku = sku?.trim() || null;
    }

    if (description !== undefined) {
      data.description = description?.trim() || null;
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid price",
        });
      }

      data.price = parsedPrice;
    }

    if (stock_quantity !== undefined) {
      const parsedStock = Number(stock_quantity);

      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid stock quantity",
        });
      }

      data.stock_quantity = parsedStock;
    }

    if (is_active !== undefined) {
      if (typeof is_active !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "is_active must be true or false",
        });
      }

      data.is_active = is_active;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update",
      });
    }

    const product = await prisma.products.update({
      where: {
        id: BigInt(req.params.id),
      },
      data,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: formatProduct(product),
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "SKU already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// DELETE: Safely deactivate product
export const deleteProduct = async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await prisma.products.update({
      where: {
        id: BigInt(req.params.id),
      },
      data: {
        is_active: false,
      },
    });

    res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
      data: formatProduct(product),
    });
  } catch (error) {
    console.error("Deactivate product error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to deactivate product",
    });
  }
};

import { prisma } from "../config/prisma.js";

// GET: Get all customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customers.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: customers.map((customer) => ({
        ...customer,
        id: customer.id.toString(),
      })),
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get customers",
    });
  }
};

// GET: Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await prisma.customers.findUnique({
      where: {
        id: BigInt(req.params.id),
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...customer,
        id: customer.id.toString(),
      },
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(400).json({
      success: false,
      message: "Invalid customer ID",
    });
  }
};

// POST: Create customer
export const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, telegram_chat_id, note } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const customer = await prisma.customers.create({
      data: {
        name: name.trim(),
        phone,
        email,
        address,
        telegram_chat_id,
        note,
      },
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        ...customer,
        id: customer.id.toString(),
      },
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

// PUT: Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, telegram_chat_id, note } = req.body;

    const customer = await prisma.customers.update({
      where: {
        id: BigInt(req.params.id),
      },
      data: {
        name,
        phone,
        email,
        address,
        telegram_chat_id,
        note,
      },
    });

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: {
        ...customer,
        id: customer.id.toString(),
      },
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(400).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

// DELETE: Deactivate customer
export const deleteCustomer = async (req, res) => {
  try {
    const customerId = BigInt(req.params.id);

    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (!customer.is_active) {
      return res.status(400).json({
        success: false,
        message: "Customer is already inactive.",
      });
    }

    await prisma.customers.update({
      where: { id: customerId },
      data: { is_active: false },
    });

    return res.status(200).json({
      success: true,
      message: "Customer deactivated successfully.",
    });
  } catch (error) {
    console.error("Deactivate customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate customer.",
    });
  }
};
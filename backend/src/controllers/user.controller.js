import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";

// GET: បង្ហាញ Users ទាំងអស់
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { id: "desc" },
    });

    res.json({
      success: true,
      data: users.map((user) => ({
        ...user,
        id: user.id.toString(),
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET: បង្ហាញ User តាម ID
export const getUserById = async (req, res) => {
  try {
    const id = BigInt(req.params.id);

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }
};

// POST: បង្កើត User ថ្មី
export const createUser = async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: "Username, password and full_name are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const userRole = role || "STAFF";

    if (!["ADMIN", "STAFF"].includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const existingUser = await prisma.users.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await prisma.users.create({
      data: {
        username,
        password_hash,
        full_name,
        role: userRole,
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT: កែប្រែព័ត៌មាន User
export const updateUser = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { username, full_name, role } = req.body;

    const existingUser = await prisma.users.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (role && !["ADMIN", "STAFF"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    if (username && username !== existingUser.username) {
      const duplicate = await prisma.users.findUnique({
        where: { username },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }
    }

    const data = {
      updated_at: new Date(),
    };

    if (username !== undefined) data.username = username;
    if (full_name !== undefined) data.full_name = full_name;
    if (role !== undefined) data.role = role;

    const user = await prisma.users.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        is_active: true,
        updated_at: true,
      },
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH: បើក ឬ បិទ User
export const updateUserStatus = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_active must be true or false",
      });
    }

    const user = await prisma.users.update({
      where: { id },
      data: {
        is_active,
        updated_at: new Date(),
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true,
        is_active: true,
      },
    });

    res.json({
      success: true,
      message: "User status updated successfully",
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
};

// PATCH: ផ្លាស់ប្ដូរ Password
export const changeUserPassword = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const password_hash = await bcrypt.hash(new_password, 12);

    await prisma.users.update({
      where: { id },
      data: {
        password_hash,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
};
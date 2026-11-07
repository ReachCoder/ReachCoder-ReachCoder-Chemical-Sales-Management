import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

const createToken = (user) => {
  return jwt.sign(
    {
      sub: user.id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const user = await prisma.users.findUnique({
      where: {
        username: username.trim(),
      },
    });

    // Use the same response for unknown usernames and wrong passwords.
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id.toString(),
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: {
        id: BigInt(req.user.id),
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

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: "User account is unavailable",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    console.error("Get Current User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve current user",
    });
  }
};
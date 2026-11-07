import { body, param } from "express-validator";

export const createCustomerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Customer name is required")
    .isLength({ max: 150 })
    .withMessage("Customer name must not exceed 150 characters"),

  body("phone")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 30 })
    .withMessage("Phone must not exceed 30 characters"),

  body("email")
    .optional({ values: "null" })
    .trim()
    .isEmail()
    .withMessage("Invalid email address"),
];

export const customerIdValidation = [
  param("id")
    .matches(/^[1-9]\d*$/)
    .withMessage("Invalid customer ID"),
];
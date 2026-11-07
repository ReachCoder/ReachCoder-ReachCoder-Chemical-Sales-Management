
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Chemical Sales Management API",
      version: "1.0.0",
      description:
        "API documentation for Chemical Sales Management System",
    },

    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);

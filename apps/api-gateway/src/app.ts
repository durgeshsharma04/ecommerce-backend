import express from "express";
import dotenv from "dotenv";
import path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";
import AppError from "@utils/AppError";
import { errorHandler } from "@utils/errorHandler";
import { getRequiredEnv } from "@utils/env";
import {authMiddleware} from "./middleware/auth.middleware";
import { roleMiddleware } from "./middleware/role.middleware";

const envFilename = process.env.NODE_ENV === "production" ? ".env" : ".env.local";
const envPath = path.resolve(__dirname, "..", envFilename);
dotenv.config({ path: envPath });

const app = express();

app.use("/users", createProxyMiddleware({
  target: getRequiredEnv("USER_SERVICE_URL"),
  changeOrigin: true
}));

app.use("/products", authMiddleware, roleMiddleware(["admin", "customer"]), createProxyMiddleware({
  target: getRequiredEnv("PRODUCT_SERVICE_URL"),
  changeOrigin: true
}));

app.use("/orders", authMiddleware, roleMiddleware(["admin", "customer"]), createProxyMiddleware({
  target: getRequiredEnv("ORDER_SERVICE_URL"),
  changeOrigin: true
}));

app.use((req, res, next) => {
  next(new AppError(`The requested resource ${req.originalUrl} was not found`, 404));
});

app.use(errorHandler);

export default app;
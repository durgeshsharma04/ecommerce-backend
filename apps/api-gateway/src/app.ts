import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import AppError from "@utils/AppError";
import { errorHandler } from "@utils/errorHandler";
import {authMiddleware} from "./middleware/auth.middleware";
import { roleMiddleware } from "./middleware/role.middleware";


const app = express();

app.use("/users", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true
}));

app.use("/products", authMiddleware, roleMiddleware(["admin", "customer"]), createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true
}));

app.use("/orders", authMiddleware, roleMiddleware(["admin", "customer"]), createProxyMiddleware({
  target: "http://localhost:3003",
  changeOrigin: true
}));

app.use((req, res, next) => {
  next(new AppError(`The requested resource ${req.originalUrl} was not found`, 404));
});

app.use(errorHandler);

export default app;
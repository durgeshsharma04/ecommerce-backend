import express from "express";
import productRoutes from "./modules/product/product.routes";
import AppError from "@utils/AppError";
import { errorHandler } from "@utils/errorHandler";

const app = express();

app.use(express.json());
app.use("/products", productRoutes);
app.use((req, res, next) => {
  throw new AppError(`The requested resource ${req.originalUrl} was not found`, 404);
});

app.use(errorHandler);

export default app;
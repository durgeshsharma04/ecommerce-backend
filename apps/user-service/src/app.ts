import express from "express";
import userRoutes from "./modules/user/user.routes";
import AppError from "@utils/AppError";
import { errorHandler } from "@utils/errorHandler";
import authRoutes from "./modules/auth/auth.routes";

const app = express();

app.use(express.json());
app.use("/", userRoutes);
app.use("/auth", authRoutes);
app.use((req, res, next) => {
  next(new AppError(`The requested resource ${req.originalUrl} was not found`, 404));
});

app.use(errorHandler);


export default app;
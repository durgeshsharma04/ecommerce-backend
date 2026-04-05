import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();
import AppError from "@utils/AppError";

const prisma = new PrismaClient();

export const register = async (data: { email: string; password: string }) => {
    const { email, password } = data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError("Email already in use", 400);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
        },
    });
    return user;
}

export const login = async (data : {email:string, password:string}) => {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new AppError("Invalid email or password", 400);
    }
    const isPasswordValid = await bcrypt.compare(password,  user.password);
    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", 400);
    }
    const token = jwt.sign({ userId: user, role: user }, process.env.JWT_SECRET as string, { expiresIn: "1d" });
    return token;
}

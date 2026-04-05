import AppError from "./AppError";

export const errorHandler = (err: AppError, req: any, res: any, next: any) => {
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';
    const message = err.message || 'An unexpected error occurred';

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: "error",
            message: err.message,
        });
    }

    // unknown error
    return res.status(500).json({
        status: "error",
        message: "Something went wrong",
    });
};
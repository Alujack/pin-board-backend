import { ORPCError } from "@orpc/client";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict") {
    super(message, 409);
  }
}

// Convert AppError to ORPCError
export const toORPCError = (error: AppError): ORPCError => {
  const errorMap: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED", 
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    500: "INTERNAL_SERVER_ERROR"
  };

  const orpcErrorType = errorMap[error.statusCode] || "INTERNAL_SERVER_ERROR";
  
  return new ORPCError(orpcErrorType, { message: error.message });
};

// Global error handler
export const handleError = (error: any): ORPCError => {
  if (error instanceof AppError) {
    return toORPCError(error);
  }

  if (error instanceof ORPCError) {
    return error;
  }

  // Handle Mongoose errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    return new ORPCError("BAD_REQUEST", { message: messages.join(', ') });
  }

  if (error.name === 'CastError') {
    return new ORPCError("BAD_REQUEST", { message: "Invalid ID format" });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new ORPCError("CONFLICT", { message: `${field} already exists` });
  }

  // Default to internal server error
  console.error('Unhandled error:', error);
  return new ORPCError("INTERNAL_SERVER_ERROR", { message: "Internal server error" });
};

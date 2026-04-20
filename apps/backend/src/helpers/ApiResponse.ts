import type { Response } from "express";
import type { ApiErrorResponse } from "../dto/common.dto";

export class ApiResponse {
  static ok<T>(res: Response, data: T, statusCode = 200): void {
    res.status(statusCode).json(data as T);
  }

  static fail(res: Response, message: string, statusCode = 400): void {
    const body: ApiErrorResponse = { message };
    res.status(statusCode).json(body);
  }

  static failFromError(res: Response, error: unknown, statusCode = 400): void {
    const message = error instanceof Error ? error.message : "Request failed";
    this.fail(res, message, statusCode);
  }
}

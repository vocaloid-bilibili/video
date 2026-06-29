// packages/controller/src/utils/http.ts

import type { NextFunction, Request, RequestHandler, Response } from "express";

export type HttpError = Error & {
  statusCode?: number;
};

type AsyncRoute = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncRoute(handler: AsyncRoute): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function httpError(statusCode: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

export function requireString(value: unknown, message: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw httpError(400, message);
  }

  return value.trim();
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function errorHandler(
  error: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  res.status(error.statusCode || 500).send({
    error: getErrorMessage(error),
  });
}

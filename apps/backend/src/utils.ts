import type { Request, Response } from "express";
import { ZodError } from "zod";

export function sendZodError(res: Response, message: string, error: ZodError) {
  return res.status(400).json({
    message,
    issues: error.issues,
  });
}

export function sendInternalError(res: Response, message: string, error: unknown) {
  const reason = error instanceof Error ? error.message : "Unknown error";
  return res.status(500).json({
    message,
    error: reason,
  });
}

export function getRequestId(req: Request) {
  const headerValue = req.headers["x-request-id"];
  if (Array.isArray(headerValue)) {
    return headerValue[0] ?? "";
  }

  return headerValue ?? "";
}

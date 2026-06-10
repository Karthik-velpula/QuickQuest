import type { NextFunction, Request, Response } from "express";
import { isValidAdminToken } from "../services/authService.js";

export function requireAdmin(request: Request, response: Response, next: NextFunction): void {
  const header = request.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!isValidAdminToken(token)) {
    response.status(401).json({ message: "Admin login required." });
    return;
  }
  next();
}

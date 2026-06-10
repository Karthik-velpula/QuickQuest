import crypto from "node:crypto";

const adminUser = process.env.ADMIN_USER ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
const adminToken = crypto.randomBytes(32).toString("hex");

export function login(username: string, password: string): string | null {
  if (username === adminUser && password === adminPassword) return adminToken;
  return null;
}

export function isValidAdminToken(token: string | undefined): boolean {
  return token === adminToken;
}

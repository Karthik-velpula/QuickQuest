import crypto from "node:crypto";

const adminUser = process.env.ADMIN_USER;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminToken = crypto.randomBytes(32).toString("hex");

export function login(username: string, password: string): string | null {
  if (!adminUser || !adminPassword) return null;
  if (username === adminUser && password === adminPassword) return adminToken;
  return null;
}

export function isValidAdminToken(token: string | undefined): boolean {
  return token === adminToken;
}

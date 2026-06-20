import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const candidates = [
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(process.cwd(), "../backend/.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
];

for (const file of candidates) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file });
    break;
  }
}

export function getMysqlConfig() {
  return {
    host: process.env.MYSQL_HOST ?? "",
    port: process.env.MYSQL_PORT ?? "3306",
    user: process.env.MYSQL_USER ?? "",
    database: process.env.MYSQL_DATABASE ?? "",
    passwordSet: Boolean(process.env.MYSQL_PASSWORD),
    ssl: process.env.MYSQL_SSL ?? "true",
    hasCaCert: Boolean(process.env.MYSQL_CA_CERT),
  };
}

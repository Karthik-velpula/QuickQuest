import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { adminRouter } from "./routes/adminRoutes.js";
import { examRouter } from "./routes/examRoutes.js";
import { questionRouter } from "./routes/questionRoutes.js";

export const app = express();
const dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(dirname, "../../frontend/dist");

app.disable("x-powered-by");
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? true }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api/admin", adminRouter);
app.use("/api/exams", examRouter);
app.use("/api/questions", questionRouter);

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    response.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "File must be 15 MB or smaller." : error.message });
    return;
  }
  console.error(error);
  response.status(500).json({ message: error instanceof Error ? error.message : "Unable to process the file." });
});

import { Router } from "express";
import { uploadQuestions } from "../controllers/questionController.js";
import { upload } from "../middleware/upload.js";

export const questionRouter = Router();

questionRouter.post("/upload", upload.single("file"), uploadQuestions);

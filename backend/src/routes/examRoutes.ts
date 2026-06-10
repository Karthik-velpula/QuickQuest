import { Router } from "express";
import { getExamForStudent, submitStudentAttempt } from "../controllers/examController.js";

export const examRouter = Router();

examRouter.get("/:code", getExamForStudent);
examRouter.post("/:code/attempts", submitStudentAttempt);

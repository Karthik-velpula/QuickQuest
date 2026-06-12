import { Router } from "express";
import { getExamForStudent, listExamsForStudents, submitStudentAttempt } from "../controllers/examController.js";

export const examRouter = Router();

examRouter.get("/", listExamsForStudents);
examRouter.get("/:code", getExamForStudent);
examRouter.post("/:code/attempts", submitStudentAttempt);

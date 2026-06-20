import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { clearAdminEmailExamResults, createEmailExamFromAdmin, deleteAdminEmailExam, getEmailExamForStudent, listAdminEmailExams, submitEmailExamForStudent } from "../controllers/emailExamController.js";

export const emailExamRouter = Router();

emailExamRouter.post("/admin/create", requireAdmin, createEmailExamFromAdmin);
emailExamRouter.get("/admin", requireAdmin, listAdminEmailExams);
emailExamRouter.delete("/admin/:code/results", requireAdmin, clearAdminEmailExamResults);
emailExamRouter.delete("/admin/:code", requireAdmin, deleteAdminEmailExam);
emailExamRouter.get("/:code", getEmailExamForStudent);
emailExamRouter.post("/:code/submit", submitEmailExamForStudent);

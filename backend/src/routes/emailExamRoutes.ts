import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { createEmailExamFromAdmin, getEmailExamForStudent, listAdminEmailExams, submitEmailExamForStudent } from "../controllers/emailExamController.js";

export const emailExamRouter = Router();

emailExamRouter.post("/admin/create", requireAdmin, createEmailExamFromAdmin);
emailExamRouter.get("/admin", requireAdmin, listAdminEmailExams);
emailExamRouter.get("/:code", getEmailExamForStudent);
emailExamRouter.post("/:code/submit", submitEmailExamForStudent);

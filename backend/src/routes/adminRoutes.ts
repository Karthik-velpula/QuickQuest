import { Router } from "express";
import { adminLogin, createExamFromUpload, getAdminExam, previewQuestionsFromUpload } from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { upload } from "../middleware/upload.js";

export const adminRouter = Router();

adminRouter.post("/login", adminLogin);
adminRouter.post("/questions/preview", requireAdmin, upload.single("file"), previewQuestionsFromUpload);
adminRouter.post("/exams", requireAdmin, upload.single("file"), createExamFromUpload);
adminRouter.get("/exams/:code", requireAdmin, getAdminExam);

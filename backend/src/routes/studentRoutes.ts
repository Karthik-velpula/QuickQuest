import { Router } from "express";
import { loginStudentAccount, registerStudentAccount } from "../controllers/studentController.js";

export const studentRouter = Router();

studentRouter.post("/register", registerStudentAccount);
studentRouter.post("/login", loginStudentAccount);

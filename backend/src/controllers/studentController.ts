import type { Request, Response } from "express";
import { createStudentToken, loginStudent, registerStudent } from "../services/examStore.js";

async function sendStudentSession(response: Response, student: { id: string; username: string; displayName: string }): Promise<void> {
  const token = await createStudentToken(student);
  response.json({
    token,
    student: {
      username: student.username,
      displayName: student.displayName,
    },
  });
}

export async function registerStudentAccount(request: Request, response: Response): Promise<void> {
  const { username = "", password = "", displayName = "" } = request.body as { username?: string; password?: string; displayName?: string };
  try {
    const student = await registerStudent(username, password, displayName);
    await sendStudentSession(response, student);
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : "Unable to create student account." });
  }
}

export async function loginStudentAccount(request: Request, response: Response): Promise<void> {
  const { username = "", password = "" } = request.body as { username?: string; password?: string };
  const student = await loginStudent(username, password);
  if (!student) {
    response.status(401).json({ message: "Invalid student username or password." });
    return;
  }
  await sendStudentSession(response, student);
}

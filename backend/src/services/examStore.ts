import crypto from "node:crypto";
import mysql from "mysql2/promise";
import type { AdminExamListSummary, Attempt, Exam, PublicExamSummary, PublicQuestion, SubmittedAnswer } from "../types/exam.js";
import type { Question } from "../types/question.js";
import { parseAnswerKey } from "./answerKeyParser.js";

const optionLetters = ["A", "B", "C", "D"] as const;

type ExamRow = {
  code: string;
  title: string;
  created_at: string;
};

type QuestionRow = {
  id: string;
  exam_code: string;
  question_order: number;
  document_question_number: number | null;
  passage: string | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
};

type AttemptRow = {
  id: string;
  exam_code: string;
  student_name: string;
  submitted_at: string;
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
};

type AnswerRow = {
  attempt_id: string;
  question_id: string;
  selected_answer: string | null;
};

type StudentRow = {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
};

export type StudentSession = {
  id: string;
  username: string;
  displayName: string;
};

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl:
    process.env.MYSQL_SSL === "false"
      ? undefined
      : {
          rejectUnauthorized: true,
          ca: process.env.MYSQL_CA_CERT?.replace(/\\n/g, "\n"),
        },
  waitForConnections: true,
  connectionLimit: process.env.MYSQL_CONNECTION_LIMIT ? Number(process.env.MYSQL_CONNECTION_LIMIT) : 25,
  queueLimit: 0,
  namedPlaceholders: true,
  charset: "utf8mb4",
});

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        code VARCHAR(12) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_at DATETIME(3) NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_questions (
        id VARCHAR(24) PRIMARY KEY,
        exam_code VARCHAR(12) NOT NULL,
        question_order INT NOT NULL,
        document_question_number INT NULL,
        passage TEXT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        CONSTRAINT fk_exam_questions_exam FOREIGN KEY (exam_code) REFERENCES exams(code) ON DELETE CASCADE,
        INDEX idx_exam_questions_exam_code (exam_code),
        INDEX idx_exam_questions_order (exam_code, question_order)
      )
    `);
    await pool.query("ALTER TABLE exam_questions ADD COLUMN document_question_number INT NULL").catch((error: { code?: string }) => {
      if (error.code !== "ER_DUP_FIELDNAME") throw error;
    });
    await pool.query("ALTER TABLE exam_questions ADD COLUMN passage TEXT NULL").catch((error: { code?: string }) => {
      if (error.code !== "ER_DUP_FIELDNAME") throw error;
    });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_attempts (
        id VARCHAR(36) PRIMARY KEY,
        exam_code VARCHAR(12) NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        submitted_at DATETIME(3) NOT NULL,
        total INT NOT NULL,
        attempted INT NOT NULL,
        correct INT NOT NULL,
        incorrect INT NOT NULL,
        unanswered INT NOT NULL,
        percentage DECIMAL(5,1) NOT NULL,
        CONSTRAINT fk_exam_attempts_exam FOREIGN KEY (exam_code) REFERENCES exams(code) ON DELETE CASCADE,
        INDEX idx_exam_attempts_exam_code (exam_code),
        INDEX idx_exam_attempts_submitted_at (submitted_at)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attempt_answers (
        attempt_id VARCHAR(36) NOT NULL,
        question_id VARCHAR(24) NOT NULL,
        selected_answer TEXT NULL,
        PRIMARY KEY (attempt_id, question_id),
        CONSTRAINT fk_attempt_answers_attempt FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(80) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(128) NOT NULL,
        password_salt VARCHAR(64) NOT NULL,
        created_at DATETIME(3) NOT NULL,
        INDEX idx_students_username (username)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_sessions (
        token VARCHAR(128) PRIMARY KEY,
        student_id VARCHAR(36) NOT NULL,
        created_at DATETIME(3) NOT NULL,
        expires_at DATETIME(3) NOT NULL,
        CONSTRAINT fk_student_sessions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_student_sessions_student_id (student_id),
        INDEX idx_student_sessions_expires_at (expires_at)
      )
    `);
  })();

  return schemaReady;
}

function generateCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function toMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 23).replace("T", " ");
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

async function fetchExamRows(code: string): Promise<Exam | undefined> {
  await ensureSchema();
  const [exams] = await pool.query<mysql.RowDataPacket[] & ExamRow[]>(
    "SELECT code, title, created_at FROM exams WHERE code = ? LIMIT 1",
    [code.toUpperCase()],
  );
  const examRow = exams[0];
  if (!examRow) return undefined;

  const [questions] = await pool.query<mysql.RowDataPacket[] & QuestionRow[]>(
    `SELECT id, exam_code, question_order, document_question_number, passage, question_text, option_a, option_b, option_c, option_d, correct_answer
     FROM exam_questions
     WHERE exam_code = ?
     ORDER BY question_order ASC`,
    [code.toUpperCase()],
  );

  const [attemptRows] = await pool.query<mysql.RowDataPacket[] & AttemptRow[]>(
    `SELECT id, exam_code, student_name, submitted_at, total, attempted, correct, incorrect, unanswered, percentage
     FROM exam_attempts
     WHERE exam_code = ?
     ORDER BY percentage DESC, correct DESC, attempted DESC, submitted_at ASC`,
    [code.toUpperCase()],
  );

  const attempts: Attempt[] = [];
  let previousRankKey = "";
  let currentRank = 0;
  for (const attemptRow of attemptRows) {
    const [answerRows] = await pool.query<mysql.RowDataPacket[] & AnswerRow[]>(
      `SELECT attempt_id, question_id, selected_answer
       FROM attempt_answers
       WHERE attempt_id = ?`,
      [attemptRow.id],
    );

    const rankKey = `${attemptRow.percentage}|${attemptRow.correct}|${attemptRow.attempted}`;
    if (rankKey !== previousRankKey) {
      currentRank += 1;
      previousRankKey = rankKey;
    }

    attempts.push({
      id: attemptRow.id,
      rank: currentRank,
      studentName: attemptRow.student_name,
      submittedAt: new Date(attemptRow.submitted_at).toISOString(),
      answers: answerRows.map((answerRow) => ({
        questionId: answerRow.question_id,
        selectedAnswer: answerRow.selected_answer,
      })),
      total: attemptRow.total,
      attempted: attemptRow.attempted,
      correct: attemptRow.correct,
      incorrect: attemptRow.incorrect,
      unanswered: attemptRow.unanswered,
      percentage: Number(attemptRow.percentage),
    });
  }

  return {
    code: examRow.code,
    title: examRow.title,
    createdAt: new Date(examRow.created_at).toISOString(),
    attempts,
    questions: questions.map((questionRow) => ({
      id: questionRow.id,
      questionNumber: questionRow.document_question_number ?? questionRow.question_order,
      passage: questionRow.passage ?? undefined,
      question: questionRow.question_text,
      options: [questionRow.option_a, questionRow.option_b, questionRow.option_c, questionRow.option_d],
      correctAnswer: questionRow.correct_answer,
    })),
  };
}

async function fetchExamForScoring(code: string): Promise<Exam | undefined> {
  await ensureSchema();
  const [exams] = await pool.query<mysql.RowDataPacket[] & ExamRow[]>(
    "SELECT code, title, created_at FROM exams WHERE code = ? LIMIT 1",
    [code.toUpperCase()],
  );
  const examRow = exams[0];
  if (!examRow) return undefined;

  const [questions] = await pool.query<mysql.RowDataPacket[] & QuestionRow[]>(
    `SELECT id, exam_code, question_order, document_question_number, passage, question_text, option_a, option_b, option_c, option_d, correct_answer
     FROM exam_questions
     WHERE exam_code = ?
     ORDER BY question_order ASC`,
    [code.toUpperCase()],
  );

  return {
    code: examRow.code,
    title: examRow.title,
    createdAt: new Date(examRow.created_at).toISOString(),
    attempts: [],
    questions: questions.map((questionRow) => ({
      id: questionRow.id,
      questionNumber: questionRow.document_question_number ?? questionRow.question_order,
      passage: questionRow.passage ?? undefined,
      question: questionRow.question_text,
      options: [questionRow.option_a, questionRow.option_b, questionRow.option_c, questionRow.option_d],
      correctAnswer: questionRow.correct_answer,
    })),
  };
}

async function fetchExamQuestions(code: string): Promise<{ code: string; title: string; questions: Exam["questions"] } | undefined> {
  await ensureSchema();
  const [exams] = await pool.query<mysql.RowDataPacket[] & ExamRow[]>(
    "SELECT code, title, created_at FROM exams WHERE code = ? LIMIT 1",
    [code.toUpperCase()],
  );
  const examRow = exams[0];
  if (!examRow) return undefined;

  const [questions] = await pool.query<mysql.RowDataPacket[] & QuestionRow[]>(
    `SELECT id, exam_code, question_order, document_question_number, passage, question_text, option_a, option_b, option_c, option_d, correct_answer
     FROM exam_questions
     WHERE exam_code = ?
     ORDER BY question_order ASC`,
    [code.toUpperCase()],
  );

  return {
    code: examRow.code,
    title: examRow.title,
    questions: questions.map((questionRow) => ({
      id: questionRow.id,
      questionNumber: questionRow.document_question_number ?? questionRow.question_order,
      passage: questionRow.passage ?? undefined,
      question: questionRow.question_text,
      options: [questionRow.option_a, questionRow.option_b, questionRow.option_c, questionRow.option_d],
      correctAnswer: questionRow.correct_answer,
    })),
  };
}

export async function createExam(title: string, questions: Question[], rawAnswerKey: string): Promise<Exam> {
  await ensureSchema();
  const answerKey = parseAnswerKey(rawAnswerKey, questions.length);
  const createdAt = new Date();
  const connection = await pool.getConnection();
  let code = "";

  try {
    await connection.beginTransaction();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      code = generateCode();
      try {
        await connection.query(
          "INSERT INTO exams (code, title, created_at) VALUES (?, ?, ?)",
          [code, title.trim() || "Online Assessment", toMysqlDateTime(createdAt)],
        );
        break;
      } catch (error) {
        const mysqlError = error as { code?: string };
        if (mysqlError.code !== "ER_DUP_ENTRY" || attempt === 4) throw error;
      }
    }

    for (const [index, question] of questions.entries()) {
      const answerLetter = answerKey.get(index + 1) as string;
      const optionIndex = optionLetters.indexOf(answerLetter as (typeof optionLetters)[number]);
      const correctAnswer = question.options[optionIndex];
      if (!correctAnswer) throw new Error(`Invalid answer for question ${index + 1}.`);

      await connection.query(
        `INSERT INTO exam_questions
         (id, exam_code, question_order, document_question_number, passage, question_text, option_a, option_b, option_c, option_d, correct_answer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `q${index + 1}-${code}`,
          code,
          index + 1,
          question.questionNumber ?? index + 1,
          question.passage ?? null,
          question.question,
          question.options[0],
          question.options[1],
          question.options[2],
          question.options[3],
          correctAnswer,
        ],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const exam = await fetchExamRows(code);
  if (!exam) throw new Error("Unable to load saved exam.");
  return exam;
}

export async function getExam(code: string): Promise<Exam | undefined> {
  return fetchExamRows(code);
}

export async function getExamQuestions(code: string): Promise<{ code: string; title: string; questions: Exam["questions"] } | undefined> {
  return fetchExamQuestions(code);
}

export async function listPublicExams(): Promise<PublicExamSummary[]> {
  await ensureSchema();
  const [rows] = await pool.query<mysql.RowDataPacket[] & Array<ExamRow & { question_count: number }>>(
    `SELECT exams.code, exams.title, exams.created_at, COUNT(exam_questions.id) AS question_count
     FROM exams
     LEFT JOIN exam_questions ON exam_questions.exam_code = exams.code
     GROUP BY exams.code, exams.title, exams.created_at
     ORDER BY exams.created_at DESC`,
  );

  return rows.map((row) => ({
    code: row.code,
    title: row.title,
    questionCount: Number(row.question_count),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function listAdminExams(): Promise<AdminExamListSummary[]> {
  await ensureSchema();
  const [rows] = await pool.query<mysql.RowDataPacket[] & Array<ExamRow & { question_count: number; attempt_count: number }>>(
    `SELECT exams.code, exams.title, exams.created_at,
            COUNT(DISTINCT exam_questions.id) AS question_count,
            COUNT(DISTINCT exam_attempts.id) AS attempt_count
     FROM exams
     LEFT JOIN exam_questions ON exam_questions.exam_code = exams.code
     LEFT JOIN exam_attempts ON exam_attempts.exam_code = exams.code
     GROUP BY exams.code, exams.title, exams.created_at
     ORDER BY exams.created_at DESC`,
  );

  return rows.map((row) => ({
    code: row.code,
    title: row.title,
    questionCount: Number(row.question_count),
    attemptCount: Number(row.attempt_count),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function deleteExam(code: string): Promise<boolean> {
  await ensureSchema();
  const examCode = code.toUpperCase();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [attemptRows] = await connection.query<mysql.RowDataPacket[] & Array<{ id: string }>>(
      "SELECT id FROM exam_attempts WHERE exam_code = ?",
      [examCode],
    );

    for (const attempt of attemptRows) {
      await connection.query("DELETE FROM attempt_answers WHERE attempt_id = ?", [attempt.id]);
    }
    await connection.query("DELETE FROM exam_attempts WHERE exam_code = ?", [examCode]);
    await connection.query("DELETE FROM exam_questions WHERE exam_code = ?", [examCode]);
    const [result] = await connection.query<mysql.ResultSetHeader>("DELETE FROM exams WHERE code = ?", [examCode]);
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getPublicExam(code: string): Promise<{ code: string; title: string; questions: PublicQuestion[] } | undefined> {
  const exam = await fetchExamRows(code);
  if (!exam) return undefined;
  return {
    code: exam.code,
    title: exam.title,
    questions: exam.questions.map(({ id, questionNumber, passage, question, options }) => ({ id, questionNumber, passage, question, options })),
  };
}

export async function submitAttempt(code: string, studentName: string, answers: SubmittedAnswer[]): Promise<Attempt | undefined> {
  const exam = await fetchExamForScoring(code);
  if (!exam) return undefined;

  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.selectedAnswer]));
  const normalizedAnswers = exam.questions.map((question) => ({
    questionId: question.id,
    selectedAnswer: answerByQuestion.get(question.id) ?? null,
  }));

  const attempted = normalizedAnswers.filter((answer) => answer.selectedAnswer !== null).length;
  const correct = normalizedAnswers.filter((answer) => {
    const question = exam.questions.find((item) => item.id === answer.questionId);
    return question?.correctAnswer === answer.selectedAnswer;
  }).length;
  const total = exam.questions.length;
  const attempt: Attempt = {
    id: crypto.randomUUID(),
    studentName: studentName.trim() || "Anonymous Student",
    submittedAt: new Date().toISOString(),
    answers: normalizedAnswers,
    total,
    attempted,
    correct,
    incorrect: attempted - correct,
    unanswered: total - attempted,
    percentage: total ? Number(((correct / total) * 100).toFixed(1)) : 0,
  };

  await ensureSchema();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO exam_attempts
       (id, exam_code, student_name, submitted_at, total, attempted, correct, incorrect, unanswered, percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attempt.id,
        code.toUpperCase(),
        attempt.studentName,
        toMysqlDateTime(new Date(attempt.submittedAt)),
        attempt.total,
        attempt.attempted,
        attempt.correct,
        attempt.incorrect,
        attempt.unanswered,
        attempt.percentage,
      ],
    );

    for (const answer of normalizedAnswers) {
      await connection.query(
        `INSERT INTO attempt_answers (attempt_id, question_id, selected_answer)
         VALUES (?, ?, ?)`,
        [attempt.id, answer.questionId, answer.selectedAnswer],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return attempt;
}

export async function registerStudent(username: string, password: string, displayName: string): Promise<StudentSession> {
  await ensureSchema();
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername || normalizedUsername.length < 3) throw new Error("Username must be at least 3 characters.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const salt = crypto.randomBytes(16).toString("hex");
  const student: StudentSession = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    displayName: displayName.trim() || normalizedUsername,
  };

  try {
    await pool.query(
      `INSERT INTO students (id, username, display_name, password_hash, password_salt, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student.id, student.username, student.displayName, hashPassword(password, salt), salt, toMysqlDateTime(new Date())],
    );
  } catch (error) {
    const mysqlError = error as { code?: string };
    if (mysqlError.code === "ER_DUP_ENTRY") throw new Error("Username already exists. Please login or choose another username.");
    throw error;
  }

  return student;
}

export async function loginStudent(username: string, password: string): Promise<StudentSession | undefined> {
  await ensureSchema();
  const [rows] = await pool.query<mysql.RowDataPacket[] & StudentRow[]>(
    "SELECT id, username, display_name, password_hash, password_salt, created_at FROM students WHERE username = ? LIMIT 1",
    [normalizeUsername(username)],
  );
  const student = rows[0];
  if (!student) return undefined;
  const attemptedHash = hashPassword(password, student.password_salt);
  if (!crypto.timingSafeEqual(Buffer.from(attemptedHash, "hex"), Buffer.from(student.password_hash, "hex"))) return undefined;
  return { id: student.id, username: student.username, displayName: student.display_name };
}

export async function createStudentToken(student: StudentSession): Promise<string> {
  await ensureSchema();
  const token = crypto.randomBytes(32).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 12 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO student_sessions (token, student_id, created_at, expires_at)
     VALUES (?, ?, ?, ?)`,
    [token, student.id, toMysqlDateTime(createdAt), toMysqlDateTime(expiresAt)],
  );
  return token;
}

export async function getStudentByToken(token: string | undefined): Promise<StudentSession | undefined> {
  await ensureSchema();
  if (!token) return undefined;
  await pool.query("DELETE FROM student_sessions WHERE expires_at < NOW(3)");
  const [rows] = await pool.query<mysql.RowDataPacket[] & Array<StudentRow & { token: string }>>(
    `SELECT students.id, students.username, students.display_name, students.password_hash, students.password_salt, students.created_at, student_sessions.token
     FROM student_sessions
     INNER JOIN students ON students.id = student_sessions.student_id
     WHERE student_sessions.token = ? AND student_sessions.expires_at >= NOW(3)
     LIMIT 1`,
    [token],
  );
  const student = rows[0];
  if (!student) return undefined;
  return { id: student.id, username: student.username, displayName: student.display_name };
}

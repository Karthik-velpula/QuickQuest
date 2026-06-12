# TCS-Style Aptitude Examination Simulator

A full-stack, desktop-oriented assessment application with admin-created temporary exams, document question extraction, separate answer-key upload by paste, student exam links, strict 25-second automatic progression, randomized questions/options, fullscreen monitoring, and in-memory attempt collection.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Parsing: `pdf-parse` for PDF, `mammoth` for DOCX, direct ZIP/XML extraction for PPTX, and `officeparser` fallback for legacy DOC/PPT

## Quick Start

Requires Node.js 20 or newer.

```bash
npm install
npm run samples
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:4000](http://localhost:4000).

For a temporary public Cloudflare Tunnel:

```bash
npm run dev:tunnel
cloudflared tunnel --url http://localhost:5173
```

Open the generated `https://...trycloudflare.com/admin` URL as admin. Exam links created from that page can be shared with students.

Admin page: [http://localhost:5173/admin](http://localhost:5173/admin)

Default local admin credentials:

```text
Username: admin
Password: admin123
```

Override them with `ADMIN_USER` and `ADMIN_PASSWORD` when starting the backend.

After login, choose a question document first. The admin page extracts and displays all detected questions/options for review before the exam link can be created.

> npm 10 can report `URI malformed` when the project directory itself contains a literal `%` character. Rename or move the project to a normal path before running npm commands if that occurs.

## Production / Deploy

The app can run as one Node web service. The backend serves the built React frontend from `frontend/dist`.

```bash
npm install
npm run build
npm start
```

Production environment variables:

```text
ADMIN_USER=your-admin-name
ADMIN_PASSWORD=your-strong-password
MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=quickquest
PORT=4000
```

The backend creates and uses these MySQL tables on startup:

- `exams`
- `exam_questions`
- `exam_attempts`
- `attempt_answers`

### Render Deployment

This repo includes `render.yaml`.

1. Push the project to GitHub.
2. Create a Render account.
3. New → Blueprint → select the GitHub repo.
4. Set `ADMIN_USER`, `ADMIN_PASSWORD`, and the MySQL environment variables in Render.
5. Deploy.

Render will run:

```bash
npm install && npm run build
npm start
```

After deploy, use:

```text
https://your-render-url.onrender.com/admin
```

Build and test:

```bash
npm test
npm run build
```

## Required Question Format

Each question must use a numbered heading and exactly four `A` through `D` options:

```text
Q1. Question text
A. Option 1
B. Option 2
C. Option 3
D. Option 4
```

`1. Question text`, `Q1. Question text`, and `Question 1. Question text` are supported.

## Separate Answer Key Format

Paste correct answers into the admin page as numbered lines:

```text
1. B
2. C
3. A
```

The answer letters refer to the original document option order before the app randomizes options for students.

## Sample Documents

Run `npm run samples` to generate:

- `samples/sample-questions.pdf`
- `samples/sample-questions.docx`
- `samples/sample-questions.pptx`
- `samples/sample-answer-key.txt`

## Behavior

- Uploads are held in Multer memory storage and are never written to disk.
- Admin-created exams, answer keys, and attempts are stored in MySQL.
- Student answers are submitted to the backend and scored for both the admin attempt table and the student's final screen.
- No database, browser storage, cookies, or result exports are used.
- Restarting the backend permanently clears all exams, links, answer keys, and attempts.
- Students see their score immediately after the last question is submitted.
- Each question advances exactly 25 seconds after it appears.
- Browser back navigation is intercepted during the exam.
- Fullscreen is requested from the start button; leaving fullscreen displays a blocking warning while the timer continues.

Browser security rules prevent websites from absolutely disabling browser controls, closing, refresh, or OS-level shortcuts. The application applies the strongest practical in-page restrictions while preserving reliable exam submission.

## API

`POST /api/admin/login`

Returns an in-memory bearer token for admin routes.

`POST /api/admin/exams`

- Content type: `multipart/form-data`
- Field: `file`
- Fields: `title`, `answerKey`
- Allowed extensions: `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`
- Maximum size: 15 MB
- Requires `Authorization: Bearer <token>`

Successful response:

```json
{
  "code": "ABC123",
  "title": "Aptitude Assessment",
  "questionCount": 25,
  "examUrl": "/exam/ABC123"
}
```

`GET /api/exams/:code`

Returns student-safe exam questions without correct answers.

`POST /api/exams/:code/attempts`

Submits a student attempt.

`GET /api/admin/exams/:code`

Returns the admin attempt table with scores.

## Project Structure

```text
frontend/src/
├── components/
├── hooks/
├── pages/
├── services/
├── types/
└── utils/

backend/src/
├── controllers/
├── middleware/
├── parsers/
├── routes/
├── services/
└── types/
```

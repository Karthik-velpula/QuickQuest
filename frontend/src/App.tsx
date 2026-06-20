import { AdminPage } from "./pages/AdminPage";
import { LoginChoicePage } from "./pages/LoginChoicePage";
import { StudentEntryPage } from "./pages/StudentEntryPage";
import { StudentExamPage } from "./pages/StudentExamPage";
import { getSavedStudentSession, savePendingExamPath } from "./services/studentService";

export default function App() {
  const path = window.location.pathname;
  const studentSession = getSavedStudentSession();
  if (path === "/") return <LoginChoicePage />;
  if (path === "/admin") return <AdminPage />;
  if (path === "/student") return <StudentEntryPage />;
  if (path.startsWith("/exam/")) {
    if (!studentSession) {
      savePendingExamPath(path);
      window.location.replace("/student");
      return <StudentEntryPage />;
    }
    return <StudentExamPage code={decodeURIComponent(path.split("/")[2] ?? "").toUpperCase()} />;
  }
  return <LoginChoicePage />;
}

import { AdminPage } from "./pages/AdminPage";
import { EmailExamPage } from "./pages/EmailExamPage";
import { LoginChoicePage } from "./pages/LoginChoicePage";
import { StudentEntryPage } from "./pages/StudentEntryPage";
import { StudentExamPage } from "./pages/StudentExamPage";

export default function App() {
  const path = window.location.pathname;
  if (path === "/") return <LoginChoicePage />;
  if (path === "/admin") return <AdminPage />;
  if (path === "/student") return <StudentEntryPage />;
  if (path.startsWith("/email-exam/")) return <EmailExamPage code={decodeURIComponent(path.split("/")[2] ?? "").toUpperCase()} />;
  if (path.startsWith("/exam/")) return <StudentExamPage code={decodeURIComponent(path.split("/")[2] ?? "").toUpperCase()} />;
  return <LoginChoicePage />;
}

import { AdminPage } from "./pages/AdminPage";
import { StudentEntryPage } from "./pages/StudentEntryPage";
import { StudentExamPage } from "./pages/StudentExamPage";

export default function App() {
  const path = window.location.pathname;
  if (path === "/admin") return <AdminPage />;
  if (path.startsWith("/exam/")) return <StudentExamPage code={decodeURIComponent(path.split("/")[2] ?? "").toUpperCase()} />;
  return <StudentEntryPage />;
}

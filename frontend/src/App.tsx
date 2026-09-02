import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { WelcomePage } from "./pages/WelcomePage";
import { RegisterPage } from "./pages/RegisterPage";
import { SuccessPage } from "./pages/SuccessPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminShell } from "./pages/admin/AdminShell";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { EventsPage } from "./pages/admin/EventsPage";
import { EventDetailPage } from "./pages/admin/EventDetailPage";
import { EventFormPage } from "./pages/admin/EventFormPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/success" element={<SuccessPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/new" element={<EventFormPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="events/:id/edit" element={<EventFormPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./Pages/Home";
import EditorPage from "./Pages/Editor";
import AuthPage from "./Pages/Auth";
import ProfilePage from "./Pages/Profile";
import ForgotPasswordPage from "./Pages/ForgotPassword";
import ResetPasswordPage from "./Pages/ResetPassword";
import { AuthProvider } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";
import NavBar from "./components/NavBar";
import "./index.css";

function AppShell() {
  const location = useLocation();
  const isEditorRoute = location.pathname.startsWith("/editor/");

  return (
    <>
      {!isEditorRoute && <NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage defaultMode="login" />} />
        <Route path="/register" element={<AuthPage defaultMode="register" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/editor/:roomId" element={<EditorPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
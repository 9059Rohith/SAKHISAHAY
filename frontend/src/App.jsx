import { useEffect } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider, Protected } from "./lib/auth";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import InteriorFrame from "./components/InteriorFrame";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EmergencyContacts from "./pages/EmergencyContacts";
import Location from "./pages/Location";
import Chatbot from "./pages/Chatbot";
import Reporting from "./pages/Reporting";
import SafetyInformation from "./pages/SafetyInformation";
import SOS from "./pages/SOS";
import {
  AccountPage,
  RecoveryCode,
  RecoveryPage,
  VerifyPage,
  AdminPage,
} from "./pages/Account";
import ShareViewer from "./pages/ShareViewer";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-500-italic.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "./styles/Night.css";
import "./styles/Story.css";
import "./styles/Expressive.css";
import "./styles/Interior.css";
import "./styles/InteriorMotion.css";

function AppRoutes() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return (
    <ErrorBoundary>
      <AuthProvider>
        <InteriorFrame>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<RecoveryPage />} />
            <Route path="/reset-password" element={<RecoveryPage reset />} />
            <Route path="/verify-email" element={<VerifyPage />} />
            <Route path="/share/:token" element={<ShareViewer />} />
            <Route path="/safety-information" element={<SafetyInformation />} />
            <Route
              path="/recovery-code"
              element={
                <Protected>
                  <RecoveryCode />
                </Protected>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Protected>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/profile"
              element={
                <Protected>
                  <AccountPage />
                </Protected>
              }
            />
            <Route
              path="/admin"
              element={
                <Protected admin>
                  <AdminPage />
                </Protected>
              }
            />
            <Route
              path="/emergency-contacts"
              element={
                <Protected>
                  <EmergencyContacts />
                </Protected>
              }
            />
            <Route
              path="/location"
              element={
                <Protected>
                  <Location />
                </Protected>
              }
            />
            <Route
              path="/chatbot"
              element={
                <Protected>
                  <Chatbot />
                </Protected>
              }
            />
            <Route
              path="/reporting"
              element={
                <Protected>
                  <Reporting />
                </Protected>
              }
            />
            <Route
              path="/sos"
              element={
                <Protected>
                  <SOS />
                </Protected>
              }
            />
            <Route
              path="*"
              element={
                <main className="system-page">
                  <h1>Page not found</h1>
                  <p>Let’s get you back to your safety space.</p>
                  <Link className="night-button" to="/">
                    Back to home
                  </Link>
                </main>
              }
            />
          </Routes>
        </InteriorFrame>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

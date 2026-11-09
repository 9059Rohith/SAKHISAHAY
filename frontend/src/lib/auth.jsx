import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, csrfToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(csrfToken()));
  const [recoveryCode, setRecoveryCode] = useState("");
  const [verificationEmailSent, setVerificationEmailSent] = useState(null);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      setUser(null);
      if (e.status !== 401) setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (csrfToken()) load();
    const expired = () => setUser(null);
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  const authenticate = async (path, body) => {
    const data = await api.post(path, body);
    setUser(data.user);
    if (data.recovery_code) setRecoveryCode(data.recovery_code);
    if (data.recovery_code)
      setVerificationEmailSent(data.verification_email_sent === true);
    return data;
  };
  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    setRecoveryCode("");
    setVerificationEmailSent(null);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        retry: load,
        setUser,
        recoveryCode,
        verificationEmailSent,
        clearRecovery: () => setRecoveryCode(""),
        login: (data) => authenticate("/auth/login", data),
        register: (data) => authenticate("/auth/signup", data),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function Protected({ children, admin = false }) {
  const { user, loading, error, retry } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <main className="system-page" role="status">
        Loading your account…
      </main>
    );
  if (error)
    return (
      <main className="system-page">
        <h1>Unable to load your account</h1>
        <p role="alert">{error}</p>
        <button onClick={retry}>Try again</button>
      </main>
    );
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== "admin")
    return (
      <main className="system-page">
        <h1>Access restricted</h1>
        <p>This area requires an administrator account.</p>
        <a href="/dashboard">Back to dashboard</a>
      </main>
    );
  return children;
}

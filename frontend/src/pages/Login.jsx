import { AnimatedHeading } from "../components/Motion";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { errorText } from "../lib/api";
import "../styles/Auth.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate({ email, password }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Please enter a valid email address, e.g. name@example.com.";
  }

  if (!password) {
    errors.password = "Please enter your password.";
  }

  return errors;
}

function Login() {
  const location = useLocation();
  const [formData, setFormData] = useState(() => ({
    email: new URLSearchParams(location.search).get("email") || "",
    password: "",
  }));
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setShowNotice(false);

    // Clear the error for a field as soon as the user edits it
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setShowNotice(false);
      // Move focus to the first invalid field
      const firstInvalid = Object.keys(validationErrors)[0];
      document.getElementById(`login-${firstInvalid}`)?.focus();
      return;
    }

    if (busy) return;
    setBusy(true);
    setServerError("");
    try {
      await auth.login({
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate(location.state?.from || "/dashboard");
    } catch (error) {
      setServerError(errorText(error));
      setShowNotice(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back-link">
          <span aria-hidden="true">←</span> Back to Home
        </Link>

        <header className="auth-header">
          <div className="auth-brand">
            <svg
              className="auth-logo"
              width="44"
              height="44"
              viewBox="0 0 48 48"
              role="img"
              aria-label="SAKHISAHAY logo"
            >
              <circle cx="24" cy="24" r="24" fill="#B8A5D6" />
              <path
                d="M24 10l12 4.5v9.2c0 7.2-4.9 12.6-12 14.8-7.1-2.2-12-7.6-12-14.8v-9.2L24 10z"
                fill="#FFFAFC"
              />
              <path
                d="M24 31.5c-4.2-2.9-6.5-5.1-6.5-7.9 0-1.9 1.4-3.3 3.2-3.3 1.3 0 2.5.7 3.3 1.8.8-1.1 2-1.8 3.3-1.8 1.8 0 3.2 1.4 3.2 3.3 0 2.8-2.3 5-6.5 7.9z"
                fill="#C77D98"
              />
            </svg>
            <span className="auth-brand-name">SAKHISAHAY</span>
          </div>
          <AnimatedHeading as="h1" className="auth-title">
            Welcome Back
          </AnimatedHeading>
          <p className="auth-subtitle">
            Log in to access your safety tools and support.
          </p>
        </header>

        {showNotice && (
          <div className="auth-notice" role="alert">
            {serverError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={errors.email ? "has-error" : ""}
            />
            {errors.email && (
              <p id="login-email-error" className="auth-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="auth-password-wrapper">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={
                  errors.password ? "login-password-error" : undefined
                }
                className={errors.password ? "has-error" : ""}
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p id="login-password-error" className="auth-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <div className="auth-forgot">
            <Link to="/reset-password">Use a recovery code</Link>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="auth-submit"
          >
            Login
          </button>
        </form>

        <p className="auth-switch">
          New to SAKHISAHAY? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageShell, { Feedback } from "../components/PageShell";
import { api, errorText } from "../lib/api";
import { useAuth } from "../lib/auth";

export function RecoveryCode() {
  const { recoveryCode, clearRecovery, verificationEmailSent, user } =
    useAuth();
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  return (
    <PageShell
      title="Your safety space is ready"
      lead="Keep this one-time recovery code somewhere safe, such as a password manager. It lets you reset your password without email delivery."
    >
      <section className="glass-panel">
        {verificationEmailSent === true && (
          <p className="feedback success" role="status">
            A verification link was sent to {user.email}. Check your inbox and
            spam folder, then open the link to confirm your address.
          </p>
        )}
        {verificationEmailSent === false && (
          <p className="small-note">
            Your account has been created. You can request a verification email
            from My account.
          </p>
        )}
        <h2>Save your recovery code</h2>
        {recoveryCode ? (
          <>
            <code className="recovery-code">{recoveryCode}</code>
            <p className="small-note">
              This code is shown once. Anyone who has it can reset your account
              password. It will be consumed after one use.
            </p>
            <label className="recovery-confirm">
              <input
                type="checkbox"
                checked={saved}
                onChange={(e) => setSaved(e.target.checked)}
              />{" "}
              I have saved my recovery code securely
            </label>
            <button
              className="night-button"
              disabled={!saved}
              onClick={() => {
                clearRecovery();
                navigate("/dashboard");
              }}
            >
              Continue to Dashboard
            </button>
          </>
        ) : (
          <>
            <p>
              The code is no longer displayed. You can still use your account
              normally.
            </p>
            <Link to="/dashboard" className="night-button">
              Go to Dashboard
            </Link>
          </>
        )}
      </section>
    </PageShell>
  );
}

export function RecoveryPage({ reset = false }) {
  const auth = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const emailLink = Boolean(params.get("token"));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    if (reset && password !== confirmation) {
      setError(
        "The passwords do not match. Please enter the same new password twice.",
      );
      setBusy(false);
      return;
    }
    try {
      const result = await api.post(
        reset ? "/auth/reset-password" : "/auth/forgot-password",
        reset ? { email, token, new_password: password } : { email },
      );
      setMessage(result.message);
      if (reset) {
        setPassword("");
        setToken("");
        setConfirmation("");
        auth.setUser(null);
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <PageShell
      title={reset ? "Reset your password" : "Find your way back"}
      lead={
        reset
          ? "Use the one-time recovery code you saved when you registered, or a valid email recovery link."
          : "Request an email recovery link, or reset your password using your saved recovery code."
      }
    >
      <section className="glass-panel">
        <Feedback error={error} message={message} />
        <form className="night-form" onSubmit={submit}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {reset && (
            <>
              {!emailLink && (
                <label>
                  Recovery code or token
                  <input
                    autoComplete="off"
                    minLength={10}
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </label>
              )}
              {emailLink && (
                <p className="small-note">
                  You opened a secure recovery link. Choose your new password
                  below.
                </p>
              )}
              <label>
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="small-note">
                  Use at least 8 characters including a letter and a number.
                </span>
              </label>
              <label>
                Confirm new password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </label>
            </>
          )}
          <button className="night-button" disabled={busy}>
            {busy
              ? "Please wait…"
              : reset
                ? "Reset password"
                : "Request recovery link"}
          </button>
        </form>
        <p className="small-note" style={{ marginTop: 20 }}>
          Recovery links expire after 30 minutes and can be used once. Never
          share your link, password or saved recovery code.
        </p>
        <div className="action-row" style={{ marginTop: 20 }}>
          <Link
            to={reset ? "/forgot-password" : "/reset-password"}
            className="inline-link"
          >
            {reset ? "Request an email link" : "Use my recovery code"}
          </Link>
          <Link to="/login" className="inline-link">
            Back to sign in
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

export function AccountPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user.full_name);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (job) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await job();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <PageShell
      title="Your account"
      lead="A personal space, with you in control."
    >
      <Feedback error={error} message={message} />
      <div className="two-columns">
        <section className="glass-panel">
          <h2>Profile</h2>
          <p className="small-note">
            {user.email} ·{" "}
            {user.is_verified ? "Email verified" : "Email not yet verified"}
          </p>
          <form
            className="night-form"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                setUser(await api.patch("/users/me", { full_name: name }));
                setMessage("Profile saved");
              });
            }}
          >
            <label>
              Full name
              <input
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className="night-button" disabled={busy}>
              Save profile
            </button>
          </form>
          <button
            className="night-button secondary"
            style={{ marginTop: 20 }}
            disabled={busy || user.is_verified}
            onClick={() =>
              run(async () => {
                const r = await api.post("/auth/resend-verification");
                setMessage(r.message);
              })
            }
          >
            Send verification email
          </button>
        </section>
        <section className="glass-panel">
          <h2>Change password</h2>
          <form
            className="night-form"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api.post("/auth/change-password", {
                  current_password: current,
                  new_password: password,
                });
                setUser(null);
                navigate("/login");
              });
            }}
          >
            <label>
              Current password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </label>
            <label>
              New password
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="small-note">
                8+ characters, including a letter and a number.
              </span>
            </label>
            <button className="night-button" disabled={busy}>
              Change password
            </button>
          </form>
        </section>
      </div>
      <div className="action-row">
        <button
          className="night-button secondary"
          disabled={busy}
          onClick={() =>
            run(async () => {
              await logout();
              navigate("/");
            })
          }
        >
          Sign out
        </button>
        {user.role === "admin" && (
          <Link className="night-button secondary" to="/admin">
            Administration
          </Link>
        )}
      </div>
    </PageShell>
  );
}

export function VerifyPage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState(
    token.length >= 10
      ? ""
      : "This verification link is missing or invalid. Request a new verification email from My account.",
  );
  const [busy, setBusy] = useState(false);
  return (
    <PageShell title="Verify your email">
      <section className="glass-panel">
        <Feedback error={error} message={message} />
        <p>
          Confirm below to verify the address associated with this email link.
        </p>
        <button
          className="night-button"
          disabled={busy || Boolean(message) || token.length < 10}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              setMessage(
                (
                  await api.post("/auth/verify-email", {
                    token,
                  })
                ).message,
              );
              if (auth.user) {
                try {
                  auth.setUser(await api.get("/auth/me"));
                } catch {
                  /* Verification succeeded; sign-in can refresh the account later. */
                }
              }
            } catch (e) {
              setError(errorText(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Verify email
        </button>
        <Link to="/profile" className="inline-link" style={{ marginLeft: 20 }}>
          Your account
        </Link>
      </section>
    </PageShell>
  );
}

export function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    api
      .get("/admin/summary")
      .then((r) => {
        if (mounted.current) setData(r);
      })
      .catch((e) => {
        if (mounted.current) setError(errorText(e));
      });
    return () => {
      mounted.current = false;
    };
  }, []);
  return (
    <PageShell
      title="Administration"
      lead="Aggregate operational counts. Private incident descriptions and chat content are not exposed here."
    >
      <Feedback error={error} />
      {data ? (
        <div className="stat-grid">
          {Object.entries(data).map(([key, value]) => (
            <section key={key} className="glass-panel">
              <strong>{value}</strong>
              <span>{key}</span>
            </section>
          ))}
        </div>
      ) : (
        !error && <p role="status">Loading summary…</p>
      )}
    </PageShell>
  );
}

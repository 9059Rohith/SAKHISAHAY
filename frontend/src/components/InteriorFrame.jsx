import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Icon, Lotus } from "./Icons";
import { useAuth } from "../lib/auth";
import {
  InteriorBackdrop,
  InteriorBanner,
  useInteriorMotion,
} from "./InteriorMotion";

const navigation = [
  ["/dashboard", "home", "Dashboard"],
  ["/emergency-contacts", "users", "Trusted contacts"],
  ["/location", "pin", "Live location"],
  ["/chatbot", "sparkles", "AI companion"],
  ["/reporting", "shield", "My incidents"],
  ["/safety-information", "book", "Safety resources"],
  ["/profile", "user", "My account"],
];
const accountRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/recovery-code",
];

export default function InteriorFrame({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 900px)").matches,
  );
  const sidebar = useRef(null);
  const menuButton = useRef(null);
  const motionRoot = useRef(null);
  useInteriorMotion(motionRoot, pathname);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    setMenu(false);
  }, [pathname]);
  useEffect(() => {
    if (!menu || !mobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector(".portal-sidebar-close")?.focus();
    const key = (e) => {
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") {
        const controls = sidebar.current?.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex="0"]',
        );
        const first = controls?.[0],
          last = controls?.[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
      menuButton.current?.focus();
    };
  }, [menu, mobile]);
  if (pathname === "/") return children;
  const brand = (
    <Link to="/" className="portal-brand">
      <Lotus size={38} />
      <span>SakhiSahay</span>
    </Link>
  );
  if (accountRoutes.includes(pathname))
    return (
      <div className="interior-app auth-experience" ref={motionRoot}>
        <aside className="auth-story">
          {brand}
          <div className="auth-story-copy">
            <span className="portal-kicker">
              YOUR PERSONAL SAFETY COMPANION
            </span>
            <h2>
              A little support.
              <br />
              <em>A world of reassurance.</em>
            </h2>
            <p>
              Your people, your journey, your peace of mind. A personal space
              built around you.
            </p>
            <div className="auth-story-points">
              <span>
                <Icon name="shield" size={18} /> Private by design
              </span>
              <span>
                <Icon name="users" size={18} /> Connected to your people
              </span>
            </div>
          </div>
          <p className="auth-story-footer">Together for safer tomorrows.</p>
        </aside>
        <div className="auth-panel">
          <Link to="/" className="auth-mobile-brand">
            {<Lotus size={30} />}
            <span>SakhiSahay</span>
          </Link>
          {children}
        </div>
      </div>
    );
  if (pathname.startsWith("/share/"))
    return (
      <div className="interior-app shared-experience" ref={motionRoot}>
        <InteriorBackdrop pathname={pathname} />
        <header className="shared-topbar">
          {brand}
          <span className="portal-private">
            <Icon name="shield" size={16} /> Private shared journey
          </span>
        </header>
        <div className="portal-public-content">
          <InteriorBanner pathname={pathname} />
          {children}
        </div>
      </div>
    );
  const title =
    navigation.find(([path]) => path === pathname)?.[2] ||
    (pathname === "/admin"
      ? "Administration"
      : pathname === "/sos"
        ? "Emergency tools"
        : "Your space");
  const name = user?.full_name || "Your safety space";
  return (
    <div
      className={`interior-app portal-app ${menu ? "menu-open" : ""}`}
      ref={motionRoot}
    >
      {menu && (
        <button
          className="portal-nav-backdrop"
          aria-label="Close navigation overlay"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        className="portal-sidebar"
        id="application-navigation"
        ref={sidebar}
        inert={mobile && !menu ? true : undefined}
        aria-hidden={mobile && !menu ? true : undefined}
        role={mobile && menu ? "dialog" : undefined}
        aria-modal={mobile && menu ? true : undefined}
        aria-label={mobile && menu ? "Application menu" : undefined}
      >
        <div className="portal-sidebar-brand">
          {brand}
          <button
            className="portal-sidebar-close"
            aria-label="Close application menu"
            onClick={() => setMenu(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="portal-nav-label">YOUR SPACE</p>
        <nav aria-label="Application navigation">
          {navigation.map(([path, icon, label]) => (
            <NavLink key={path} to={path} end>
              <Icon name={icon} size={21} />
              <span>{label}</span>
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink to="/admin">
              <Icon name="shield" size={21} />
              <span>Administration</span>
            </NavLink>
          )}
        </nav>
        <div className="portal-support">
          <span className="portal-support-icon">
            <Icon name="siren" size={21} />
          </span>
          <h3>Emergency support</h3>
          <p>In immediate danger? Call India’s emergency number directly.</p>
          <a href="tel:112">
            Call 112 <Icon name="arrow" size={17} />
          </a>
        </div>
        <Link to={user ? "/profile" : "/login"} className="portal-user">
          <span className="portal-avatar">{name.charAt(0).toUpperCase()}</span>
          <span>
            <strong>{name}</strong>
            <small>
              {user ? "Manage your account" : "Sign in to your account"}
            </small>
          </span>
          <Icon name="arrow" size={17} />
        </Link>
      </aside>
      <div
        className="portal-workspace"
        inert={mobile && menu ? true : undefined}
      >
        <InteriorBackdrop pathname={pathname} />
        <header className="portal-header">
          <button
            className="portal-menu-toggle"
            ref={menuButton}
            aria-label="Open application menu"
            aria-expanded={menu}
            aria-controls="application-navigation"
            onClick={() => setMenu(!menu)}
          >
            <Icon name="menu" />
          </button>
          <div className="portal-breadcrumb">
            <strong>{title}</strong>
            <span>Your space</span>
          </div>
          <div className="portal-header-actions">
            <span className="portal-private">
              <Icon name="shield" size={16} /> Personal & private
            </span>
            <Link to="/sos" className="portal-sos-link">
              <Icon name="siren" size={19} /> Open SOS
            </Link>
            {user ? (
              <button
                className="portal-signout"
                onClick={async () => {
                  try {
                    await logout();
                    navigate("/login");
                  } catch {
                    setError("Unable to sign out. Please try again.");
                  }
                }}
              >
                Log out
              </button>
            ) : (
              <Link className="portal-signout" to="/login">
                Sign in
              </Link>
            )}
            <Link
              to={user ? "/profile" : "/login"}
              className="portal-avatar"
              aria-label="Your account"
            >
              {name.charAt(0).toUpperCase()}
            </Link>
          </div>
        </header>
        <div className="portal-content">
          <InteriorBanner key={pathname} pathname={pathname} />
          {error && (
            <p className="feedback" role="alert">
              {error}
            </p>
          )}
          {children}
        </div>
        <footer className="portal-footer">
          <span>Your choices. Your pace. Your safety.</span>
          <Link to="/safety-information">
            Safety resources <Icon name="arrow" size={14} />
          </Link>
        </footer>
      </div>
    </div>
  );
}

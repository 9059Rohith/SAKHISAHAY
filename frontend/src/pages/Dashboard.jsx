import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Dashboard.css";

/* ==========================================================================
   DATA
   ========================================================================== */

// Temporary placeholder until authentication is connected.
const USER_NAME = "User";

const NAV_LINKS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "SOS", to: "/sos" },
  { label: "Contacts", to: "/emergency-contacts" },
  { label: "Location", to: "/location" },
  { label: "Chatbot", to: "/chatbot" },
  { label: "Reporting", to: "/reporting" },
];

const QUICK_ACCESS = [
  {
    icon: "users",
    title: "Emergency Contact Management",
    description: "Add and organise the people who should be told when you need help.",
    to: "/emergency-contacts",
    cta: "Open contacts",
  },
  {
    icon: "pin",
    title: "Live Location Sharing",
    description: "Share where you are with trusted contacts while you travel.",
    to: "/location",
    cta: "Open location",
  },
  {
    icon: "chat",
    title: "AI Safety Chatbot",
    description: "Ask safety questions and get calm, practical guidance.",
    to: "/chatbot",
    cta: "Open chatbot",
  },
  {
    icon: "report",
    title: "Harassment Reporting Assistance",
    description: "Understand your options and record an incident at your own pace.",
    to: "/reporting",
    cta: "Open reporting",
  },
  {
    icon: "info",
    title: "Safety Information and Guidance",
    description: "Read practical tips for staying safe at home, at work and on the move.",
    to: "/safety-information",
    cta: "Read guidance",
  },
];

/* ==========================================================================
   ICONS
   ========================================================================== */

const ICON_PATHS = {
  shield: (
    <>
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M21 21v-2a4 4 0 00-3-3.9" />
      <path d="M16 3.1a4 4 0 010 7.8" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1116 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  chat: (
    <>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </>
  ),
  report: (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0012 2z" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
};

function Icon({ name, size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ==========================================================================
   TOP NAVIGATION
   ========================================================================== */

function DashboardNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header className="db-header">
      <div className="db-container db-header__inner">
        <Link to="/" className="db-brand" aria-label="SAKHISAHAY home" onClick={closeMenu}>
          <span className="db-brand__mark">
            <Icon name="shield" size={22} />
          </span>
          <span className="db-brand__name">SAKHISAHAY</span>
        </Link>

        <nav
          id="dashboard-navigation"
          className={`db-nav${open ? " is-open" : ""}`}
          aria-label="Dashboard"
        >
          <ul className="db-nav__links">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="db-nav__link"
                  aria-current={link.to === "/dashboard" ? "page" : undefined}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="db-nav__account">
            <div className="db-profile">
              <span className="db-profile__avatar" aria-hidden="true">
                {USER_NAME.charAt(0).toUpperCase()}
              </span>
              <span className="db-profile__name">{USER_NAME}</span>
            </div>
            <Link to="/login" className="db-btn db-btn--outline" onClick={closeMenu}>
              <Icon name="logout" size={18} />
              Logout
            </Link>
          </div>
        </nav>

        <button
          type="button"
          className="db-nav-toggle"
          aria-expanded={open}
          aria-controls="dashboard-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? "close" : "menu"} size={24} />
        </button>
      </div>
    </header>
  );
}

/* ==========================================================================
   SECTIONS
   ========================================================================== */

function WelcomeSection() {
  return (
    <section className="db-card db-welcome" aria-labelledby="welcome-title">
      <div className="db-welcome__text">
        <h1 id="welcome-title">Welcome back!</h1>
        <p className="db-welcome__name">Hello, {USER_NAME}.</p>
        <p>
          Staying prepared is a caring thing to do for yourself. Take a moment to
          review your safety tools whenever you need to. You are not alone.
        </p>
      </div>
      <span className="db-welcome__badge" aria-hidden="true">
        <Icon name="shield" size={56} />
      </span>
    </section>
  );
}

function SosSection() {
  return (
    <section className="db-card db-sos" aria-labelledby="sos-title">
      <h2 id="sos-title">Emergency SOS</h2>
      <p>
        If you ever feel unsafe, open the SOS page. It is the fastest way to reach
        the emergency tools in SAKHISAHAY.
      </p>

      <div className="db-sos__ring">
        <Link to="/sos" className="db-sos__button" aria-label="Open the SOS emergency page">
          SOS
        </Link>
      </div>

      <p className="db-notice" role="note">
        <Icon name="info" size={20} />
        <span>
          <strong>Preview version:</strong> emergency calls and messages are not
          active yet. In an emergency in India, dial <strong>112</strong>.
        </span>
      </p>
    </section>
  );
}

function QuickAccessCard({ icon, title, description, to, cta }) {
  return (
    <li className="db-card db-quick__card">
      <span className="db-icon-badge">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={to} className="db-btn db-btn--outline db-quick__link">
        {cta}
        <Icon name="arrow" size={16} />
      </Link>
    </li>
  );
}

function QuickAccessSection() {
  return (
    <section className="db-section" aria-labelledby="quick-title">
      <div className="db-section__head">
        <h2 id="quick-title">Quick access</h2>
        <p>Jump straight to the tools you use most.</p>
      </div>
      <ul className="db-quick">
        {QUICK_ACCESS.map((item) => (
          <QuickAccessCard key={item.to} {...item} />
        ))}
      </ul>
    </section>
  );
}

function ContactOverview() {
  return (
    <section className="db-card db-contacts" aria-labelledby="contacts-title">
      <h2 id="contacts-title">Emergency contacts</h2>
      <p className="db-contacts__intro">
        Contacts you save will appear here.
      </p>

      <div className="db-empty">
        <span className="db-icon-badge">
          <Icon name="users" size={26} />
        </span>
        <h3>No emergency contacts added yet</h3>
        <p>Add people you trust, such as family or close friends, to get started.</p>
        <Link to="/emergency-contacts" className="db-btn db-btn--primary">
          <Icon name="plus" size={18} />
          Add Contact
        </Link>
      </div>
    </section>
  );
}

function SafetyReminder() {
  return (
    <aside className="db-card db-reminder" aria-labelledby="reminder-title">
      <span className="db-icon-badge db-icon-badge--lavender">
        <Icon name="lightbulb" size={26} />
      </span>
      <h2 id="reminder-title">Safety reminder</h2>
      <p>
        Before you head out, tell someone you trust where you are going and when
        you expect to arrive. Keep your phone charged and stay on well-lit,
        familiar routes whenever you can.
      </p>
    </aside>
  );
}

/* ==========================================================================
   PAGE
   ========================================================================== */

export default function Dashboard() {
  return (
    <div className="db-page">
      <DashboardNav />

      <main className="db-container db-main">
        <div className="db-top">
          <WelcomeSection />
          <SosSection />
        </div>

        <QuickAccessSection />

        <div className="db-bottom">
          <ContactOverview />
          <SafetyReminder />
        </div>
      </main>
    </div>
  );
}

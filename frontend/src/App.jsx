import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useInRouterContext,
  useLocation,
} from "react-router-dom";
import "./App.css";

/* ==========================================================================
   DATA
   ========================================================================== */

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
];

const PILLARS = [
  {
    icon: "shield",
    title: "Safety",
    text: "Tools that help you prepare, stay aware and act quickly when something feels wrong.",
  },
  {
    icon: "accessibility",
    title: "Accessibility",
    text: "A clear, calm interface that works on any phone, tablet or computer, for everyone.",
  },
  {
    icon: "bell",
    title: "Emergency assistance",
    text: "A fast path to alert trusted people and share where you are when every second counts.",
  },
];

const FEATURES = [
  {
    icon: "bell",
    title: "Emergency SOS Assistance",
    description:
      "Raise an alert with one tap so the people you trust know you need help right away.",
    to: "/sos",
    cta: "Open SOS",
  },
  {
    icon: "users",
    title: "Emergency Contact Management",
    description:
      "Save, edit and organise the family and friends who should be notified in an emergency.",
    to: "/emergency-contacts",
    cta: "Manage contacts",
  },
  {
    icon: "pin",
    title: "Live Location Sharing",
    description:
      "Share your real-time location with trusted contacts while you travel or feel unsafe.",
    to: "/location",
    cta: "Share location",
  },
  {
    icon: "chat",
    title: "AI Safety Chatbot",
    description:
      "Ask safety questions any time and get calm, practical guidance in simple language.",
    to: "/chatbot",
    cta: "Chat now",
  },
  {
    icon: "report",
    title: "Harassment Reporting Assistance",
    description:
      "Understand your options and record an incident step by step, at your own pace.",
    to: "/reporting",
    cta: "Report an incident",
  },
  {
    icon: "info",
    title: "Safety Information and Guidance",
    description:
      "Read practical tips on staying safe at home, at work, in public and while travelling.",
    to: null,
  },
];

const STEPS = [
  {
    title: "Tap the SOS button",
    text: "Open the SOS page from anywhere in SAKHISAHAY with a single tap.",
  },
  {
    title: "Your trusted contacts are alerted",
    text: "The emergency contacts you saved are told that you need help.",
  },
  {
    title: "Your live location is shared",
    text: "They can see where you are, so they can reach you sooner.",
  },
  {
    title: "Follow guidance until help arrives",
    text: "Clear, step-by-step safety advice stays on screen while you wait.",
  },
];

const FOOTER_EXPLORE = [
  { label: "Emergency SOS", to: "/sos" },
  { label: "Emergency contacts", to: "/emergency-contacts" },
  { label: "Live location", to: "/location" },
  { label: "AI safety chatbot", to: "/chatbot" },
  { label: "Report an incident", to: "/reporting" },
];

/* ==========================================================================
   SMALL REUSABLE COMPONENTS
   ========================================================================== */

const ICON_PATHS = {
  shield: (
    <>
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9z" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
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
  accessibility: (
    <>
      <circle cx="12" cy="4.5" r="1.7" />
      <path d="M5 8.5l7 1 7-1" />
      <path d="M12 9.5v5" />
      <path d="M9 21l3-6.5 3 6.5" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
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

function Icon({ name, size = 24, className = "" }) {
  return (
    <svg
      className={className}
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

/**
 * Renders a router <Link> (to), an anchor (href) or a <button>.
 * variant: primary | secondary | ghost    size: lg
 */
function Button({
  to,
  href,
  variant = "primary",
  size,
  className = "",
  children,
  ...rest
}) {
  const classes = ["btn", `btn--${variant}`, size ? `btn--${size}` : "", className]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

function SectionHeading({ id, title, description, align = "center" }) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <h2 id={id}>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

/* ==========================================================================
   NAVBAR
   ========================================================================== */

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
      <div className="container navbar__inner">
        <Link to="/" className="brand" onClick={closeMenu} aria-label="SAKHISAHAY home">
          <span className="brand__mark">
            <Icon name="shield" size={22} />
          </span>
          <span className="brand__name">SAKHISAHAY</span>
        </Link>

        <nav
          id="primary-navigation"
          className={`nav${open ? " is-open" : ""}`}
          aria-label="Primary"
        >
          <ul className="nav__links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="nav__link" onClick={closeMenu}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="nav__actions">
            <Button to="/login" variant="secondary" onClick={closeMenu}>
              Login
            </Button>
            <Button to="/register" variant="primary" onClick={closeMenu}>
              Get Started
            </Button>
          </div>
        </nav>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primary-navigation"
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
   HERO
   ========================================================================== */

function HeroIllustration() {
  return (
    <div className="hero__visual">
      <svg
        className="hero__art"
        viewBox="0 0 480 480"
        role="img"
        aria-label="Illustration of a woman protected by a shield"
      >
        <defs>
          <clipPath id="sk-shield-clip">
            <path d="M240 98 L352 140 V252 C352 322 306 370 240 398 C174 370 128 322 128 252 V140 Z" />
          </clipPath>
        </defs>

        {/* soft backdrop */}
        <circle cx="240" cy="240" r="214" fill="#F5DCE5" />
        <circle
          cx="240"
          cy="240"
          r="232"
          fill="none"
          stroke="#B8A5D6"
          strokeWidth="2"
          strokeDasharray="3 14"
          strokeLinecap="round"
        />

        {/* shield */}
        <path
          d="M240 66 L382 118 V252 C382 340 322 408 240 442 C158 408 98 340 98 252 V118 Z"
          fill="#B8A5D6"
        />
        <path
          d="M240 98 L352 140 V252 C352 322 306 370 240 398 C174 370 128 322 128 252 V140 Z"
          fill="#FFFAFC"
        />

        {/* figure */}
        <g clipPath="url(#sk-shield-clip)">
          <ellipse cx="240" cy="232" rx="44" ry="62" fill="#49364F" />
          <path
            d="M158 400 C158 322 196 276 240 276 C284 276 322 322 322 400 Z"
            fill="#C77D98"
          />
          <path d="M240 276 L214 300 L240 330 L266 300 Z" fill="#FFFAFC" opacity="0.9" />
          <rect x="228" y="250" width="24" height="32" rx="10" fill="#E9BFCB" />
          <circle cx="240" cy="222" r="30" fill="#E9BFCB" />
          <path
            d="M208 222 C206 188 230 174 248 178 C270 182 280 200 272 232 C268 210 254 198 238 200 C224 202 214 210 208 222 Z"
            fill="#49364F"
          />
        </g>

        {/* check badge */}
        <circle cx="240" cy="338" r="17" fill="#FFFAFC" stroke="#49364F" strokeWidth="2.5" />
        <path
          d="M232 338 l6 6 l11 -12"
          fill="none"
          stroke="#49364F"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* small decorative dots */}
        <circle cx="70" cy="150" r="7" fill="#C77D98" opacity="0.55" />
        <circle cx="420" cy="320" r="9" fill="#B8A5D6" />
        <circle cx="392" cy="82" r="5" fill="#49364F" opacity="0.5" />
        <circle cx="86" cy="388" r="5" fill="#B8A5D6" />
      </svg>

      <div className="float-card float-card--top" aria-hidden="true">
        <span className="float-card__icon float-card__icon--rose">
          <Icon name="bell" size={18} />
        </span>
        <span>
          <strong>SOS ready</strong>
          <small>One tap to alert</small>
        </span>
      </div>

      <div className="float-card float-card--bottom" aria-hidden="true">
        <span className="float-card__icon float-card__icon--lavender">
          <Icon name="pin" size={18} />
        </span>
        <span>
          <strong>Location shared</strong>
          <small>With 3 trusted contacts</small>
        </span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__content">
          <h1 id="hero-title">Safety that stays with you, wherever you go.</h1>
          <p className="hero__lead">
            SAKHISAHAY is a women&rsquo;s safety companion. Alert people you trust,
            share your location, get guidance from a safety chatbot and report
            harassment, all from one calm, simple place.
          </p>
          <div className="hero__actions">
            <Button to="/register" variant="primary" size="lg">
              Get Started
            </Button>
            <Button href="#features" variant="secondary" size="lg">
              Explore Features
            </Button>
          </div>
          <ul className="hero__points">
            <li>Quick to reach</li>
            <li>Easy to use</li>
            <li>Built with care</li>
          </ul>
        </div>
        <HeroIllustration />
      </div>
    </section>
  );
}

/* ==========================================================================
   ABOUT
   ========================================================================== */

function About() {
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="container about__grid">
        <div className="about__text">
          <SectionHeading
            id="about-title"
            align="left"
            title="Support that is ready before you need it"
          />
          <p>
            SAKHISAHAY exists to help women feel safer in everyday life. It brings
            the most important safety tools together in one place, so that in a
            stressful moment you are not searching for what to do next.
          </p>
          <p>
            We focus on three things: keeping you safe, keeping the experience
            accessible to everyone, and making emergency assistance fast and clear.
          </p>
        </div>

        <ul className="pillars">
          {PILLARS.map((pillar) => (
            <li key={pillar.title} className="pillar">
              <span className="icon-badge">
                <Icon name={pillar.icon} size={24} />
              </span>
              <div>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ==========================================================================
   FEATURES
   ========================================================================== */

function FeatureCard({ icon, title, description, to, cta }) {
  return (
    <article className="feature-card">
      <span className="icon-badge">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {to ? (
        <Link to={to} className="feature-card__link">
          {cta}
          <Icon name="arrow" size={16} />
        </Link>
      ) : (
        <span className="feature-card__soon">Coming soon</span>
      )}
    </article>
  );
}

function Features() {
  return (
    <section id="features" className="section features" aria-labelledby="features-title">
      <div className="container">
        <SectionHeading
          id="features-title"
          title="Everything you need to feel prepared"
          description="Six tools designed to work together, so help is never far away."
        />
        <div className="features__grid">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   EMERGENCY ASSISTANCE
   ========================================================================== */

function Emergency() {
  return (
    <section id="emergency" className="section emergency" aria-labelledby="emergency-title">
      <div className="container">
        <div className="emergency__panel">
          <div className="emergency__intro">
            <h2 id="emergency-title">Help is one tap away</h2>
            <p>
              If you ever feel unsafe, go straight to the SOS page. SAKHISAHAY is
              built to get your message to the right people quickly.
            </p>

            <div className="sos-wrap">
              <Link to="/sos" className="sos-button" aria-label="Open the SOS emergency page">
                SOS
              </Link>
            </div>

            <p className="emergency__note">
              Preview version: SOS calls and messages are not active yet. In an
              emergency in India, dial <strong>112</strong>.
            </p>
          </div>

          <div className="emergency__steps">
            <h3>How emergency assistance works</h3>
            <ol className="steps">
              {STEPS.map((step) => (
                <li key={step.title} className="step">
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   FOOTER
   ========================================================================== */

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="footer">
      <div className="container footer__grid">
        <div className="footer__about">
          <Link to="/" className="brand brand--light" aria-label="SAKHISAHAY home">
            <span className="brand__mark">
              <Icon name="shield" size={22} />
            </span>
            <span className="brand__name">SAKHISAHAY</span>
          </Link>
          <p>
            A women&rsquo;s safety and emergency assistance platform that keeps
            help, guidance and your trusted people within reach.
          </p>
        </div>

        <nav className="footer__col" aria-label="Footer navigation">
          <h3>Quick links</h3>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Get Started</Link>
            </li>
          </ul>
        </nav>

        <nav className="footer__col" aria-label="Safety tools">
          <h3>Safety tools</h3>
          <ul>
            {FOOTER_EXPLORE.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__col">
          <h3>Contact</h3>
          <ul className="footer__contact">
            <li>
              <Icon name="mail" size={18} />
              <span>support@sakhisahay.example</span>
            </li>
            <li>
              <Icon name="phone" size={18} />
              <span>+91 00000 00000</span>
            </li>
            <li>
              <Icon name="pin" size={18} />
              <span>Your city, State, India</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>&copy; {year} SAKHISAHAY. All rights reserved.</p>
        <p>In immediate danger? Call 112.</p>
      </div>
    </footer>
  );
}

/* ==========================================================================
   PAGES
   ========================================================================== */

function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Features />
        <Emergency />
      </main>
      <Footer />
    </>
  );
}

/**
 * Temporary stand-in for pages that are built elsewhere.
 * Replace each <PlaceholderPage /> in AppRoutes with your real component, e.g.
 *   import Login from "./pages/Login";
 *   <Route path="/login" element={<Login />} />
 */
function PlaceholderPage({ title }) {
  return (
    <main className="placeholder">
      <div className="placeholder__card">
        <span className="icon-badge">
          <Icon name="shield" size={26} />
        </span>
        <h1>{title}</h1>
        <p>This page is not built yet.</p>
        <Button to="/" variant="primary">
          Back to home
        </Button>
      </div>
    </main>
  );
}

/* ==========================================================================
   ROUTING
   ========================================================================== */

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function AppRoutes() {
  return (
    <div className="sk-app">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<PlaceholderPage title="Login" />} />
        <Route path="/register" element={<PlaceholderPage title="Get Started" />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
        <Route
          path="/emergency-contacts"
          element={<PlaceholderPage title="Emergency Contacts" />}
        />
        <Route path="/sos" element={<PlaceholderPage title="Emergency SOS" />} />
        <Route path="/location" element={<PlaceholderPage title="Live Location" />} />
        <Route path="/chatbot" element={<PlaceholderPage title="AI Safety Chatbot" />} />
        <Route path="/reporting" element={<PlaceholderPage title="Report an Incident" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

/**
 * main.jsx is untouched, so this works whether or not it already wraps <App />
 * in a router: if a router exists we use it, otherwise we provide one.
 */
export default function App() {
  const insideRouter = useInRouterContext();

  if (insideRouter) return <AppRoutes />;

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

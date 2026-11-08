import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, Lotus } from "../components/Icons";
import { useAuth } from "../lib/auth";
import HomeSections from "../components/HomeSections";
import { useScrollMotion } from "../components/Motion";

const tools = [
  {
    icon: "siren",
    title: "SOS Emergency",
    text: (
      <>
        Get instant help with
        <br />
        one tap
      </>
    ),
    to: "/sos",
    className: "emergency",
  },
  {
    icon: "pin",
    title: "Live Location",
    text: (
      <>
        Share your real-time
        <br />
        location with trusted contacts
      </>
    ),
    to: "/location",
  },
  {
    icon: "users",
    title: "Trusted Contacts",
    text: (
      <>
        Add & manage your
        <br />
        safety circle
      </>
    ),
    to: "/emergency-contacts",
  },
  {
    icon: "sparkles",
    title: "AI Safety Assistant",
    text: (
      <>
        Get quick, reliable
        <br />
        guidance anytime
      </>
    ),
    to: "/chatbot",
  },
  {
    icon: "book",
    title: "Safety Resources",
    text: (
      <>
        Laws, helplines &<br />
        self-defense tips
      </>
    ),
    to: "/safety-information",
  },
  {
    icon: "chat",
    title: "Community Support",
    text: (
      <>
        Report, discuss &<br />
        stay aware
      </>
    ),
    to: "/reporting",
  },
];

function Demo({ close }) {
  const ref = useRef(null);
  const [step, setStep] = useState(0);
  const steps = [
    [
      "Build your safety circle",
      "Save the people you trust in Emergency Contacts. Your contacts stay available whenever you sign in.",
      "users",
      "/emergency-contacts",
    ],
    [
      "Share the journey",
      "Create a private, expiring location link. Share it with someone you trust and keep this tab open for updates.",
      "pin",
      "/location",
    ],
    [
      "Reach out when you need to",
      "Create an SOS alert, call 112, or open an SMS to a trusted contact. You control sending the message.",
      "siren",
      "/sos",
    ],
  ];
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  const item = steps[step];
  return (
    <dialog
      ref={ref}
      className="night-dialog"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      aria-labelledby="demo-title"
    >
      <button
        className="dialog-close"
        onClick={close}
        aria-label="Close walkthrough"
      >
        <Icon name="close" />
      </button>
      <div className="demo-orbit">
        <Icon name={item[2]} size={60} />
      </div>
      <p className="soft-label">YOUR SAFETY, STEP BY STEP · {step + 1} / 3</p>
      <h2 id="demo-title" key={step}>
        {item[0]}
      </h2>
      <p>{item[1]}</p>
      <div className="demo-dots">
        {steps.map((_, i) => (
          <button
            key={i}
            aria-label={`Step ${i + 1}`}
            aria-pressed={step === i}
            onClick={() => setStep(i)}
          />
        ))}
      </div>
      <div className="action-row">
        {step < 2 ? (
          <button className="night-button" onClick={() => setStep(step + 1)}>
            Next <Icon name="arrow" />
          </button>
        ) : (
          <Link className="night-button" to={item[3]}>
            Explore your safety tools <Icon name="arrow" />
          </Link>
        )}
      </div>
    </dialog>
  );
}

export default function Home() {
  const { user } = useAuth();
  const root = useRef(null);
  useScrollMotion(root);
  const [demo, setDemo] = useState(false);
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0,
      x = 0,
      y = 0,
      scroll = 0;
    const update = () => {
      element.style.setProperty("--px", `${x}px`);
      element.style.setProperty("--py", `${y}px`);
      element.style.setProperty("--sy", `${scroll}px`);
      frame = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const pointer = (e) => {
      x = (e.clientX / innerWidth - 0.5) * 9;
      y = (e.clientY / innerHeight - 0.5) * 7;
      schedule();
    };
    const onScroll = () => {
      scroll = Math.min(window.scrollY, innerHeight) * 0.12;
      schedule();
    };
    const reset = () => {
      x = 0;
      y = 0;
      schedule();
    };
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerleave", reset);
    };
  }, []);
  return (
    <div className="night-home" ref={root}>
      <div className="landscape" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true" />
      <div className="petals" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} style={{ "--i": i }} />
        ))}
      </div>
      <section className="home-viewport">
        <header className="night-nav">
          <Link className="night-brand" to="/" aria-label="SakhiSahay home">
            <Lotus />
            <span>SakhiSahay</span>
          </Link>
          <button
            className="night-mobile-toggle"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <Icon name={menu ? "close" : "menu"} />
          </button>
          <nav
            className={menu ? "night-navlinks open" : "night-navlinks"}
            aria-label="Main navigation"
          >
            <Link to="/" className="active">
              <Icon name="home" />
              Home
            </Link>
            <a href="#safety-tools" onClick={() => setMenu(false)}>
              <Icon name="shield" />
              Safety Tools
            </a>
            <Link to="/safety-information">
              <Icon name="book" />
              Resources
            </Link>
            <Link to="/reporting">
              <Icon name="users" />
              Community
            </Link>
          </nav>
          <div className="night-nav-actions">
            <button
              className="notification-button"
              aria-label="Safety notifications"
              aria-expanded={notifications}
              onClick={() => setNotifications(!notifications)}
            >
              <Icon name="bell" size={28} />
              {!user && <i />}
            </button>
            <Link
              className="account-button"
              to={user ? "/profile" : "/login"}
              aria-label={user ? "Your account" : "Sign in"}
            >
              <Icon name="user" size={29} />
            </Link>
          </div>
          {notifications && (
            <aside className="notification-panel">
              <h3>Your safety space</h3>
              <p>
                {user
                  ? "Review your trusted contacts and keep their details up to date."
                  : "Sign in to save your trusted contacts and access your private safety tools."}
              </p>
              <Link to={user ? "/emergency-contacts" : "/login"}>
                {user ? "Review contacts" : "Sign in"}{" "}
                <Icon name="arrow" size={16} />
              </Link>
            </aside>
          )}
        </header>
        <main className="home-composition">
          <div className="home-copy">
            <p className="home-eyebrow">YOUR PERSONAL SAFETY COMPANION</p>
            <h1 className="home-title" aria-label="SakhiSahay">
              {"Sakhi".split("").map((c, i) => (
                <span key={i} style={{ "--letter": i }}>
                  {c}
                </span>
              ))}
              <em>
                {"Sahay".split("").map((c, i) => (
                  <span key={i} style={{ "--letter": i + 5 }}>
                    {c}
                  </span>
                ))}
              </em>
            </h1>
            <svg
              className="title-swish"
              viewBox="0 0 220 23"
              aria-hidden="true"
            >
              <path d="M6 17Q101-3 213 10Q114 0 6 23Z" fill="currentColor" />
            </svg>
            <p className="home-description">
              Empowering women with real-time safety,
              <br className="desktop-break" /> instant support, and a stronger
              community.
            </p>
            <div className="home-ctas">
              <Link
                className="get-started"
                to={user ? "/dashboard" : "/register"}
              >
                <Icon name="rocket" />
                {user ? "My Dashboard" : "Get Started"}
                <Icon name="arrow" />
              </Link>
              <button className="watch-demo" onClick={() => setDemo(true)}>
                <Icon name="play" size={21} />
                Watch Demo
              </button>
            </div>
          </div>
          <div className="home-tools" id="safety-tools">
            <div className="safety-grid">
              {tools.map((tool, i) => (
                <Link
                  key={tool.to}
                  to={tool.to}
                  className={`glass-tool ${tool.className || ""}`}
                  style={{ "--order": i }}
                >
                  <div className="tool-icon">
                    <Icon name={tool.icon} />
                  </div>
                  <div className="tool-text">
                    <h2>{tool.title}</h2>
                    <p>{tool.text}</p>
                  </div>
                  {tool.className && (
                    <span className="tool-arrow">
                      <Icon name="arrow" size={18} />
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <Link
              to="/reporting"
              className="solidarity-banner"
              aria-label="Together for Safer Tomorrows. Explore reporting and support."
            />
          </div>
        </main>
      </section>
      <HomeSections signedIn={Boolean(user)} />
      {demo && <Demo close={() => setDemo(false)} />}
    </div>
  );
}

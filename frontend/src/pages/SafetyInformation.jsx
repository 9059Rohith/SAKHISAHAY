import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/SafetyInformation.css";

/* ---------- Inline SVG icons ---------- */

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

const ShieldIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const LockIcon = () => (
  <svg {...iconProps}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
    <circle cx="12" cy="15.5" r="1" />
  </svg>
);

const RouteIcon = () => (
  <svg {...iconProps}>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h7a3 3 0 000-6H9a3 3 0 010-6h7" />
  </svg>
);

const AlertIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3l9.5 17h-19L12 3z" />
    <path d="M12 10v4" />
    <path d="M12 17.5v.01" />
  </svg>
);

const PhoneIcon = () => (
  <svg {...iconProps}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M19 12H5" />
    <path d="M11 6l-6 6 6 6" />
  </svg>
);

const ExternalIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M14 4h6v6" />
    <path d="M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
  </svg>
);

/* ---------- Content ---------- */

const safetySections = [
  {
    id: "personal",
    title: "Personal Safety",
    summary: "Everyday habits that help you stay aware and in control.",
    Icon: ShieldIcon,
    tips: [
      {
        title: "Stay alert in public places",
        text: "Keep your head up and your phone and headphones at a level that lets you hear your surroundings. Notice exits, well-lit areas and people nearby, and trust your instincts if something feels off.",
      },
      {
        title: "Set personal boundaries",
        text: "You have the right to say no and to leave any situation that makes you uncomfortable. Be clear and firm about your limits; you do not owe anyone an explanation.",
      },
      {
        title: "Inform trusted people about your whereabouts",
        text: "Let a family member or friend know where you are going, who you are with and when you expect to be back. Update them if your plans change.",
      },
      {
        title: "What to do when you feel unsafe",
        text: "Move towards a well-lit, busy place such as a shop, a restaurant or a group of people. Call someone you trust, and if you believe you are in danger, call 112 for emergency assistance.",
      },
    ],
  },
  {
    id: "cyber",
    title: "Online and Cyber Safety",
    summary: "Protect your accounts, your privacy and your peace of mind online.",
    Icon: LockIcon,
    tips: [
      {
        title: "Protect your social media accounts",
        text: "Review your privacy settings regularly, limit who can see your posts, photos and location, and avoid sharing personal details such as your address or daily routine publicly.",
      },
      {
        title: "Use strong passwords and two-factor authentication",
        text: "Use a different, long password for each account and turn on two-factor authentication wherever it is available. Never share one-time passwords (OTPs) with anyone.",
      },
      {
        title: "Avoid suspicious links and unknown contacts",
        text: "Do not click on links or open attachments from unknown senders. Be careful about accepting requests from people you do not know, and be wary of messages that create urgency or ask for money or personal details.",
      },
      {
        title: "Handle cyberbullying and online harassment",
        text: "Do not engage with the harasser. Block and report the account on the platform, talk to someone you trust, and consider reporting serious harassment to the authorities.",
      },
      {
        title: "Preserve evidence of online harassment",
        text: "Take screenshots of messages, posts and profiles that show dates, times and usernames, and save links and URLs. Keep the originals and do not delete anything until you have stored copies safely, as this may help when you report the matter.",
      },
    ],
  },
  {
    id: "travel",
    title: "Travel Safety",
    summary: "Plan ahead and stay aware, whether you travel near or far.",
    Icon: RouteIcon,
    tips: [
      {
        title: "Plan journeys in advance",
        text: "Check your route, timings and the place you are heading to before you leave. Where possible, prefer well-lit and busy routes, and keep your phone charged.",
      },
      {
        title: "Share travel details with trusted contacts",
        text: "Tell someone you trust your route, your mode of transport and your expected arrival time. Share vehicle details and check in with them when you arrive.",
      },
      {
        title: "Use reliable transportation",
        text: "Choose licensed, well-known transport services where possible. Before you get in, confirm the vehicle number and the driver's details match your booking.",
      },
      {
        title: "Stay aware while travelling alone",
        text: "Keep your belongings close, stay alert to the people around you, and sit near the driver, the conductor or other passengers when you can. If you feel uncomfortable, move to another seat or get off at a safe, busy place.",
      },
    ],
  },
  {
    id: "preparedness",
    title: "Emergency Preparedness",
    summary: "Be ready before you need help, so you can act quickly.",
    Icon: AlertIcon,
    tips: [
      {
        title: "Keep emergency contacts accessible",
        text: "Save the numbers of trusted people in your phone so you can reach them quickly, and keep a written copy somewhere safe in case your phone is lost or out of battery.",
      },
      {
        title: "Know important emergency numbers",
        text: "Remember key numbers such as 112 (emergency), 181 (Women Helpline) and 1930 (Cyber Crime Helpline), and make sure people close to you know them too.",
      },
      {
        title: "Move to a safer place when possible",
        text: "If you can do so safely, move away from the threat towards a crowded, well-lit place, such as a shop, a hospital, a police station or a public building.",
      },
      {
        title: "Seek help from trusted people or authorities",
        text: "Reach out to a family member, a friend, a neighbour or the authorities as soon as you can. You do not have to handle a difficult situation on your own.",
      },
    ],
  },
];

const helplines = [
  {
    name: "Emergency Response Support System",
    number: "112",
    description:
      "India's single emergency number. Call it when you or someone else needs urgent help from the police, fire services or an ambulance.",
  },
  {
    name: "Women Helpline",
    number: "181",
    description:
      "A helpline for women facing violence or distress. It offers support, information and guidance on where to get further help.",
  },
  {
    name: "Cyber Crime Helpline",
    number: "1930",
    description:
      "A national helpline for reporting cyber crime, especially online financial fraud. Call it as soon as possible after a fraud occurs.",
  },
];

const PORTAL_URL = "https://cybercrime.gov.in";

/* ---------- Components ---------- */

function SafetyAccordionItem({ id, title, summary, Icon, isOpen, onToggle, children }) {
  const panelId = `safety-panel-${id}`;
  const buttonId = `safety-button-${id}`;

  return (
    <section className={`safety-card ${isOpen ? "safety-card-open" : ""}`}>
      <h2 className="safety-card-heading">
        <button
          type="button"
          id={buttonId}
          className="safety-card-toggle"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="safety-card-icon">
            <Icon />
          </span>
          <span className="safety-card-titles">
            <span className="safety-card-title">{title}</span>
            <span className="safety-card-summary">{summary}</span>
          </span>
          <span className="safety-card-chevron">
            <ChevronIcon />
          </span>
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="safety-card-panel"
        hidden={!isOpen}
      >
        {children}
      </div>
    </section>
  );
}

function SafetyInformation() {
  const [openSection, setOpenSection] = useState("personal");

  const toggleSection = (id) => {
    setOpenSection((current) => (current === id ? null : id));
  };

  return (
    <div className="safety-page">
      <header className="safety-header">
        <div className="safety-header-inner">
          <div className="safety-brand">
            <span className="safety-brand-mark">
              <ShieldIcon />
            </span>
            <span className="safety-brand-name">SAKHISAHAY</span>
          </div>
          <Link to="/dashboard" className="safety-back-link">
            <ArrowLeftIcon />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="safety-main">
        <div className="safety-intro">
          <h1 className="safety-title">Safety Information &amp; Guidance</h1>
          <p className="safety-subtitle">
            Practical tips to help you stay safe, prepared and informed, both
            offline and online.
          </p>
        </div>

        <aside className="safety-emergency" aria-labelledby="safety-emergency-title">
          <div className="safety-emergency-icon">
            <PhoneIcon />
          </div>
          <div className="safety-emergency-text">
            <h2 id="safety-emergency-title" className="safety-emergency-title">
              In an emergency, call 112
            </h2>
            <p>
              If you or someone else is in immediate danger, call{" "}
              <strong>112</strong>, India's Emergency Response Support System.
              This link opens your phone's dialer; SAKHISAHAY does not place
              the call or contact emergency services for you.
            </p>
          </div>
          <a href="tel:112" className="safety-emergency-button">
            Call 112
          </a>
        </aside>

        <div className="safety-list">
          {safetySections.map(({ id, title, summary, Icon, tips }) => (
            <SafetyAccordionItem
              key={id}
              id={id}
              title={title}
              summary={summary}
              Icon={Icon}
              isOpen={openSection === id}
              onToggle={() => toggleSection(id)}
            >
              <ul className="safety-tips">
                {tips.map((tip) => (
                  <li key={tip.title} className="safety-tip">
                    <h3 className="safety-tip-title">{tip.title}</h3>
                    <p className="safety-tip-text">{tip.text}</p>
                  </li>
                ))}
              </ul>
            </SafetyAccordionItem>
          ))}

          <SafetyAccordionItem
            id="helplines"
            title="Important Helplines in India"
            summary="Numbers and official resources you can reach out to."
            Icon={PhoneIcon}
            isOpen={openSection === "helplines"}
            onToggle={() => toggleSection("helplines")}
          >
            <ul className="safety-helplines">
              {helplines.map((line) => (
                <li key={line.number} className="safety-helpline">
                  <a
                    href={`tel:${line.number}`}
                    className="safety-helpline-number"
                    aria-label={`Call ${line.name} on ${line.number}`}
                  >
                    {line.number}
                  </a>
                  <div className="safety-helpline-body">
                    <h3 className="safety-tip-title">{line.name}</h3>
                    <p className="safety-tip-text">{line.description}</p>
                  </div>
                </li>
              ))}
              <li className="safety-helpline">
                <span className="safety-helpline-number safety-helpline-portal">
                  Web
                </span>
                <div className="safety-helpline-body">
                  <h3 className="safety-tip-title">
                    National Cyber Crime Reporting Portal
                  </h3>
                  <p className="safety-tip-text">
                    The official government portal for reporting cyber crimes
                    online, including crimes against women and children.
                  </p>
                  <a
                    href={PORTAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="safety-external-link"
                  >
                    cybercrime.gov.in
                    <ExternalIcon />
                  </a>
                </div>
              </li>
            </ul>
          </SafetyAccordionItem>
        </div>

        <p className="safety-disclaimer">
          <strong>Disclaimer:</strong> This page provides general safety
          information only. It is not a substitute for emergency services or
          for professional or legal advice. In an emergency, contact the
          appropriate authorities immediately.
        </p>
      </main>
    </div>
  );
}

export default SafetyInformation;

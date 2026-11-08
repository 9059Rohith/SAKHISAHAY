import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Reporting.css";
import IncidentRecords from "../components/IncidentRecords";

/* ------------------------------------------------------------------
   Verified resources used on this page (checked November 2026):
   - 112: India's single emergency number (Ministry of Home Affairs, ERSS)
   - 181: Women Helpline, 24x7 (Ministry of Women and Child Development)
   - 1930 and https://cybercrime.gov.in: National Cyber Crime Reporting
     helpline and portal (Ministry of Home Affairs)
   - 14490 and https://www.ncw.gov.in: National Commission for Women
   No legal provisions or complaint procedures are stated on this page.
------------------------------------------------------------------- */

/* ---------- Icons (inline SVG) ---------- */

const ICON_PATHS = {
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </>
  ),
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" />,
  eye: (
    <>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
      <path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" />
    </>
  ),
  hand: (
    <>
      <path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-6.9-4L3 15a2 2 0 0 1 3-2.6L8 14" />
    </>
  ),
  shield: <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" />,
  alert: (
    <>
      <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  external: (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14L21 3" />
    </>
  ),
};

function Icon({ name, size = 22 }) {
  return (
    <svg
      className="reporting-icon"
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

/* ---------- Page content ---------- */

const HARASSMENT_TYPES = [
  {
    id: "online",
    icon: "chat",
    title: "Online harassment and cyberbullying",
    summary:
      "Abusive, threatening or unwanted behaviour through social media, messaging apps, email or other online platforms.",
    examples: [
      "Repeated abusive or threatening messages or comments",
      "Fake profiles created to embarrass or target you",
      "Sharing, or threatening to share, private photos or information",
      "Persistent unwanted contact after you have asked the person to stop",
    ],
    consider: [
      "Save evidence before you block the person or delete anything.",
      "Use the report and block tools on the platform.",
      "Review your privacy settings and change your passwords.",
      "See the Help and Support section for the national cyber crime helpline and portal.",
    ],
  },
  {
    id: "stalking",
    icon: "eye",
    title: "Stalking and unwanted following",
    summary:
      "Being repeatedly followed, watched or contacted in a way that makes you feel unsafe.",
    examples: [
      "Someone following you on foot or in a vehicle",
      "Repeatedly appearing at your home, workplace, college or regular places",
      "Persistent calls or messages, or monitoring your movements",
    ],
    consider: [
      "Move towards a busy, well-lit public place. Avoid going home directly if you are being followed.",
      "Let a trusted person know where you are.",
      "Call 112 if you feel you are in danger.",
      "Privately note dates, times and places of each incident.",
    ],
  },
  {
    id: "verbal",
    icon: "megaphone",
    title: "Verbal harassment and threats",
    summary:
      "Abusive remarks, intimidation or threats made in person, by phone or by voice message.",
    examples: [
      "Abusive, sexual or demeaning comments in public or at work",
      "Threats to harm you, your family or your reputation",
      "Repeated intimidating calls",
    ],
    consider: [
      "Do not argue or respond. Move away to a safer place if you can.",
      "Write down what was said, when and where, and who was present.",
      "If a threat feels immediate, call 112.",
      "If it happens at work or college, you may also be able to approach the institution's internal channels.",
    ],
  },
  {
    id: "physical",
    icon: "hand",
    title: "Physical harassment",
    summary:
      "Unwanted physical contact or behaviour that physically threatens or harms you.",
    examples: [
      "Unwanted touching or grabbing",
      "Blocking your way or cornering you",
      "Pushing, hitting or any physical attack",
    ],
    consider: [
      "Get to a safe place first. Your safety comes before everything else.",
      "Call 112 if you are in danger or need urgent help.",
      "Seek medical attention if you are hurt. A medical record may later be useful.",
      "Reach out to a trusted person for support.",
    ],
  },
];

const REPORTING_STEPS = [
  {
    title: "Move to safety if there is immediate danger",
    text: "If you feel unsafe right now, go to a public, well-lit place and call 112. Reporting can wait; your safety cannot.",
  },
  {
    title: "Preserve relevant evidence safely",
    text: "Keep messages, screenshots and call records that already exist on your device. Never confront the person or take risks to collect more.",
  },
  {
    title: "Note dates, times and incident details privately",
    text: "Write down what happened, when, where, and who else was present, in a place only you can access.",
  },
  {
    title: "Identify an appropriate reporting channel",
    text: "Depending on the situation, this could be the police, a national helpline or portal listed below, a platform's reporting tool, or your workplace or college.",
  },
  {
    title: "Seek support from a trusted person",
    text: "A friend, family member, colleague or counsellor can support you, help you stay safe and accompany you if you choose to report.",
  },
  {
    title: "Follow up with the relevant authority when appropriate",
    text: "Keep any reference or acknowledgement you receive, and follow up with the authority you contacted when you feel ready.",
  },
];

const EVIDENCE_ITEMS = [
  {
    id: "screenshots",
    icon: "camera",
    title: "Screenshots",
    points: [
      "Capture the whole screen so that the username, date, time and conversation are visible.",
      "Keep unedited originals and store a backup somewhere only you can access.",
      "Take screenshots before you block or report, because content may disappear afterwards.",
    ],
  },
  {
    id: "messages",
    icon: "mail",
    title: "Messages and emails",
    points: [
      "Do not delete the messages or emails, even if they are upsetting.",
      "Keep them in the original app or inbox, and note the sender's number, username or address.",
      "Avoid replying to or engaging with the sender.",
    ],
  },
  {
    id: "calls",
    icon: "list",
    title: "Call logs",
    points: [
      "Take screenshots of your call history showing the numbers, dates and times.",
      "Note down the date and time of any calls or voice messages you received.",
      "Do not call the person back.",
    ],
  },
  {
    id: "photos",
    icon: "image",
    title: "Relevant photographs",
    points: [
      "Only photograph things that are already in front of you, such as damaged property or visible injuries, and only when it is safe.",
      "Never approach or follow anyone to take their photo.",
      "Keep the original files, which usually include the date and time.",
    ],
  },
  {
    id: "witnesses",
    icon: "users",
    title: "Witness details",
    points: [
      "Note the names of people who saw or heard what happened, if you already know them.",
      "Ask for contact details only if it feels safe and the person is willing.",
      "Note the place and time, which can help others recall what happened.",
    ],
  },
];

const SUPPORT_RESOURCES = [
  {
    id: "women-helpline",
    icon: "phone",
    name: "Women Helpline",
    number: "181",
    description:
      "A 24x7 helpline from the Ministry of Women and Child Development for women affected by violence or in distress. Provides emergency and non-emergency support.",
  },
  {
    id: "cyber",
    icon: "globe",
    name: "National Cyber Crime Reporting Helpline and Portal",
    number: "1930",
    description:
      "For cyber crimes, including online harassment. The national portal has a special focus on cyber crimes against women and children.",
    link: { href: "https://cybercrime.gov.in", label: "cybercrime.gov.in" },
  },
  {
    id: "ncw",
    icon: "shield",
    name: "National Commission for Women (NCW)",
    number: "14490",
    description:
      "NCW lists this as its 24x7 helpline for issues related to violence against women. Its official website has more information on its complaint channels.",
    link: { href: "https://www.ncw.gov.in", label: "ncw.gov.in" },
  },
];

const PRIVACY_POINTS = [
  {
    icon: "lock",
    title: "Never share passwords or OTPs",
    text: "No genuine helpline, authority or website needs your password or OTP to help you.",
  },
  {
    icon: "shield",
    title: "Be careful with personal information",
    text: "Share details such as your address, workplace or photos only with people and official channels you trust.",
  },
  {
    icon: "eye",
    title: "Use a safe device",
    text: "If you are worried that someone is monitoring your phone or accounts, consider using a device that only you control, or a trusted person's device.",
  },
  {
    icon: "alert",
    title: "This page does not file a complaint",
    text: "SAKHISAHAY does not submit a police complaint or report on your behalf. It only provides general information.",
  },
];

/* ---------- Reusable expandable section ---------- */

function Expandable({ id, icon, title, subtitle, children }) {
  const [open, setOpen] = useState(false);
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;

  return (
    <div className={`reporting-expandable ${open ? "is-open" : ""}`}>
      <h3 className="reporting-expandable-heading">
        <button
          type="button"
          id={buttonId}
          className="reporting-expandable-button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="reporting-icon-circle">
            <Icon name={icon} />
          </span>
          <span className="reporting-expandable-text">
            <span className="reporting-expandable-title">{title}</span>
            {subtitle && (
              <span className="reporting-expandable-subtitle">{subtitle}</span>
            )}
          </span>
          <span className="reporting-chevron">
            <Icon name="chevron" size={20} />
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="reporting-panel"
      >
        <div className="reporting-panel-inner">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

function Reporting() {
  return (
    <div className="reporting-page">
      {/* Header */}
      <header className="reporting-header">
        <div className="reporting-header-inner">
          <span className="reporting-brand">SAKHISAHAY</span>
          <Link to="/dashboard" className="reporting-back-link">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="reporting-main">
        {/* Introduction */}
        <section className="reporting-intro">
          <h1 className="reporting-heading">Harassment Reporting Assistance</h1>
          <p className="reporting-intro-text">
            This page helps you understand common types of harassment, general
            steps you can take, how to preserve evidence safely, and where to
            find support in India. It offers information only. Take things at
            your own pace, and put your safety first.
          </p>
        </section>

        <IncidentRecords />
        {/* Emergency card */}
        <section
          className="reporting-emergency"
          aria-labelledby="reporting-emergency-title"
        >
          <div className="reporting-emergency-icon">
            <Icon name="alert" size={30} />
          </div>
          <div className="reporting-emergency-body">
            <h2 id="reporting-emergency-title">
              In immediate danger? Call 112
            </h2>
            <p>
              If you are in immediate danger in India, call 112 right away. Do
              not wait for website assistance or finish reading this page.
            </p>
          </div>
          <a href="tel:112" className="reporting-emergency-call">
            <Icon name="phone" size={18} />
            Call 112
          </a>
        </section>

        {/* Types of harassment */}
        <section className="reporting-section" aria-labelledby="types-title">
          <h2 id="types-title" className="reporting-section-title">
            Types of Harassment
          </h2>
          <p className="reporting-section-intro">
            Harassment can take many forms. Select a card to learn more. If
            something makes you feel unsafe, your feelings are valid.
          </p>
          <div className="reporting-type-grid">
            {HARASSMENT_TYPES.map((type) => (
              <Expandable
                key={type.id}
                id={`type-${type.id}`}
                icon={type.icon}
                title={type.title}
                subtitle={type.summary}
              >
                <h4 className="reporting-subheading">Examples</h4>
                <ul className="reporting-list">
                  {type.examples.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <h4 className="reporting-subheading">What you can consider</h4>
                <ul className="reporting-list">
                  {type.consider.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Expandable>
            ))}
          </div>
        </section>

        {/* Reporting guide */}
        <section className="reporting-section" aria-labelledby="guide-title">
          <h2 id="guide-title" className="reporting-section-title">
            Reporting Guide
          </h2>
          <p className="reporting-section-intro">
            General guidance only. You do not have to follow every step, and you
            can move at your own pace.
          </p>
          <ol className="reporting-steps">
            {REPORTING_STEPS.map((step, index) => (
              <li key={step.title} className="reporting-step">
                <span className="reporting-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3 className="reporting-step-title">{step.title}</h3>
                  <p className="reporting-step-text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Evidence preservation */}
        <section className="reporting-section" aria-labelledby="evidence-title">
          <h2 id="evidence-title" className="reporting-section-title">
            Evidence Preservation
          </h2>
          <p className="reporting-safety-note">
            <strong>Your safety comes first.</strong> Never confront the person
            who is harassing you, and never put yourself at risk to collect
            evidence. It is fine if your evidence is incomplete. Keep only what
            you already have or can safely save.
          </p>
          <div className="reporting-evidence-list">
            {EVIDENCE_ITEMS.map((item) => (
              <Expandable
                key={item.id}
                id={`evidence-${item.id}`}
                icon={item.icon}
                title={item.title}
              >
                <ul className="reporting-list">
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </Expandable>
            ))}
          </div>
        </section>

        {/* Help and support */}
        <section className="reporting-section" aria-labelledby="support-title">
          <h2 id="support-title" className="reporting-section-title">
            Help and Support in India
          </h2>
          <p className="reporting-section-intro">
            These are national services. Availability and response can vary by
            state or region, so please confirm details with the service itself.
          </p>

          <div className="reporting-support-grid">
            <article className="reporting-support-card reporting-support-card-emergency">
              <span className="reporting-icon-circle">
                <Icon name="phone" />
              </span>
              <h3>Emergency Number</h3>
              <a href="tel:112" className="reporting-number">
                112
              </a>
              <p>
                India's single emergency number for police, fire, medical and
                other emergencies.
              </p>
            </article>

            {SUPPORT_RESOURCES.map((resource) => (
              <article key={resource.id} className="reporting-support-card">
                <span className="reporting-icon-circle">
                  <Icon name={resource.icon} />
                </span>
                <h3>{resource.name}</h3>
                <a href={`tel:${resource.number}`} className="reporting-number">
                  {resource.number}
                </a>
                <p>{resource.description}</p>
                {resource.link && (
                  <a
                    href={resource.link.href}
                    className="reporting-external-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {resource.link.label}
                    <Icon name="external" size={14} />
                    <span className="reporting-visually-hidden">
                      (opens in a new tab)
                    </span>
                  </a>
                )}
              </article>
            ))}
          </div>

          <p className="reporting-support-extra">
            You can also visit your nearest police station, or speak to a
            trusted friend, family member or counsellor for support.
          </p>
        </section>

        {/* Privacy and safety */}
        <section className="reporting-section" aria-labelledby="privacy-title">
          <h2 id="privacy-title" className="reporting-section-title">
            Privacy and Safety Notice
          </h2>
          <div className="reporting-privacy-grid">
            {PRIVACY_POINTS.map((point) => (
              <div key={point.title} className="reporting-privacy-item">
                <span className="reporting-icon-circle">
                  <Icon name={point.icon} />
                </span>
                <div>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="reporting-footer-note">
          This page provides general information only. It does not submit a
          complaint to the police or any other authority, and it is not legal
          advice.
        </p>
      </main>
    </div>
  );
}

export default Reporting;

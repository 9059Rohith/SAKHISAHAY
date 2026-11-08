import { AnimatedHeading } from "../components/Motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api, errorText } from "../lib/api";
import { Icon, Lotus } from "../components/Icons";

const tools = [
  {
    icon: "users",
    title: "Your safety circle",
    text: "Keep the people who care about you a little closer.",
    to: "/emergency-contacts",
    action: "Manage trusted contacts",
  },
  {
    icon: "pin",
    title: "Share your journey",
    text: "Let someone you trust follow along, on your terms.",
    to: "/location",
    action: "Open live location",
  },
  {
    icon: "sparkles",
    title: "A little guidance",
    text: "Find calm, practical safety guidance in English or Kannada.",
    to: "/chatbot",
    action: "Talk to your AI companion",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api
      .get("/contacts?page_size=3")
      .then((r) => {
        if (active) setContacts(r);
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <main className="modern-dashboard">
      <div className="dashboard-page-heading">
        <span className="portal-kicker">A SPACE THAT'S YOURS</span>
        <AnimatedHeading as="h1">Your safety space.</AnimatedHeading>
        <p>Hello, {user.full_name}.</p>
        <p className="dashboard-subtitle">
          A little preparation. A little connection. A world of reassurance.
        </p>
      </div>
      <div className="dashboard-intro-grid">
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-status">
              <Icon name="shield" size={15} /> You're in control
            </span>
            <h2>
              You’re here, and that’s
              <br />a meaningful step.
            </h2>
            <p>
              Keep your trusted people close and your safety tools ready. Take
              things at your own pace.
            </p>
            <Link to="/emergency-contacts" className="night-button">
              Review trusted contacts <Icon name="arrow" size={17} />
            </Link>
          </div>
          <Lotus size={130} />
        </section>
        <section className="dashboard-emergency">
          <span className="dashboard-danger-icon">
            <Icon name="siren" size={29} />
          </span>
          <h2>Need help right now?</h2>
          <p>Quickly reach emergency tools and the people you trust.</p>
          <Link to="/sos" className="night-button danger">
            <Icon name="siren" size={18} /> Open emergency tools
          </Link>
          <small>Calls and messages require your action.</small>
        </section>
      </div>
      <div className="dashboard-tools">
        {tools.map((tool) => (
          <Link to={tool.to} key={tool.to} className="dashboard-tool">
            <span className="dashboard-tool-icon">
              <Icon name={tool.icon} size={25} />
            </span>
            <h2>{tool.title}</h2>
            <p>{tool.text}</p>
            <span className="dashboard-tool-action">
              {tool.action}
              <Icon name="arrow" size={17} />
            </span>
          </Link>
        ))}
      </div>
      <div className="dashboard-bottom-grid">
        <section className="dashboard-contact-panel">
          <div className="dashboard-panel-heading">
            <h2>Trusted contacts</h2>
            {contacts && (
              <span>
                {contacts.total} {contacts.total === 1 ? "person" : "people"}
              </span>
            )}
            <Link to="/emergency-contacts">
              View all <Icon name="arrow" size={15} />
            </Link>
          </div>
          {error ? (
            <p className="feedback" role="alert">
              {error}
            </p>
          ) : contacts ? (
            contacts.items.length ? (
              <ul className="modern-contact-list">
                {contacts.items.map((contact) => (
                  <li key={contact.id}>
                    <span className="contact-initial">
                      {contact.name.charAt(0)}
                    </span>
                    <div>
                      <strong>{contact.name}</strong>
                      <small>{contact.relationship}</small>
                    </div>
                    <a href={`tel:+91${contact.phone}`}>+91 {contact.phone}</a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dashboard-empty">
                <Icon name="users" size={38} />
                <h3>Your circle starts with one person.</h3>
                <p>Add a friend, family member or someone you trust.</p>
                <Link
                  className="night-button secondary"
                  to="/emergency-contacts"
                >
                  Add Contact <Icon name="arrow" size={16} />
                </Link>
              </div>
            )
          ) : (
            <p className="dashboard-loading" role="status">
              Loading your safety circle…
            </p>
          )}
        </section>
        <aside className="dashboard-tip">
          <span className="dashboard-tip-icon">
            <Icon name="book" size={25} />
          </span>
          <h2>A moment to prepare</h2>
          <p>
            Before you head out, tell someone you trust where you’re going and
            when you expect to arrive. Keep your phone charged and your
            emergency numbers close.
          </p>
          <Link to="/safety-information">
            Explore safety resources <Icon name="arrow" size={16} />
          </Link>
        </aside>
      </div>
      <Link to="/reporting" className="dashboard-record-link">
        <span className="dashboard-tool-icon">
          <Icon name="shield" size={22} />
        </span>
        <div>
          <h2>Your story, your space.</h2>
          <p>
            Keep a private incident record, in your own words and at your own
            pace.
          </p>
        </div>
        <span>
          Open private records <Icon name="arrow" size={17} />
        </span>
      </Link>
    </main>
  );
}

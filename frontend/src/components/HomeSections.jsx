import { Link } from "react-router-dom";
import { Icon, Lotus } from "./Icons";
import { AnimatedHeading } from "./Motion";

function ScrollText({ children }) {
  const words = String(children).trim().split(/\s+/);
  return (
    <p
      className="story-lead scroll-reading"
      data-reveal
      style={{ "--tokens": words.length }}
      aria-label={String(children).trim()}
    >
      {words.map((word, i) => (
        <span
          className="reading-word"
          key={i}
          style={{ "--token": i }}
          aria-hidden="true"
        >
          {word}{" "}
        </span>
      ))}
    </p>
  );
}

function Scene({ id, image, className = "", children }) {
  return (
    <section
      id={id}
      className={`story-scene ${className}`}
      data-parallax
      aria-labelledby={`${id}-title`}
    >
      <img
        className="scene-background"
        src={`/images/${image}.webp`}
        alt=""
        aria-hidden="true"
        width="1672"
        height="941"
        loading="lazy"
        decoding="async"
      />
      <div className="scene-shade" />
      <div className="scene-inner">{children}</div>
      <span className="scene-edge" aria-hidden="true" />
    </section>
  );
}

function Marquee({ text, reverse = false }) {
  return (
    <div
      className={`story-marquee ${reverse ? "reverse" : ""}`}
      aria-hidden="true"
    >
      <div>
        {[0, 1, 2, 3].map((i) => (
          <span key={i}>
            {text}
            <Lotus size={32} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomeSections({ signedIn }) {
  return (
    <>
      <Scene id="your-circle" image="circle" className="circle-scene">
        <div className="story-copy">
          <p className="scene-number" data-reveal>
            01 / YOUR SAFETY CIRCLE
          </p>
          <div id="your-circle-title">
            <AnimatedHeading>Your people. Closer than ever.</AnimatedHeading>
          </div>
          <ScrollText>
            Some reassurance comes from knowing exactly who to call. Keep the
            people who care about you a little closer.
          </ScrollText>
          <ul className="story-points" data-reveal>
            <li>
              <Icon name="users" />
              <span>Save family, friends and the people you trust.</span>
            </li>
            <li>
              <Icon name="shield" />
              <span>Keep their details in your own private account.</span>
            </li>
            <li>
              <Icon name="bell" />
              <span>Open a call or message when you need support.</span>
            </li>
          </ul>
          <Link className="night-button" to="/emergency-contacts" data-reveal>
            Build your safety circle <Icon name="arrow" size={19} />
          </Link>
        </div>
        <div className="scene-caption" data-reveal>
          <Lotus size={40} />
          <p>
            Connection is a kind
            <br />
            <em>of courage.</em>
          </p>
        </div>
      </Scene>
      <Marquee text="YOUR JOURNEY. YOUR CHOICE. YOUR PEACE OF MIND." />
      <Scene id="your-journey" image="journey" className="journey-scene">
        <div className="story-copy right">
          <p className="scene-number" data-reveal>
            02 / A SHARED JOURNEY
          </p>
          <div id="your-journey-title">
            <AnimatedHeading>Go your way. Stay connected.</AnimatedHeading>
          </div>
          <ScrollText>
            A late train. A new route. The long way home. Share your journey
            with someone you trust, on your terms.
          </ScrollText>
          <div className="journey-steps" data-reveal>
            <div>
              <span>1</span>
              <p>
                Choose to share
                <small>Your browser asks for your permission.</small>
              </p>
            </div>
            <div>
              <span>2</span>
              <p>
                Send your private link
                <small>Only people with your link can view it.</small>
              </p>
            </div>
            <div>
              <span>3</span>
              <p>
                Stop whenever you’re ready
                <small>One tap revokes access. Links expire in an hour.</small>
              </p>
            </div>
          </div>
          <Link className="night-button" to="/location" data-reveal>
            Share your journey <Icon name="arrow" size={19} />
          </Link>
        </div>
      </Scene>
      <Scene
        id="a-little-guidance"
        image="companion"
        className="companion-scene"
      >
        <div className="story-copy">
          <p className="scene-number" data-reveal>
            03 / A LITTLE GUIDANCE
          </p>
          <div id="a-little-guidance-title">
            <AnimatedHeading>When you need words, we’re here.</AnimatedHeading>
          </div>
          <ScrollText>
            Ask the question on your mind. Find calm, practical safety guidance
            in English or Kannada, at your own pace.
          </ScrollText>
          <div className="question-links" data-reveal>
            <Link to="/chatbot?question=How%20can%20I%20stay%20safe%20while%20travelling%20alone%3F">
              <Icon name="sparkles" size={20} /> “I’m travelling alone. Any
              advice?” <Icon name="arrow" size={18} />
            </Link>
            <Link to="/chatbot?question=What%20should%20I%20do%20if%20someone%20is%20following%20me%3F">
              <Icon name="sparkles" size={20} /> “What if someone is following
              me?” <Icon name="arrow" size={18} />
            </Link>
          </div>
          <Link className="night-button" to="/chatbot" data-reveal>
            Meet your safety companion <Icon name="arrow" size={19} />
          </Link>
          <p className="story-disclosure" data-reveal>
            AI can make mistakes. In an emergency, call 112 rather than waiting
            for a response.
          </p>
        </div>
      </Scene>
      <Marquee text="A LITTLE PREPARATION. A WORLD OF REASSURANCE." reverse />
      <Scene id="feel-prepared" image="prepared" className="prepared-scene">
        <div className="prepared-heading">
          <p className="scene-number" data-reveal>
            04 / FEEL A LITTLE MORE PREPARED
          </p>
          <div id="feel-prepared-title">
            <AnimatedHeading>Small steps. A stronger you.</AnimatedHeading>
          </div>
          <ScrollText>
            Practical information for everyday life. A private place to write
            things down. Support you can find when you need it.
          </ScrollText>
        </div>
        <div className="resource-cards">
          <Link to="/safety-information" className="resource-card" data-reveal>
            <img
              src="/images/contacts.webp"
              loading="lazy"
              width="500"
              height="340"
              alt=""
            />
            <div>
              <Icon name="book" size={28} />
              <h3>Know your options</h3>
              <p>Everyday safety, official helplines and guidance.</p>
              <span>
                Explore resources <Icon name="arrow" size={18} />
              </span>
            </div>
          </Link>
          <Link to="/reporting" className="resource-card" data-reveal>
            <img
              src="/images/report.webp"
              loading="lazy"
              width="500"
              height="340"
              alt=""
            />
            <div>
              <Icon name="shield" size={28} />
              <h3>Your story, your space</h3>
              <p>Record an incident privately, in your own words.</p>
              <span>
                Open private records <Icon name="arrow" size={18} />
              </span>
            </div>
          </Link>
          <Link to="/sos" className="resource-card" data-reveal>
            <img
              src="/images/sos.webp"
              loading="lazy"
              width="500"
              height="340"
              alt=""
            />
            <div>
              <Icon name="siren" size={28} />
              <h3>Keep help close</h3>
              <p>Reach trusted people with call and message actions.</p>
              <span>
                Open emergency tools <Icon name="arrow" size={18} />
              </span>
            </div>
          </Link>
        </div>
      </Scene>
      <Scene id="safer-tomorrows" image="together" className="together-scene">
        <div className="finale-copy">
          <Lotus size={68} />
          <p className="scene-number" data-reveal>
            05 / TOGETHER, WE GO FURTHER
          </p>
          <div id="safer-tomorrows-title">
            <AnimatedHeading>Together for safer tomorrows.</AnimatedHeading>
          </div>
          <p className="story-lead" data-reveal>
            You deserve to move through the world with confidence.
            <br />
            Your personal safety space is here whenever you’re ready.
          </p>
          <Link
            className="night-button"
            to={signedIn ? "/dashboard" : "/register"}
            data-reveal
          >
            {signedIn
              ? "Return to your safety space"
              : "Create your safety space"}
            <Icon name="arrow" size={20} />
          </Link>
          <p className="story-disclosure" data-reveal>
            Made with care. Built around your choices.
          </p>
        </div>
        <footer className="story-footer">
          <Link className="night-brand" to="/">
            <Lotus size={35} />
            <span>SakhiSahay</span>
          </Link>
          <div>
            <Link to="/safety-information">Resources</Link>
            <Link to="/reporting">Reporting & support</Link>
            <Link to="/login">Your account</Link>
          </div>
          <p>© {new Date().getFullYear()} SakhiSahay</p>
          <p className="footer-emergency">
            In immediate danger in India, <a href="tel:112">call 112</a>. Calls
            and SMS require your action.
          </p>
        </footer>
      </Scene>
    </>
  );
}

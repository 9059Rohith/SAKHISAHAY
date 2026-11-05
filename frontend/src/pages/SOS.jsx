import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/SOS.css";

/* ---------- Inline SVG icons ---------- */

const svgBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

const ShieldIcon = ({ size = 24 }) => (
  <svg {...svgBase} width={size} height={size}>
    <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg {...svgBase} width="18" height="18" strokeWidth="2">
    <path d="M19 12H5" />
    <path d="M11 6l-6 6 6 6" />
  </svg>
);

const BellIcon = () => (
  <svg {...svgBase} width="24" height="24">
    <path d="M6 9a6 6 0 0112 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
    <path d="M10 20a2 2 0 004 0" />
  </svg>
);

const UsersIcon = () => (
  <svg {...svgBase} width="24" height="24">
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M16 4.7a3.5 3.5 0 010 6.6" />
    <path d="M18 14.3c2.3.6 3.5 2.5 3.5 5.7" />
  </svg>
);

const PinIcon = () => (
  <svg {...svgBase} width="24" height="24">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

const MessageIcon = () => (
  <svg {...svgBase} width="24" height="24">
    <path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H9l-5 4V6a1 1 0 011-1z" />
    <path d="M8 10h8" />
    <path d="M8 13h5" />
  </svg>
);

const InfoIcon = () => (
  <svg {...svgBase} width="22" height="22">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 7.5v.01" />
  </svg>
);

const CheckIcon = () => (
  <svg {...svgBase} width="26" height="26" strokeWidth="2.2">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.7 2.7L16 9.8" />
  </svg>
);

/* ---------- Data ---------- */

/*
  Registered emergency contacts will be loaded from the backend after
  integration. It is intentionally empty: no sample or fake contacts.
*/
const emergencyContacts = [];

const MESSAGE_PREVIEW =
  "I need help. Please contact me as soon as possible. My location: [location will be inserted here]";

const getLocationErrorMessage = (error) => {
  switch (error.code) {
    case 1:
      return "Location permission was denied. You can allow location access in your browser settings and try again.";
    case 2:
      return "Your location is currently unavailable. Please check your device's location settings and try again.";
    case 3:
      return "Getting your location took too long. Please try again.";
    default:
      return "Something went wrong while getting your location. Please try again.";
  }
};

/* ---------- Page ---------- */

function SOS() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [sosActivated, setSosActivated] = useState(false);

  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | success | error
  const [coordinates, setCoordinates] = useState(null);
  const [locationError, setLocationError] = useState("");

  const sosButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);

  /* Dialog keyboard handling: focus Cancel on open, close on Escape. */
  useEffect(() => {
    if (!showConfirm) return undefined;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowConfirm(false);
        sosButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showConfirm]);

  const openConfirm = () => setShowConfirm(true);

  const cancelConfirm = () => {
    setShowConfirm(false);
    sosButtonRef.current?.focus();
  };

  const confirmDemo = () => {
    setShowConfirm(false);
    setSosActivated(true);
  };

  const handleReset = () => {
    setSosActivated(false);
    setShowConfirm(false);
    setLocationStatus("idle");
    setCoordinates(null);
    setLocationError("");
  };

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      setLocationError("Your browser does not support the Geolocation API.");
      return;
    }

    setLocationStatus("loading");
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus("success");
      },
      (error) => {
        setCoordinates(null);
        setLocationError(getLocationErrorMessage(error));
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="sos-page">
      <header className="sos-header">
        <div className="sos-header-inner">
          <div className="sos-brand">
            <span className="sos-brand-mark">
              <ShieldIcon />
            </span>
            <span className="sos-brand-name">SAKHISAHAY</span>
          </div>
          <Link to="/dashboard" className="sos-back-link">
            <ArrowLeftIcon />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="sos-main">
        {/* Real emergency notice */}
        <div className="sos-notice" role="note">
          <span className="sos-notice-icon">
            <InfoIcon />
          </span>
          <p>
            <strong>Not connected to emergency services.</strong> This SOS
            feature is a demonstration only. If you are in immediate danger in
            India, <strong>call 112 directly</strong>.{" "}
            <a href="tel:112" className="sos-notice-link">
              Call 112
            </a>
          </p>
        </div>

        {/* Emergency SOS section */}
        <section className="sos-hero" aria-labelledby="sos-title">
          <h1 id="sos-title" className="sos-title">
            Emergency SOS Assistance
          </h1>
          <p className="sos-lead">
            The SOS feature is designed to help you quickly reach your trusted
            contacts when you feel unsafe. In this version it is a
            demonstration of how that flow will work.
          </p>

          <div className="sos-button-wrap">
            <button
              type="button"
              ref={sosButtonRef}
              className="sos-button"
              onClick={openConfirm}
              disabled={sosActivated}
              aria-haspopup="dialog"
              aria-label="SOS demonstration button. Opens a confirmation dialog."
            >
              <span className="sos-button-text">SOS</span>
              <span className="sos-button-sub">Demo</span>
            </button>
          </div>

          <p className="sos-demo-note">
            This is currently a demonstration and does not send real emergency
            alerts.
          </p>
        </section>

        {/* SOS status */}
        {sosActivated && (
          <section
            className="sos-status"
            role="status"
            aria-live="polite"
            aria-labelledby="sos-status-title"
          >
            <span className="sos-status-icon">
              <CheckIcon />
            </span>
            <div className="sos-status-body">
              <h2 id="sos-status-title" className="sos-status-title">
                SOS demonstration activated. No emergency alert was sent.
              </h2>
              <p>
                No contacts were notified and no location was shared. If you
                need urgent help in India, call 112 directly.
              </p>
            </div>
            <button
              type="button"
              className="sos-btn sos-btn-secondary"
              onClick={handleReset}
            >
              Reset
            </button>
          </section>
        )}

        <div className="sos-grid">
          {/* Emergency contacts */}
          <section className="sos-card" aria-labelledby="sos-contacts-title">
            <div className="sos-card-head">
              <span className="sos-card-icon">
                <UsersIcon />
              </span>
              <h2 id="sos-contacts-title" className="sos-card-title">
                Emergency Contacts
              </h2>
            </div>
            <p className="sos-card-text">
              After backend integration, your registered emergency contacts
              will be used for SOS alerts. Nobody is contacted in this
              demonstration.
            </p>

            {emergencyContacts.length === 0 ? (
              <div className="sos-empty">
                No emergency contacts are available yet.
              </div>
            ) : (
              <ul className="sos-contact-list">
                {emergencyContacts.map((contact) => (
                  <li key={contact.id} className="sos-contact">
                    <span className="sos-contact-name">{contact.name}</span>
                    {contact.relationship && (
                      <span className="sos-contact-meta">
                        {contact.relationship}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Location information */}
          <section className="sos-card" aria-labelledby="sos-location-title">
            <div className="sos-card-head">
              <span className="sos-card-icon">
                <PinIcon />
              </span>
              <h2 id="sos-location-title" className="sos-card-title">
                Location Information
              </h2>
            </div>
            <p className="sos-card-text">
              You can check your current location using your browser. Your
              location is only requested when you press the button, and it is
              not automatically shared with anyone.
            </p>

            <button
              type="button"
              className="sos-btn sos-btn-primary"
              onClick={requestLocation}
              disabled={locationStatus === "loading"}
            >
              {locationStatus === "loading"
                ? "Getting location..."
                : "Get My Current Location"}
            </button>

            <div className="sos-location-result" aria-live="polite">
              {locationStatus === "success" && coordinates && (
                <dl className="sos-coords">
                  <div className="sos-coords-row">
                    <dt>Latitude</dt>
                    <dd>{coordinates.latitude.toFixed(6)}</dd>
                  </div>
                  <div className="sos-coords-row">
                    <dt>Longitude</dt>
                    <dd>{coordinates.longitude.toFixed(6)}</dd>
                  </div>
                  {typeof coordinates.accuracy === "number" && (
                    <div className="sos-coords-row">
                      <dt>Accuracy</dt>
                      <dd>about {Math.round(coordinates.accuracy)} m</dd>
                    </div>
                  )}
                </dl>
              )}

              {locationStatus === "error" && (
                <p className="sos-error" role="alert">
                  {locationError}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Message preview */}
        <section className="sos-card sos-card-wide" aria-labelledby="sos-preview-title">
          <div className="sos-card-head">
            <span className="sos-card-icon">
              <MessageIcon />
            </span>
            <h2 id="sos-preview-title" className="sos-card-title">
              Emergency Message Preview
            </h2>
            <span className="sos-badge">Preview only</span>
          </div>
          <p className="sos-card-text">
            This is an example of the kind of message that may be used in the
            future. It is not sent by SMS, WhatsApp or email.
          </p>
          <blockquote className="sos-preview">{MESSAGE_PREVIEW}</blockquote>
        </section>

        <p className="sos-disclaimer">
          <strong>Disclaimer:</strong> SAKHISAHAY SOS is a demonstration and is
          not a substitute for emergency services. In immediate danger in
          India, call 112.
        </p>
      </main>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="sos-overlay" onClick={cancelConfirm}>
          <div
            className="sos-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sos-dialog-title"
            aria-describedby="sos-dialog-desc"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="sos-dialog-icon">
              <BellIcon />
            </span>
            <h2 id="sos-dialog-title" className="sos-dialog-title">
              Start SOS demonstration?
            </h2>
            <div id="sos-dialog-desc" className="sos-dialog-body">
              <p>
                If you confirm, this page will only show a demonstration
                status message. Nothing else will happen.
              </p>
              <ul className="sos-dialog-list">
                <li>No emergency alert will be sent.</li>
                <li>No contacts will be notified.</li>
                <li>Your location will not be shared.</li>
              </ul>
              <p>
                If you are in immediate danger in India, cancel and call{" "}
                <strong>112</strong> directly.
              </p>
            </div>
            <div className="sos-dialog-actions">
              <button
                type="button"
                ref={cancelButtonRef}
                className="sos-btn sos-btn-secondary"
                onClick={cancelConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sos-btn sos-btn-primary"
                onClick={confirmDemo}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SOS;

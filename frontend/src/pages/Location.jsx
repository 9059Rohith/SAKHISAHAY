import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Location.css";

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

/* ---------- Inline SVG icons ---------- */

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M12 2.5 4.5 5.4v5.7c0 4.6 3.1 8.7 7.5 10.4 4.4-1.7 7.5-5.8 7.5-10.4V5.4L12 2.5Z"
        fill="currentColor"
      />
      <path
        d="M12 15.6s-3.2-2-3.2-4.2a1.8 1.8 0 0 1 3.2-1.1 1.8 1.8 0 0 1 3.2 1.1c0 2.2-3.2 4.2-3.2 4.2Z"
        fill="#fff"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

function PinIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 21s7-5.6 7-11.2A7 7 0 0 0 5 9.8C5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="9.8" r="2.6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V6.5A1.5 1.5 0 0 1 6.5 5H15" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5V4.5a1.5 1.5 0 0 1 3 0V10m0-3a1.5 1.5 0 0 1 3 0v5.5A7 7 0 0 1 11 19.5c-2.6 0-3.9-1.3-5.3-3.4L4.4 14a1.4 1.4 0 0 1 2.2-1.7L9 14.5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
      <path d="M12 10v4.5M12 17.2h.01" />
    </svg>
  );
}

/* ---------- Helpers ---------- */

function getErrorMessage(error) {
  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return {
        title: "Location permission was denied",
        text: "Please allow location access for this site in your browser settings, then press the button again.",
      };
    case 2: // POSITION_UNAVAILABLE
      return {
        title: "Location is unavailable",
        text: "Your device could not work out where you are. Check that GPS or Wi-Fi is turned on, move to an open area and try again.",
      };
    case 3: // TIMEOUT
      return {
        title: "The request timed out",
        text: "Finding your location took too long. Check your connection and signal, then try again.",
      };
    default:
      return {
        title: "Something went wrong",
        text: "We could not detect your location. Please try again.",
      };
  }
}

/* ---------- Page component ---------- */

function Location() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [copyStatus, setCopyStatus] = useState("idle"); // idle | copied | failed

  // Reset the copy feedback message after a few seconds
  useEffect(() => {
    if (copyStatus === "idle") return undefined;
    const timer = setTimeout(() => setCopyStatus("idle"), 3000);
    return () => clearTimeout(timer);
  }, [copyStatus]);

  const handleDetectLocation = () => {
    setCopyStatus("idle");

    if (!("geolocation" in navigator)) {
      setCoords(null);
      setError({
        title: "Geolocation is not supported",
        text: "Your browser does not support location detection. Please try a modern browser such as Chrome, Firefox, Edge or Safari.",
      });
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setStatus("success");
      },
      (geoError) => {
        setCoords(null);
        setError(getErrorMessage(geoError));
        setStatus("error");
      },
      GEO_OPTIONS
    );
  };

  const coordinateText = coords
    ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
    : "";

  const mapUrl = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}#map=17/${coords.latitude}/${coords.longitude}`
    : "";

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard API not available");
      }
      await navigator.clipboard.writeText(coordinateText);
      setCopyStatus("copied");
    } catch (err) {
      setCopyStatus("failed");
    }
  };

  const isLoading = status === "loading";

  return (
    <div className="loc-page">
      <header className="loc-topbar">
        <div className="loc-brand">
          <span className="loc-brand-icon">
            <LogoIcon />
          </span>
          <span className="loc-brand-name">SAKHISAHAY</span>
        </div>

        <Link to="/dashboard" className="loc-back-link">
          <BackIcon />
          <span>Back to Dashboard</span>
        </Link>
      </header>

      <main className="loc-main">
        <section className="loc-hero">
          <h1 className="loc-title">Location Sharing</h1>
          <p className="loc-subtitle">
            In an emergency, knowing exactly where you are helps trusted people
            and responders reach you faster. Detect your current position here so
            you can see it clearly and share it when you need to.
          </p>
        </section>

        <div className="loc-layout">
          {/* ----- Detection card ----- */}
          <section className="loc-card loc-detect-card" aria-labelledby="loc-detect-heading">
            <div className="loc-detect-icon" aria-hidden="true">
              <PinIcon size={34} />
            </div>
            <h2 id="loc-detect-heading" className="loc-card-title">
              Find where you are
            </h2>
            <p className="loc-detect-text">
              Your location is accessed only after you press this button. Nothing
              is detected while you browse this page.
            </p>

            <button
              type="button"
              className="loc-btn loc-btn-primary loc-btn-large"
              onClick={handleDetectLocation}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loc-spinner" aria-hidden="true" />
                  <span>Detecting location…</span>
                </>
              ) : (
                <>
                  <PinIcon size={20} />
                  <span>{status === "success" ? "Detect Again" : "Detect My Location"}</span>
                </>
              )}
            </button>

            {/* Live region: announces progress and errors to screen readers */}
            <div className="loc-live" aria-live="polite">
              {isLoading && (
                <p className="loc-loading-text">
                  Waiting for your browser. If a permission prompt appears, choose
                  “Allow” to continue.
                </p>
              )}

              {status === "error" && error && (
                <div className="loc-alert" role="alert">
                  <span className="loc-alert-icon">
                    <AlertIcon />
                  </span>
                  <div>
                    <h3>{error.title}</h3>
                    <p>{error.text}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ----- Results card ----- */}
          <section className="loc-card loc-result-card" aria-labelledby="loc-result-heading">
            <h2 id="loc-result-heading" className="loc-card-title">
              Your coordinates
            </h2>

            {status === "success" && coords ? (
              <>
                <dl className="loc-coords">
                  <div className="loc-coord">
                    <dt>Latitude</dt>
                    <dd>{coords.latitude.toFixed(6)}</dd>
                  </div>
                  <div className="loc-coord">
                    <dt>Longitude</dt>
                    <dd>{coords.longitude.toFixed(6)}</dd>
                  </div>
                </dl>

                {typeof coords.accuracy === "number" && (
                  <p className="loc-accuracy">
                    Accurate to within about {Math.round(coords.accuracy)} metres.
                  </p>
                )}

                <div className="loc-result-actions">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="loc-btn loc-btn-outline"
                  >
                    <ExternalIcon />
                    <span>Open in OpenStreetMap</span>
                  </a>

                  <button type="button" className="loc-btn loc-btn-ghost" onClick={handleCopy}>
                    <CopyIcon />
                    <span>Copy Coordinates</span>
                  </button>
                </div>

                <div aria-live="polite">
                  {copyStatus === "copied" && (
                    <p className="loc-feedback loc-feedback-success">
                      Coordinates copied to your clipboard.
                    </p>
                  )}
                  {copyStatus === "failed" && (
                    <p className="loc-feedback loc-feedback-error">
                      Could not copy automatically. Please select and copy these
                      coordinates manually: <strong>{coordinateText}</strong>
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="loc-placeholder">
                <span className="loc-placeholder-icon" aria-hidden="true">
                  <PinIcon size={30} />
                </span>
                <p>
                  {isLoading
                    ? "Looking for your position…"
                    : "Your latitude and longitude will appear here after you detect your location."}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ----- Information cards ----- */}
        <div className="loc-info-grid">
          <article className="loc-info-card">
            <span className="loc-info-icon">
              <HandIcon />
            </span>
            <div>
              <h2>You are in control</h2>
              <p>
                Location is requested only when you press “Detect My Location”.
                Your browser will ask for your permission, and you can say no at
                any time.
              </p>
            </div>
          </article>

          <article className="loc-info-card">
            <span className="loc-info-icon">
              <LockIcon />
            </span>
            <div>
              <h2>Privacy notice</h2>
              <p>
                Your location is not automatically sent to anyone yet. It stays on
                this page and is not stored. Sharing with emergency contacts will
                be added in a later update, and only with your action.
              </p>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}

export default Location;

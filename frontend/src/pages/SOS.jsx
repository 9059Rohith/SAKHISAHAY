import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageShell, { Feedback, Pagination } from "../components/PageShell";
import { Icon } from "../components/Icons";
import { api, errorText } from "../lib/api";

function ConfirmSOS({ onCancel, onConfirm, busy }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="night-dialog"
      aria-labelledby="sos-confirm-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onCancel();
      }}
    >
      <h2 id="sos-confirm-title">Create an SOS alert?</h2>
      <p>
        This saves an alert and gives you call, SMS and share buttons for your
        trusted contacts. Confirm sending in your phone’s messaging app.
      </p>
      <p style={{ marginTop: 15 }}>
        Emergency services are not automatically notified. In immediate danger,{" "}
        <a className="inline-link" href="tel:112">
          call 112 now
        </a>
        .
      </p>
      <div className="action-row" style={{ marginTop: 25 }}>
        <button
          disabled={busy}
          className="night-button secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button disabled={busy} className="night-button" onClick={onConfirm}>
          {busy ? "Saving alert…" : "Create alert"}
        </button>
      </div>
    </dialog>
  );
}

export default function SOS() {
  const [confirm, setConfirm] = useState(false),
    [includeLocation, setIncludeLocation] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [alert, setAlert] = useState(null),
    [contacts, setContacts] = useState([]);
  const [history, setHistory] = useState({ items: [], pages: 0 }),
    [page, setPage] = useState(1);
  const key = useRef(crypto.randomUUID());
  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/contacts?page_size=100"),
      api.get(`/alerts?page=${page}&page_size=10`),
    ])
      .then(([c, a]) => {
        if (active) {
          setContacts(c.items);
          setHistory(a);
        }
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      });
    return () => {
      active = false;
    };
  }, [page]);
  const create = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    let coordinates = null;
    if (includeLocation && navigator.geolocation)
      coordinates = await new Promise((resolve) =>
        navigator.geolocation.getCurrentPosition(
          (p) =>
            resolve({
              latitude: p.coords.latitude,
              longitude: p.coords.longitude,
              accuracy: p.coords.accuracy,
            }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 15000 },
        ),
      );
    try {
      const r = await api.post("/alerts", {
        message:
          "I need help. Please contact me or come to my location if it is safe.",
        coordinates,
        idempotency_key: key.current,
      });
      setAlert(r);
      setContacts(r.contacts);
      setConfirm(false);
      setHistory(await api.get(`/alerts?page=${page}&page_size=10`));
      setMessage(
        `SOS alert saved. Use a contact button below to call or send your message.${includeLocation && !coordinates ? " Location was unavailable and has not been included." : ""}`,
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const resolve = async (id) => {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/alerts/${id}/resolve`);
      if (alert?.id === id) {
        setAlert(null);
        key.current = crypto.randomUUID();
      }
      setHistory(await api.get(`/alerts?page=${page}&page_size=10`));
      setMessage("Alert marked resolved.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const alertText = alert
    ? `${alert.message}${alert.coordinates ? ` My location: https://www.openstreetmap.org/?mlat=${alert.coordinates.latitude}&mlon=${alert.coordinates.longitude}#map=17/${alert.coordinates.latitude}/${alert.coordinates.longitude}` : ""}`
    : "I need help. Please call me as soon as possible.";
  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({ title: "SakhiSahay SOS", text: alertText });
      else {
        await navigator.clipboard.writeText(alertText);
        setMessage("Alert message copied. Send it to someone you trust.");
      }
    } catch (e) {
      if (e.name !== "AbortError")
        setError(
          "Sharing could not open. Copy the displayed message manually.",
        );
    }
  };
  return (
    <PageShell
      title="Here when you need it"
      lead="Take a breath. Reach someone you trust, or call emergency services directly."
    >
      <div className="emergency-callout">
        <Icon name="siren" size={29} />
        <div>
          <strong>In immediate danger?</strong>
          <p>Call India’s emergency number. Do not wait for this app.</p>
        </div>
        <a href="tel:112" className="night-button">
          Call 112
        </a>
      </div>
      <Feedback error={error} message={message} />
      <div className="two-columns">
        <section className="glass-panel sos-control">
          <h2>Emergency SOS</h2>
          <button
            className="real-sos-button"
            aria-label="Create SOS alert"
            disabled={busy || Boolean(alert)}
            onClick={() => setConfirm(true)}
          >
            <Icon name="siren" size={48} />
            <span>SOS</span>
          </button>
          <label className="recovery-confirm">
            <input
              type="checkbox"
              checked={includeLocation}
              onChange={(e) => setIncludeLocation(e.target.checked)}
            />{" "}
            Include my current location if available
          </label>
          <p className="small-note">
            An SOS is a saved personal alert. Calls and SMS open on your device
            and require your action. No automatic police dispatch or SMS
            delivery is claimed.
          </p>
          {alert && (
            <div style={{ marginTop: 20 }}>
              <h3>Alert ready to share</h3>
              <p>{alertText}</p>
              <div className="action-row" style={{ marginTop: 18 }}>
                <button className="night-button" onClick={share}>
                  Share alert message
                </button>
                <button
                  className="night-button secondary"
                  disabled={busy}
                  onClick={() => resolve(alert.id)}
                >
                  Mark resolved
                </button>
              </div>
            </div>
          )}
        </section>
        <section className="glass-panel">
          <h2>Your safety circle</h2>
          {contacts.length ? (
            contacts.map((c) => (
              <div className="record-item" key={c.id}>
                <h3>{c.name}</h3>
                <p className="small-note">
                  {c.relationship} · +91 {c.phone}
                </p>
                <div className="action-row">
                  <a
                    className="night-button secondary"
                    href={`tel:+91${c.phone}`}
                  >
                    Call {c.name}
                  </a>
                  <a
                    className="night-button"
                    href={`sms:+91${c.phone}?body=${encodeURIComponent(alertText)}`}
                  >
                    Open SMS
                  </a>
                </div>
              </div>
            ))
          ) : (
            <>
              <p>Add the people you trust so they are easy to reach.</p>
              <Link
                to="/emergency-contacts"
                className="night-button"
                style={{ marginTop: 18 }}
              >
                Add trusted contacts
              </Link>
            </>
          )}
          <Link to="/location" className="inline-link">
            Share a live location link →
          </Link>
        </section>
      </div>
      <section className="glass-panel">
        <h2>Your SOS history</h2>
        {history.items.length ? (
          history.items.map((a) => (
            <article className="record-item" key={a.id}>
              <p>
                <strong>
                  {a.status === "active" ? "Active alert" : "Resolved alert"}
                </strong>{" "}
                · {new Date(a.created_at).toLocaleString()}
              </p>
              <p className="small-note">{a.message}</p>
              {a.status === "active" && (
                <button
                  className="night-button secondary"
                  disabled={busy}
                  onClick={() => resolve(a.id)}
                >
                  Mark resolved
                </button>
              )}
            </article>
          ))
        ) : (
          <p>No alerts yet. Saved alerts will appear here.</p>
        )}
        <Pagination page={page} pages={history.pages} setPage={setPage} />
      </section>
      {confirm && (
        <ConfirmSOS
          busy={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={create}
        />
      )}
    </PageShell>
  );
}

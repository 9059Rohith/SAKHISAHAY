import { useEffect, useRef, useState } from "react";
import PageShell, { Feedback } from "../components/PageShell";
import { Icon } from "../components/Icons";
import { api, errorText } from "../lib/api";
import LocationMap from "../components/LocationMap";

const coordsOf = (p) => ({
  latitude: p.coords.latitude,
  longitude: p.coords.longitude,
  accuracy: p.coords.accuracy,
});
const geoError = (e) =>
  e.code === 1
    ? "Location permission was denied. Enable it in your browser settings to share your position."
    : e.code === 3
      ? "Location detection timed out. Please try again with a stronger signal."
      : "Your location could not be detected. Check your device location settings.";

export default function Location() {
  const [coords, setCoords] = useState(null),
    [share, setShare] = useState(null),
    [existing, setExisting] = useState([]);
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [lastUpdate, setLastUpdate] = useState(null);
  const watch = useRef(null),
    current = useRef(null),
    sent = useRef(0),
    updating = useRef(false),
    expiry = useRef(null);
  const mounted = useRef(false),
    generation = useRef(0);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    api
      .get("/location-shares?page_size=100")
      .then((r) => {
        if (active)
          setExisting(
            r.items.filter(
              (s) => !s.revoked && new Date(s.expires_at) > new Date(),
            ),
          );
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      });
    return () => {
      active = false;
      mounted.current = false;
      generation.current += 1;
      if (watch.current !== null)
        navigator.geolocation?.clearWatch(watch.current);
      clearTimeout(expiry.current);
    };
  }, []);
  const detect = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation)
        return reject(
          new Error("Your browser does not support location detection."),
        );
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const c = coordsOf(p);
          if (mounted.current) setCoords(c);
          resolve(c);
        },
        (e) => reject(new Error(geoError(e))),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 },
      );
    });
  const stopWatcher = () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    clearTimeout(expiry.current);
    current.current = null;
    setShare(null);
  };
  const start = async () => {
    if (busy || share) return;
    setBusy(true);
    setError("");
    setMessage("");
    const startedGeneration = generation.current;
    try {
      const c = await detect();
      if (!mounted.current || generation.current !== startedGeneration) return;
      const r = await api.post("/location-shares", c);
      if (!mounted.current || generation.current !== startedGeneration) {
        await api.delete(`/location-shares/${r.id}`);
        return;
      }
      current.current = r;
      setShare(r);
      setLastUpdate(r.updated_at);
      sent.current = Date.now();
      watch.current = navigator.geolocation.watchPosition(
        async (p) => {
          if (!mounted.current) return;
          const c = coordsOf(p);
          setCoords(c);
          if (
            !current.current ||
            updating.current ||
            Date.now() - sent.current < 10000
          )
            return;
          updating.current = true;
          try {
            const next = await api.patch(
              `/location-shares/${current.current.id}`,
              c,
            );
            if (mounted.current) setLastUpdate(next.updated_at);
            sent.current = Date.now();
          } catch (e) {
            if (mounted.current) setError(errorText(e));
          } finally {
            updating.current = false;
          }
        },
        (e) => {
          if (mounted.current) setError(geoError(e));
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );
      expiry.current = setTimeout(
        () => {
          stopWatcher();
          setMessage(
            "The link expired after one hour. Start a new share if needed.",
          );
        },
        Math.max(0, new Date(r.expires_at).getTime() - Date.now()),
      );
      setMessage(
        "Live sharing is active. Send the private link to someone you trust.",
      );
    } catch (e) {
      if (mounted.current) setError(errorText(e));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const stop = async (id) => {
    setBusy(true);
    setError("");
    try {
      await api.delete(`/location-shares/${id}`);
      if (current.current?.id === id) stopWatcher();
      setExisting((rows) => rows.filter((s) => s.id !== id));
      setMessage("Sharing stopped. This link no longer reveals your location.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const link = share ? `${window.location.origin}/share/${share.token}` : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Private link copied.");
    } catch {
      setMessage("Select and copy the private link displayed below.");
    }
  };
  const nativeShare = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: "My SakhiSahay location",
          text: "Follow my journey using this private, expiring link.",
          url: link,
        });
      else await copy();
    } catch (e) {
      if (e.name !== "AbortError")
        setError("Sharing could not open. Copy the link instead.");
    }
  };
  return (
    <PageShell
      title="Share your journey"
      lead="Let someone you trust know where you are. You choose when sharing starts and stops."
    >
      <Feedback error={error} message={message} />
      <div className="two-columns">
        <section className="glass-panel">
          <div className="demo-orbit">
            <Icon name="pin" size={54} />
          </div>
          <h2>
            {share ? "Live sharing is active" : "Your location, your choice"}
          </h2>
          <p>
            Location is requested only after you press a button and grant
            browser permission.
          </p>
          <div className="action-row" style={{ marginTop: 24 }}>
            {share ? (
              <button
                className="night-button danger"
                disabled={busy}
                onClick={() => stop(share.id)}
              >
                Stop sharing
              </button>
            ) : (
              <>
                <button
                  className="night-button"
                  disabled={busy}
                  onClick={start}
                >
                  {busy ? "Detecting location…" : "Start live sharing"}
                </button>
                <button
                  className="night-button secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await detect();
                      setMessage(
                        "Location detected. Start sharing when ready.",
                      );
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Detect My Location
                </button>
              </>
            )}
          </div>
          <p className="small-note" style={{ marginTop: 20 }}>
            Keep this tab open for updates. Updates are sent at most once every
            10 seconds when the browser reports a position. Links expire after
            one hour. Closing this tab stops new updates; Stop sharing revokes
            the link immediately.
          </p>
        </section>
        <section className="glass-panel">
          <h2>{share ? "Your private share link" : "Your coordinates"}</h2>
          {coords ? (
            <>
              <LocationMap
                latitude={coords.latitude}
                longitude={coords.longitude}
                accuracy={coords.accuracy}
              />
              <a
                className="share-map"
                href={`https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}#map=17/${coords.latitude}/${coords.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="pin" size={42} />
                <span className="share-value">
                  {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                </span>
                <p>Open in OpenStreetMap ↗</p>
              </a>
              <p className="small-note">
                Accuracy: about {Math.round(coords.accuracy)} metres
              </p>
            </>
          ) : (
            <p style={{ margin: "30px 0" }}>
              Your position appears here after you allow location access.
            </p>
          )}
          {share && (
            <>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="share-link"
              >
                {link}
              </a>
              <div className="action-row">
                <button className="night-button" onClick={nativeShare}>
                  Share private link
                </button>
                <button className="night-button secondary" onClick={copy}>
                  Copy link
                </button>
              </div>
              <p className="small-note" style={{ marginTop: 18 }}>
                Last saved:{" "}
                {lastUpdate && new Date(lastUpdate).toLocaleTimeString()}.
                Expires {new Date(share.expires_at).toLocaleTimeString()}.
              </p>
            </>
          )}
        </section>
      </div>
      {existing.length > 0 && (
        <section className="glass-panel">
          <h2>Previously created active links</h2>
          <p className="small-note">
            Secret URLs are not stored and cannot be redisplayed. Revoke
            previous links here.
          </p>
          {existing.map((s) => (
            <div key={s.id} className="record-item">
              <p>
                Created {new Date(s.created_at).toLocaleString()} · Expires{" "}
                {new Date(s.expires_at).toLocaleTimeString()}
              </p>
              <button
                className="night-button secondary"
                disabled={busy}
                onClick={() => stop(s.id)}
              >
                Revoke link
              </button>
            </div>
          ))}
        </section>
      )}
    </PageShell>
  );
}

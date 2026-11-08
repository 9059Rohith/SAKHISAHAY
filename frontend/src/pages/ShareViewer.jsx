import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageShell, { Feedback } from "../components/PageShell";
import { Icon } from "../components/Icons";
import { api, errorText } from "../lib/api";
import LocationMap from "../components/LocationMap";

export default function ShareViewer() {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await api.get(
          `/location-shares/public/${encodeURIComponent(token)}`,
        );
        if (active) {
          setShare(r);
          setError("");
        }
      } catch (e) {
        if (active) {
          setError(errorText(e));
          setShare(null);
        }
      }
    };
    load();
    const timer = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [token]);
  return (
    <PageShell
      title="A shared journey"
      lead="A trusted person shared this private, expiring link with you. Keep it to yourself."
    >
      <section className="glass-panel">
        <Feedback error={error} />
        {share ? (
          <>
            <LocationMap
              latitude={share.latitude}
              longitude={share.longitude}
              accuracy={share.accuracy}
            />
            <a
              className="share-map"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.openstreetmap.org/?mlat=${share.latitude}&mlon=${share.longitude}#map=16/${share.latitude}/${share.longitude}`}
            >
              <Icon name="pin" size={60} />
              <span className="share-value">
                {share.latitude.toFixed(6)}, {share.longitude.toFixed(6)}
              </span>
              <p>Open location in OpenStreetMap ↗</p>
            </a>
            <p>Last update: {new Date(share.updated_at).toLocaleString()}</p>
            <p>
              Accuracy:{" "}
              {share.accuracy == null
                ? "Not provided"
                : `about ${Math.round(share.accuracy)} metres`}
            </p>
            <p className="small-note">
              Link expires {new Date(share.expires_at).toLocaleString()}. This
              page refreshes every 10 seconds. An old timestamp means the sender
              may have closed their tab or lost connectivity.
            </p>
          </>
        ) : (
          !error && <p role="status">Loading shared location…</p>
        )}
      </section>
    </PageShell>
  );
}

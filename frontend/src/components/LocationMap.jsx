import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export default function LocationMap({ latitude, longitude, accuracy = null }) {
  const container = useRef(null),
    map = useRef(null),
    marker = useRef(null),
    radius = useRef(null),
    following = useRef(true);
  const position = useRef({ latitude, longitude, accuracy });
  position.current = { latitude, longitude, accuracy };
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true,
      observer;
    import("leaflet")
      .then((module) => {
        if (!active || !container.current) return;
        const L = module.default || module;
        const p = position.current;
        const instance = L.map(container.current, {
          scrollWheelZoom: false,
          zoomControl: true,
        }).setView([p.latitude, p.longitude], 15);
        map.current = instance;
        const tiles = L.tileLayer(
          import.meta.env.VITE_OSM_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
            referrerPolicy: "origin",
          },
        );
        tiles.on("tileerror", () => {
          if (active) setUnavailable(true);
        });
        tiles.on("tileload", () => {
          if (active) setUnavailable(false);
        });
        tiles.addTo(instance);
        radius.current = L.circle([p.latitude, p.longitude], {
          radius: Math.min(p.accuracy || 0, 100000),
          color: "#806197",
          weight: 1,
          opacity: 0.45,
          fillColor: "#bfa8d1",
          fillOpacity: 0.15,
        }).addTo(instance);
        marker.current = L.circleMarker([p.latitude, p.longitude], {
          radius: 9,
          color: "#fff",
          weight: 3,
          fillColor: "#79528c",
          fillOpacity: 1,
        })
          .addTo(instance)
          .bindTooltip("Shared position", { direction: "top" });
        instance.on("dragstart", () => {
          following.current = false;
        });
        if (typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(() => instance.invalidateSize());
          observer.observe(container.current);
        }
        instance.invalidateSize();
      })
      .catch(() => {
        if (active) setUnavailable(true);
      });
    return () => {
      active = false;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
      radius.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current || !marker.current) return;
    const point = [latitude, longitude];
    marker.current.setLatLng(point);
    radius.current.setLatLng(point).setRadius(Math.min(accuracy || 0, 100000));
    if (following.current) map.current.panTo(point, { animate: false });
  }, [latitude, longitude, accuracy]);
  return (
    <section
      className="location-map-shell"
      aria-label="Interactive OpenStreetMap"
    >
      <div className="location-map-canvas" ref={container} />
      <div className="location-map-toolbar">
        <span>
          <i /> Your position
        </span>
        <button
          type="button"
          onClick={() => {
            following.current = true;
            const p = position.current;
            map.current?.setView([p.latitude, p.longitude], 15);
          }}
        >
          Recenter map
        </button>
      </div>
      {unavailable && (
        <p className="map-load-notice" role="status">
          Map tiles could not load. Your coordinates and map link remain
          available below.
        </p>
      )}
      <p className="map-privacy-note">
        Drag to explore the map. Select Recenter to follow your position again.
      </p>
    </section>
  );
}

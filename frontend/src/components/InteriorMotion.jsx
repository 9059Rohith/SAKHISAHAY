import { useEffect } from "react";

const scenes = {
  "/dashboard": ["dashboard", "A little courage. A world of possibility."],
  "/emergency-contacts": ["contacts", "Your people. Always a little closer."],
  "/location": ["location", "Every journey deserves peace of mind."],
  "/chatbot": ["chat", "A little guidance, whenever you need it."],
  "/reporting": ["report", "Your voice matters. Your story is yours."],
  "/safety-information": [
    "prepared",
    "Feel informed. Feel a little more prepared.",
  ],
  "/sos": ["sos", "Your next step is within reach."],
  "/profile": ["account", "Your space. Your choices. Your pace."],
  "/admin": ["together", "Care starts with a stronger community."],
};

function sceneFor(pathname) {
  return pathname.startsWith("/share/")
    ? ["journey", "Connection, on your terms."]
    : scenes[pathname] || ["account", "Together for safer tomorrows."];
}

// Only decorative layers move. Inputs, buttons and map controls remain stationary.
export function useInteriorMotion(root, pathname) {
  useEffect(() => {
    const node = root.current;
    if (!node || pathname === "/") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: fine)");
    let frame = 0,
      px = 0,
      py = 0;
    const update = () => {
      frame = 0;
      const disabled = reduced.matches;
      const banner = node.querySelector(".interior-banner");
      const rect = banner?.getBoundingClientRect();
      node.style.setProperty(
        "--interior-scene-y",
        `${disabled ? 0 : Math.min(220, window.scrollY * 0.3)}px`,
      );
      node.style.setProperty(
        "--interior-banner-y",
        `${disabled || !rect ? 0 : Math.max(-100, Math.min(100, (innerHeight * 0.45 - rect.top - rect.height / 2) * 0.45))}px`,
      );
      node.style.setProperty("--interior-px", `${disabled ? 0 : px}px`);
      node.style.setProperty("--interior-py", `${disabled ? 0 : py}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const move = (event) => {
      if (!pointer.matches || reduced.matches) return;
      px = (event.clientX / innerWidth - 0.5) * 34;
      py = (event.clientY / innerHeight - 0.5) * 24;
      schedule();
    };
    const reset = () => {
      px = 0;
      py = 0;
      schedule();
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    node.addEventListener("pointermove", move, { passive: true });
    node.addEventListener("pointerleave", reset);
    reduced.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", reset);
      reduced.removeEventListener("change", schedule);
    };
  }, [root, pathname]);
}

export function InteriorBackdrop({ pathname }) {
  const [scene] = sceneFor(pathname);
  return (
    <div className="interior-scenery" aria-hidden="true">
      <img
        key={scene}
        className="interior-scene-image"
        src={`/images/${scene}.webp`}
        alt=""
        decoding="async"
      />
      <div className="interior-scene-wash" />
      <div className="interior-petals">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} style={{ "--petal": i }} />
        ))}
      </div>
    </div>
  );
}

export function InteriorBanner({ pathname }) {
  const [scene, title] = sceneFor(pathname);
  return (
    <section
      className={`interior-banner ${pathname === "/sos" ? "interior-banner-compact" : ""}`}
      aria-label="Together for safer tomorrows"
    >
      <img
        key={scene}
        className="interior-banner-image"
        src={`/images/${scene}.webp`}
        alt=""
        decoding="async"
      />
      <div className="interior-banner-shade" />
      <div className="interior-banner-copy">
        <span className="interior-banner-eyebrow">
          SAKHISAHAY · YOUR PERSONAL SAFETY COMPANION
        </span>
        <p className="interior-banner-title" aria-label={title}>
          {title.split(" ").map((word, i) => (
            <span
              className="interior-motion-word"
              key={i}
              aria-hidden="true"
              style={{ "--word": i }}
            >
              {word}
              <span className="interior-word-space"> </span>
            </span>
          ))}
        </p>
      </div>
      <div className="interior-ticker" aria-hidden="true">
        <div>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i}>
              YOUR CHOICES <i>✦</i> YOUR PACE <i>✦</i> YOUR SAFETY <i>✦</i>{" "}
              TOGETHER FOR SAFER TOMORROWS <i>✦</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

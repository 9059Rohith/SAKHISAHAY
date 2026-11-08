import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function AnimatedHeading({ children, as: Tag = "h2", className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      ref.current?.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          ref.current.classList.add("is-visible");
        } else {
          ref.current.classList.remove("is-visible");
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const words = String(children).split(" ");
  return (
    <Tag
      ref={ref}
      className={`animated-heading ${className}`}
      data-reveal
      aria-label={children}
    >
      {words.map((word, i) => (
        <span className="word-mask" key={i} aria-hidden="true">
          <span className="reveal-word" style={{ "--word": i }}>
            {word}&nbsp;
          </span>
        </span>
      ))}
    </Tag>
  );
}

export function useScrollMotion(root) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reveal = [
      ...element.querySelectorAll("[data-reveal]:not(.animated-heading)"),
    ];
    const sections = [...element.querySelectorAll("[data-parallax]")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      const vh = window.innerHeight;
      element.style.setProperty(
        "--scroll-progress",
        `${Math.min(1, window.scrollY / Math.max(1, element.scrollHeight - vh))}`,
      );
      element.dataset.scrolled = window.scrollY > vh * 0.7 ? "true" : "false";
      if (!reduced.matches)
        sections.forEach((section) => {
          const r = section.getBoundingClientRect();
          if (r.bottom > -100 && r.top < vh + 100) {
            section.style.setProperty(
              "--scene-y",
              `${Math.max(-240, Math.min(240, (vh / 2 - r.top - r.height / 2) * 0.55))}px`,
            );
            section.style.setProperty(
              "--copy-y",
              `${Math.max(-52, Math.min(52, (r.top + r.height / 2 - vh / 2) * 0.13))}px`,
            );
            section.style.setProperty(
              "--scene-scale",
              `${1.04 + Math.min(0.09, Math.abs(r.top) / (vh * 12))}`,
            );
            section.style.setProperty(
              "--reading-progress",
              `${Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (vh * 0.9 + r.height * 0.3)))}`,
            );
          }
        });
      frame = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) =>
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("is-visible");
                } else {
                  entry.target.classList.remove("is-visible");
                }
              }),
            { threshold: 0.12 },
          )
        : null;
    reveal.forEach((e) =>
      observer ? observer.observe(e) : e.classList.add("is-visible"),
    );
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [root]);
}

const images = {
  "/dashboard": "dashboard",
  "/emergency-contacts": "contacts",
  "/location": "location",
  "/chatbot": "chat",
  "/reporting": "report",
  "/sos": "sos",
  "/safety-information": "prepared",
};

export function RouteAtmosphere() {
  const { pathname } = useLocation();
  const ref = useRef(null);
  const image = pathname.startsWith("/share/")
    ? "location"
    : images[pathname] || "account";
  useEffect(() => {
    if (pathname === "/") return;
    const element = ref.current;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let frame = 0;
    const update = () => {
      if (element && !reduced)
        element.style.setProperty(
          "--route-y",
          `${Math.min(200, window.scrollY * 0.25)}px`,
        );
      frame = 0;
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
    };
  }, [pathname]);
  if (pathname === "/") return null;
  return (
    <div
      className="route-atmosphere"
      ref={ref}
      aria-hidden="true"
      key={image}
      style={{ "--route-art": `url('/images/${image}.webp')` }}
    >
      <div />
    </div>
  );
}

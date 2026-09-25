import { useEffect, useRef, useState } from "react";
import "./App.css";
import content from "./content.json";

const { site, hero, stats, experienceIntro, experience, skillsIntro, skills, about, contact, footerName } =
  content;
const asset = (file) => `${import.meta.env.BASE_URL}${file}`;

/**
 * Eye openings on the illustrated avatar, as % of the image box.
 * cx/cy = iris center at rest; w/h = eye opening size; tilt = almond angle.
 */
const EYES = [
  { id: "L", cx: 43.1, cy: 30.7, w: 9.9, h: 4.4, tilt: -4 },
  { id: "R", cx: 61.3, cy: 30.0, w: 10.2, h: 4.3, tilt: 3 },
];
const IRIS_W = 4.7; // % of image width

function AvatarEyes() {
  const eyeRefs = useRef([]);
  const [look, setLook] = useState({ x: 0, y: 0 }); // -1..1, head parallax
  const [iris, setIris] = useState(EYES.map(() => ({ x: 0, y: 0 })));

  useEffect(() => {
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const next = EYES.map((_, i) => {
          const el = eyeRefs.current[i];
          if (!el) return { x: 0, y: 0 };
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          // normalized direction to cursor from THIS eye, full-screen range
          const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (vw * 0.45)));
          const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (vh * 0.45)));
          // iris may travel until it touches the eye edge
          const irisPx = (IRIS_W / 100) * (r.width / (EYES[i].w / 100));
          const maxX = Math.max(0, (r.width - irisPx) / 2) * 0.95;
          const maxY = Math.max(0, (r.height - irisPx * 0.55) / 2) * 0.9;
          return { x: nx * maxX, y: ny * maxY };
        });
        setIris(next);
        setLook({
          x: Math.max(-1, Math.min(1, (e.clientX / vw) * 2 - 1)),
          y: Math.max(-1, Math.min(1, (e.clientY / vh) * 2 - 1)),
        });
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="avatar-stage">
      <div
        className="avatar-wrap"
        style={{
          transform: `translate3d(${look.x * 14}px, ${look.y * 8}px, 0) rotateY(${look.x * 5}deg) rotateX(${-look.y * 3}deg)`,
        }}
      >
        <img
          src={asset(site.avatar)}
          alt={footerName}
          className="avatar-img"
          draggable={false}
        />
        {EYES.map((eye, i) => (
          <div
            key={eye.id}
            className="eye"
            ref={(el) => {
              eyeRefs.current[i] = el;
            }}
            style={{
              left: `${eye.cx}%`,
              top: `${eye.cy}%`,
              width: `${eye.w}%`,
              height: `${eye.h}%`,
              transform: `translate(-50%, -50%) rotate(${eye.tilt}deg)`,
            }}
          >
            <span
              className="iris"
              style={{
                width: `${(IRIS_W / eye.w) * 100}%`,
                transform: `translate(calc(-50% + ${iris[i].x}px), calc(-50% + ${iris[i].y}px))`,
              }}
            >
              <span className="pupil" />
              <span className="glint" />
            </span>
            <span className="lid-shadow" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- interaction helpers ---------- */

/** Adds `in` class when element scrolls into view (once). */
function Reveal({ as: Tag = "div", className = "", delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`reveal ${seen ? "in" : ""} ${className}`}
      style={{ "--delay": `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Animated number that counts up when visible / when `trigger` changes. */
function CountUp({ value, prefix = "", suffix = "", duration = 900, trigger }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const el = ref.current;
    const run = () => {
      const step = (t) => {
        if (!start) start = t;
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(value * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    setN(0);
    start = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    if (el) io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, trigger]);
  return (
    <span ref={ref} className="count">
      {prefix}
      {n}
      {suffix}
    </span>
  );
}

/** Card with a cursor-following spotlight + gentle 3D tilt. */
function SpotCard({ className = "", children, tilt = 6, ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const px = x / r.width - 0.5;
    const py = y / r.height - 0.5;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    el.style.setProperty("--rx", `${-py * tilt}deg`);
    el.style.setProperty("--ry", `${px * tilt}deg`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div
      ref={ref}
      className={`spot ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...rest}
    >
      <span className="spot-light" aria-hidden="true" />
      {children}
    </div>
  );
}

/* ---------- Experience explorer ---------- */
function Experience() {
  const [active, setActive] = useState(0);
  const [openIdx, setOpenIdx] = useState(0);
  const job = experience[active];

  // keyboard: ← → to switch roles
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setActive((a) => (a + 1) % experience.length);
      if (e.key === "ArrowLeft")
        setActive((a) => (a - 1 + experience.length) % experience.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setOpenIdx(0), [active]);

  return (
    <section className="section xp" id="work">
      <Reveal className="section-head">
        <p className="kicker">Career journey</p>
        <h2>Experience</h2>
        <p>{experienceIntro}</p>
      </Reveal>

      <div className="xp-grid">
        {/* Timeline rail */}
        <Reveal as="ol" className="rail" delay={80}>
          {experience.map((j, i) => (
            <li key={j.key}>
              <button
                type="button"
                className={`stop ${i === active ? "is-active" : ""} ${i < active ? "is-past" : ""}`}
                onClick={() => setActive(i)}
                aria-pressed={i === active}
              >
                <span className="dot">
                  <span className="dot-core" />
                </span>
                <span className="stop-body">
                  <span className="stop-years">{j.years}</span>
                  <span className="stop-org">{j.short}</span>
                  <span className="stop-role">{j.role.split("|")[0].trim()}</span>
                </span>
              </button>
            </li>
          ))}
          <span
            className="rail-progress"
            style={{ "--p": active / (experience.length - 1) }}
          />
        </Reveal>

        {/* Detail panel */}
        <Reveal className="xp-panel-wrap" delay={140}>
          <SpotCard className="xp-panel" key={job.key} tilt={3}>
            <div className="job-meta">
              <span className={`badge badge-${job.badge.toLowerCase()}`}>{job.badge}</span>
              <time>{job.period}</time>
            </div>
            <h3 className="xp-role">{job.role}</h3>
            <p className="org">{job.org}</p>

            <div className="metrics">
              {job.metrics.map((m, i) => (
                <div className="metric" key={m.label} style={{ "--i": i }}>
                  <CountUp
                    value={m.value}
                    prefix={m.prefix || ""}
                    suffix={m.suffix}
                    trigger={job.key}
                  />
                  <span className="metric-label">{m.label}</span>
                </div>
              ))}
            </div>

            <ul className="tags">
              {job.tags.map((t, i) => (
                <li key={t} style={{ "--i": i }}>
                  {t}
                </li>
              ))}
            </ul>

            <ul className="accordion">
              {job.points.map((p, i) => {
                const [head, ...rest] = p.split(" — ");
                const expandable = rest.length > 0;
                const open = expandable && openIdx === i;
                return (
                  <li
                    key={p}
                    className={`${open ? "open" : ""} ${expandable ? "" : "static"}`}
                    style={{ "--i": i }}
                  >
                    <button
                      type="button"
                      onClick={expandable ? () => setOpenIdx(open ? -1 : i) : undefined}
                      aria-expanded={expandable ? open : undefined}
                      tabIndex={expandable ? 0 : -1}
                    >
                      <span className="num">0{i + 1}</span>
                      <span className="head">{expandable ? head : p}</span>
                      {expandable && (
                        <span className="chev" aria-hidden="true">
                          +
                        </span>
                      )}
                    </button>
                    {rest.length > 0 && (
                      <div className="body">
                        <p>{rest.join(" — ")}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </SpotCard>
        </Reveal>
      </div>
    </section>
  );
}

export default function App() {
  useEffect(() => {
    document.title = site.title;
  }, []);

  return (
    <div className="site">
      <header className="nav">
        <nav className="nav-pill">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-copy">
            <p className="hi">{hero.greeting}</p>
            <h1>{hero.name}</h1>
            <p className="lede">{hero.headline}</p>
            <div className="cta-row">
              <a className="btn primary" href={asset(site.resumePdf)} download>
                {hero.primaryButton}
              </a>
              <a className="btn ghost" href="#contact">
                {hero.secondaryButton}
              </a>
            </div>
          </div>
          <AvatarEyes />
        </section>

        {/* stats strip under hero */}
        <Reveal as="section" className="stats-strip">
          {stats.map((s, i) => (
            <div key={s.label} className="stat" style={{ "--i": i }}>
              <CountUp value={s.value} prefix={s.prefix || ""} suffix={s.suffix || ""} duration={1100} />
              <span>{s.label}</span>
            </div>
          ))}
        </Reveal>

        <Experience />

        <section className="section" id="skills">
          <Reveal className="section-head">
            <p className="kicker">Toolbox</p>
            <h2>Skills</h2>
            <p>{skillsIntro}</p>
          </Reveal>
          <div className="skill-grid">
            {skills.map((g, gi) => (
              <Reveal key={g.title} delay={gi * 90}>
                <SpotCard className="skill-card">
                  <h3>{g.title}</h3>
                  <ul>
                    {g.items.map((s, i) => (
                      <li key={s} style={{ "--i": i }}>
                        <span className="pip" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </SpotCard>
              </Reveal>
            ))}
          </div>
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {[...skills.flatMap((g) => g.items), ...skills.flatMap((g) => g.items)].map(
                (s, i) => (
                  <span key={`${s}-${i}`}>{s}</span>
                )
              )}
            </div>
          </div>
        </section>

        <section className="section about" id="about">
          <Reveal className="section-head">
            <p className="kicker">Beyond the dashboards</p>
            <h2>About</h2>
          </Reveal>
          <div className="about-grid">
            <Reveal as="p" delay={60}>
              {about.summary}
            </Reveal>
            <div className="chips">
              {about.cards.map((c, i) => (
                <Reveal key={c.title} delay={120 + i * 90}>
                  <SpotCard className="chip-card" tilt={4}>
                    <h4>{c.title}</h4>
                    {c.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </SpotCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section contact" id="contact">
          <Reveal>
            <p className="kicker">Say hello</p>
            <h2>Let&apos;s connect</h2>
            <p className="contact-lede">{contact.intro}</p>
            <div className="contact-links">
              <a className="magnet" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
              <a className="magnet" href={contact.linkedin} target="_blank" rel="noreferrer">
                {contact.linkedinLabel}
              </a>
              <a className="magnet" href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                {contact.phone}
              </a>
              <span>{contact.location}</span>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} {footerName}</span>
        <a href={asset(site.resumePdf)} download>
          Download PDF resume
        </a>
      </footer>
    </div>
  );
}

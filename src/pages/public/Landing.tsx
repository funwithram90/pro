import { useEffect, useRef, useState, type RefObject } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, BellRing, MessageCircle, Moon, MousePointerClick, QrCode, ReceiptText, ShieldCheck, Smartphone, Sun, Wallet,
} from "lucide-react";
import { demoMode, errorMessage, signInSample } from "../../services/supabase";
import { isDarkNow, motionReduced, toggleNight } from "../../theme/theme";
import { useAuth } from "../../state/auth";
import { Jaali, Logo, Ring } from "../../components/ui/ui";
import { ReceiptPaper } from "../../components/documents/receipt";

// Preview content for the marketing page only. Never stored, clearly labelled.
const PREVIEW_RECEIPT = {
  receipt_no: "ANG-00042", amount: 18500, period: "2026-11", method: "upi", paid_at: "2026-11-04T10:30:00",
  tenant: "Kavya Iyer", property: "Gulmohar Court", unit: "Flat 3A", landlord: "Your name here", currency: "INR",
  reference: "UPI 4410…8821", verifyUrl: "https://aangan.example/r/preview",
};

const FEATURES: [typeof Wallet, string, string, boolean?][] = [
  [Wallet, "A wallet of passes", "Every tenancy is a pass with rent, due date and status. Flip it for recent payments and your UPI QR.", true],
  [ReceiptText, "Receipts in one tap", "Sequential receipt numbers, a printed-paper look, and a QR that anyone can scan to verify."],
  [BellRing, "Reminders you review", "Aangan drafts a polite message and opens it in WhatsApp. You read it and press send yourself; nothing goes out automatically."],
  [QrCode, "Made for India", "₹ and lakh/crore formatting, UPI IDs, WhatsApp first. Other currencies are a setting."],
  [ShieldCheck, "Honest numbers", "Recorded payments are never shown as a bank balance. Rent status is calculated, never typed in."],
  [Smartphone, "A portal for tenants", "Send each tenant a private link to check dues, pay by UPI, download receipts and report repairs. No app or account needed."],
];

const STEPS: [string, string][] = [
  ["Add your properties", "Flats, PG rooms or shops: add units and tenants in a minute, or import from a sheet."],
  ["Record and receipt", "Log a UPI or cash payment and a numbered, QR-verified receipt is ready to share."],
  ["Remind, kindly", "See who's overdue, review a polite draft and send it from your own WhatsApp."],
];

const USES = ["Flats", "PGs & hostels", "Small shops", "Co-living", "Student rooms", "Family homes", "Offices", "Godowns"];

/** Adds `.in` to `.reveal` elements as they scroll into view. */
function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>(".reveal");
    if (motionReduced() || !("IntersectionObserver" in window)) { items.forEach((i) => i.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [root]);
}

/** Tilts the hero cards toward the pointer on desktop. Writes two CSS variables once per frame at most. */
function useTilt(stage: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = stage.current;
    if (!el || motionReduced() || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--tx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        el.style.setProperty("--ty", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    };
    const onLeave = () => { el.style.setProperty("--tx", "0"); el.style.setProperty("--ty", "0"); };
    const host = el.parentElement ?? el;
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    return () => { host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave); cancelAnimationFrame(raf); };
  }, [stage]);
}

/** Pauses decorative loops when the hero is off screen or the tab is hidden. */
function usePauseOffscreen(root: RefObject<HTMLElement | null>, hero: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current, h = hero.current;
    if (!el || !h || !("IntersectionObserver" in window)) return;
    let visible = true;
    const sync = () => el.classList.toggle("paused", !visible || document.visibilityState !== "visible");
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
    io.observe(h);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, [root, hero]);
}

export default function LandingPage() {
  const { session } = useAuth();
  const [opening, setOpening] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [dark, setDark] = useState(() => isDarkNow());
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);
  useTilt(stageRef);
  usePauseOffscreen(rootRef, heroRef);
  if (session) return <Navigate to="/app" replace />;
  // The sign-in updates the session, and the redirect above takes over.
  const explore = async () => {
    setOpening(true);
    setDemoError(null);
    try {
      const { error } = await signInSample("owner");
      if (error) throw error;
    } catch (err) {
      setDemoError(errorMessage(err));
    } finally {
      setOpening(false);
    }
  };
  const flip = () => { toggleNight(); setDark((v) => !v); };
  const demoButton = demoMode
    ? <button className="btn ghost lg" onClick={explore} disabled={opening}><MousePointerClick size={18} /> {opening ? "Opening…" : "Explore the demo"}</button>
    : <a href="#how" className="btn ghost lg">How it works</a>;

  return (
    <div className="landing" ref={rootRef}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="landing-nav">
        <div className="brand"><Logo /><span>Aangan</span></div>
        <nav className="landing-links" aria-label="Sections"><a href="#features">Features</a><a href="#how">How it works</a></nav>
        <div className="row gap-sm">
          <button className="icon-btn" onClick={flip} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <Link to="/login" className="btn ghost">Sign in</Link>
          <Link to="/login?signup=1" className="btn primary">Start free</Link>
        </div>
      </header>

      <main id="main">
        <section className="hero" ref={heroRef}>
          <div className="hero-copy">
            <span className="hero-badge glass"><b>New</b> Holi colours · आँगन, the courtyard</span>
            <h1>Rent, receipts and reminders, <em>without the spreadsheet.</em></h1>
            <p className="lede">Aangan is the shared space between you, your properties and your tenants. See who has paid at a glance, issue a numbered receipt in one tap, and draft a polite reminder that opens in WhatsApp, ready for you to read and send.</p>
            <div className="row gap-sm"><Link to="/login?signup=1" className="btn primary lg">Create your account <ArrowRight size={18} /></Link>{demoButton}</div>
            {demoError && <p className="form-error" role="alert">{demoError}</p>}
            <div className="hero-trust">
              <div><strong>1–50</strong><span>units, flats to PGs</span></div>
              <div><strong>1 tap</strong><span>QR-verified receipts</span></div>
              <div><strong>Offline</strong><span>installable app</span></div>
            </div>
            {demoMode && <p className="small muted">The demo opens a sample workspace you can change freely.</p>}
          </div>
          <div className="hero-art">
            <span className="preview-tag">Preview</span>
            <div className="hero-stage" ref={stageRef}>
              <div className="crystal-orb" aria-hidden />
              <div className="pass demo" style={{ ["--pass" as string]: "#0b6f6d" }}>
                <div className="pass-inner"><div className="pass-face pass-front">
                  <Jaali className="pass-art" />
                  <div className="pass-top"><div><span className="eyebrow light">Apartment</span><h3>Gulmohar Court</h3><span className="pass-unit">Flat 3A</span></div><span className="pill pill-paid">Paid</span></div>
                  <div className="pass-mid"><div className="avatar light">KI</div><div><span className="eyebrow light">Tenant</span><strong>Kavya Iyer</strong></div></div>
                  <div className="pass-bottom"><div><span className="eyebrow light">Rent</span><span className="mono big">₹18,500</span></div><div><span className="eyebrow light">Due</span><span className="mono">5 Nov</span></div><div><span className="eyebrow light">Paid</span><span className="mono">₹18,500</span></div></div>
                </div></div>
              </div>
              <div className="hero-receipt"><ReceiptPaper r={PREVIEW_RECEIPT} /></div>
              <div className="hero-ring card"><Ring value={0.78} size={96} stroke={10}><strong className="mono">78%</strong></Ring><div><span className="eyebrow">November</span><strong className="mono">₹1,44,300</strong><small className="muted">collected</small></div></div>
              <span className="float-chip ok" aria-hidden><BadgeCheck /> Receipt verified</span>
              <span className="float-chip wa" aria-hidden><MessageCircle /> Reminder ready to send</span>
            </div>
          </div>
        </section>

        <div className="marquee" aria-label="Built for">
          <div className="marquee-track">
            {[...USES, ...USES].map((u, i) => <span key={i} aria-hidden={i >= USES.length}>{u}</span>)}
          </div>
        </div>

        <section className="l-section" id="features">
          <div className="l-head reveal">
            <span className="eyebrow">Everything in one courtyard</span>
            <h2>Calm tools for <span className="crystal-text">busy landlords.</span></h2>
            <p>Six things done well, so the first of the month stops being a chore.</p>
          </div>
          <div className="features">
            {FEATURES.map(([I, title, body, wide], i) => (
              <div className={`feature reveal${wide ? " wide" : ""}`} key={title} style={{ ["--d" as string]: `${(i % 3) * 0.07}s` }}>
                <I size={22} /><h3>{title}</h3><p>{body}</p><span className="feature-glow" aria-hidden />
              </div>
            ))}
          </div>
        </section>

        <section className="l-section" id="how">
          <div className="l-head reveal">
            <span className="eyebrow">How it works</span>
            <h2>Set up in minutes. <span className="crystal-text">Collect all year.</span></h2>
          </div>
          <ol className="steps" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {STEPS.map(([title, body], i) => (
              <li className="card step reveal" key={title} style={{ ["--d" as string]: `${i * 0.08}s` }}>
                <span className="step-n">{i + 1}</span><h3>{title}</h3><p>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="cta-band reveal">
          <span className="eyebrow light">Free for small landlords</span>
          <h2>Your properties deserve a calmer first of the month.</h2>
          <p>Create a workspace in under a minute. Invite a partner or a caretaker when you're ready.</p>
          <div className="row gap-sm wrap"><Link to="/login?signup=1" className="btn lg">Start free <ArrowRight size={18} /></Link>{demoMode && <button className="btn ghost lg" onClick={explore} disabled={opening}>{opening ? "Opening…" : "Try the demo"}</button>}</div>
        </section>
      </main>

      <footer className="landing-foot glass">
        <div className="foot-brand">
          <div className="brand"><Logo size={26} /><span>Aangan</span></div>
          <span className="small muted">Rent, receipts and reminders for small landlords in India.</span>
        </div>
        <nav className="foot-links" aria-label="Footer">
          <a href="#features">Features</a><a href="#how">How it works</a><Link to="/login">Sign in</Link><Link to="/login?signup=1">Start free</Link>
        </nav>
        <span className="foot-note tiny muted">© {new Date().getFullYear()} Aangan · आँगन, the courtyard</span>
      </footer>
    </div>
  );
}

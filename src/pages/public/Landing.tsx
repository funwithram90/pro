import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Building2, Check, ChevronRight, CreditCard, Home, MessageCircle, ReceiptText, ShieldCheck, Sparkles, Users, Wallet } from "lucide-react";
import { demoMode, errorMessage, signInSample } from "../../services/supabase";
import { useAuth } from "../../state/auth";
import { Logo } from "../../components/ui/ui";

const FEATURES = [
  { icon: Wallet, title: "Rent, without the guesswork.", text: "See what’s paid, what’s pending, and what needs a friendly nudge. One clear view of your rental income.", label: "RENT & PAYMENTS" },
  { icon: Users, title: "A better place for your people.", text: "Keep tenants, lease details, and payment history together. Share a private portal so everyone stays in the loop.", label: "TENANTS & LEASES" },
  { icon: ReceiptText, title: "A little less paperwork.", text: "Create numbered receipts when you record rent. Share them, print them, and verify them with a simple QR code.", label: "RECEIPTS & RECORDS" },
];
export default function LandingPage() {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (session) return <Navigate to="/app" replace/>;
  async function demo() {
    setBusy(true);setError("");
    try { const {error}=await signInSample();if(error)throw error; }
    catch(e) {setError(errorMessage(e));}
    finally {setBusy(false);}
  }
  return <div className="new-landing">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="public-header"><Link className="brand" to="/"><Logo size={35}/><span>Aangan</span></Link><nav aria-label="Website"><a href="#features">The little details</a><Link to="/login">Sign in</Link><Link className="btn primary" to="/login?signup=1">Make yourself at home <ArrowUpRight size={14}/></Link></nav></header>
    <main id="main"><section className="new-hero"><div className="new-hero-copy"><span className="hero-kicker"><span/> A CLEARER WAY TO MANAGE RENTALS</span><h1>Good places.<br/>Happy people.<br/><span>Peace of mind.</span></h1><p>Your properties, tenants, and rent. Thoughtfully brought together, so managing a place feels a little more like home.</p><div className="hero-actions"><Link className="btn primary" to="/login?signup=1">Start your next chapter <ArrowRight size={16}/></Link>{demoMode && <button className="btn" onClick={demo} disabled={busy}>{busy ? "Opening your workspace…" : "Explore the demo"}<ChevronRight size={16}/></button>}</div>{error && <p className="form-error" role="alert">{error}</p>}<div className="hero-smallprint"><ShieldCheck size={14}/><span>Built for small landlords. Made for everyday life.</span></div></div>
    <div className="hero-product-scene"><div className="hero-house"><img src="/media/property-house.jpg" alt="Modern home with a garden, an illustrative property"/><div className="hero-house-shade"/><div className="hero-house-title"><span>ROOM TO GROW</span><h2>Every address.<br/>A new possibility.</h2></div></div><div className="hero-floating-summary"><div className="row between"><span className="preview-icon"><Building2 size={18}/></span><span className="sample-badge">Sample workspace</span></div><span className="small muted">Your month, at a glance</span><strong>Everything in its place.</strong><div className="hero-preview-progress"><i/></div><div className="row between"><span><Check size={12}/> Payments recorded</span><ReceiptText size={16}/></div></div><div className="hero-receipt"><span className="receipt-check"><Check size={18}/></span><div><strong>A little less to think about.</strong><small>Rent recorded. Receipt ready.</small></div><Sparkles size={17}/></div><span className="scene-caption">Illustrative property · Explore your own workspace inside</span></div></section>
    <section className="product-principles"><span><Home size={18}/> A home for every property</span><span><CreditCard size={18}/> UPI-friendly workflows</span><span><MessageCircle size={18}/> Thoughtful reminders</span><span><ShieldCheck size={18}/> Clear, traceable records</span></section>
    <section id="features" className="new-features"><div className="features-heading"><span className="welcome-label">LESS ADMIN. MORE LIVING.</span><h2>The details, taken care of.</h2><p>Everything you need to look after your rentals, with room to breathe.</p></div><div className="new-feature-grid">{FEATURES.map((f) => <article key={f.label}><span className="feature-icon"><f.icon size={23}/></span><span className="welcome-label">{f.label}</span><h3>{f.title}</h3><p>{f.text}</p><Link to="/login?signup=1">Find your clarity <ArrowUpRight size={15}/></Link></article>)}</div></section>
    <section className="public-cta"><div><span className="welcome-label">YOUR NEXT CHAPTER</span><h2>A little more space<br/>for the things that matter.</h2></div><Link to="/login?signup=1" className="btn primary">Create your workspace <ArrowRight size={16}/></Link></section>
    </main><footer className="public-footer"><Link className="brand" to="/"><Logo size={25}/><span>Aangan</span></Link><span>A little more at home.</span><Link to="/login">Your workspace <ArrowUpRight size={13}/></Link></footer>
  </div>;
}

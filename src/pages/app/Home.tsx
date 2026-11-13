import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Building2, CalendarDays, Check, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, Download, MessageCircle, Plus, ReceiptText, Send, Wrench } from "lucide-react";
import { useCanWrite, useData, useLive } from "../../state/data";
import { currentPeriod, dateLabel, initials, money, periodLabel, shiftPeriod, todayISO, tone, waLink } from "../../utils/format";
import { daysUntil, rentRows, type LeaseRow } from "../../domain/rent";
import { reminderText } from "../../domain/reminders";
import { Empty, Pill, SheetIf } from "../../components/ui/ui";
import { PaymentForm } from "../../components/forms/forms";
import { exportPaymentsCsv } from "../../domain/reports";
import type { ShellCtx } from "../../components/layout/shell";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function HomePage() {
  const live = useLive();
  const data = useData();
  const canWrite = useCanWrite();
  const { openAdd } = useOutletContext<ShellCtx>();
  const ws = live.workspace!;
  const [period, setPeriod] = useState(currentPeriod);
  const rows = useMemo(() => rentRows(period, live), [period, live]);
  const expected = rows.reduce((s, r) => s + r.rent, 0);
  const collected = rows.reduce((s, r) => s + Math.min(r.paid, r.rent), 0);
  const spent = live.expenses.filter((e) => e.spent_on.startsWith(period)).reduce((s, e) => s + Number(e.amount), 0);
  const received = live.payments.filter((p) => p.paid_at.slice(0, 7) === period).reduce((s, p) => s + Number(p.amount), 0);
  const openTasks = live.tasks.filter((t) => t.status !== "done");
  const today = todayISO();
  const ending = live.leases.filter((l) => l.status === "active" && l.end_date && daysUntil(l.end_date, today) <= 60 && daysUntil(l.end_date, today) >= -30);
  const attention = rows.filter((r) => r.status !== "paid");
  const occupied = new Set(live.leases.filter((l) => l.status === "active" && l.start_date <= today && (!l.end_date || l.end_date >= today)).map((l) => l.unit_id));
  const activeUnits = live.units.filter((u) => live.properties.some((p) => p.id === u.property_id));
  const occupancy = activeUnits.length ? Math.round(activeUnits.filter((u) => occupied.has(u.id)).length / activeUnits.length * 100) : 0;
  const [queue, setQueue] = useState<number | null>(null);
  const [recordAny, setRecordAny] = useState(false);
  const [recordFor, setRecordFor] = useState<LeaseRow | null>(null);
  const [filter, setFilter] = useState("all");
  const reminderRows = attention.filter((r) => filter === "all" || (filter === "overdue" ? r.status === "overdue" : r.status !== "overdue"));
  const months = Array.from({ length: 6 }, (_, i) => shiftPeriod(period, i - 5));
  const flow = months.map((m) => ({ m, incoming: live.payments.filter((p) => p.paid_at.slice(0, 7) === m).reduce((s, p) => s + Number(p.amount), 0), outgoing: live.expenses.filter((e) => e.spent_on.startsWith(m)).reduce((s, e) => s + Number(e.amount), 0) }));
  const peak = Math.max(1, ...flow.flatMap((f) => [f.incoming, f.outgoing]));
  const percent = expected ? Math.round(collected / expected * 100) : 0;
  const payments = [...live.payments].sort((a, b) => b.paid_at.localeCompare(a.paid_at)).slice(0, 4);

  return <div className="page overview-page">
    <div className="page-head overview-heading">
      <div><span className="welcome-label">YOUR RENTAL WORKSPACE</span><h1 className="display">{greeting()}<span className="greeting-dot">.</span></h1><p className="page-sub">A little clarity. A lot more peace of mind.</p></div>
      <div className="row gap-sm"><button className="btn export-button" onClick={() => exportPaymentsCsv(data)}><Download size={16} /> Export all payments</button>{canWrite && rows.length > 0 && <button className="btn primary" onClick={() => setRecordAny(true)}><Plus size={17} /> Record payment</button>}</div>
    </div>
    <div className="overview-toolbar"><div className="overview-tabs"><span className="selected">Overview</span><Link to="/app/reports">Insights <ArrowUpRight size={13} /></Link></div><div className="period-control"><button aria-label="Previous month" onClick={() => setPeriod(shiftPeriod(period, -1))}><ChevronLeft size={15}/></button><CalendarDays size={14}/><span>{periodLabel(period)}</span><button aria-label="Next month" onClick={() => setPeriod(shiftPeriod(period, 1))}><ChevronRight size={15}/></button></div></div>
    {data.properties.length === 0 ? <div className="card"><Empty title="Your next chapter starts here"><p>Add your first property, create its units, and bring your rental workspace to life.</p>{canWrite && <button className="btn primary" onClick={() => openAdd("property")}><Plus size={16}/> Add a property</button>}</Empty></div> : <>
    <section className="overview-stats" aria-label="Rental summary">
      <div className="metric-card"><div className="metric-label"><span>Rent collected</span><i className="metric-icon blue"><CircleDollarSign size={18}/></i></div><strong>{money(collected)}</strong><small><span className="positive"><Check size={12}/> {percent}% collected</span> of {money(expected)}</small></div>
      <div className="metric-card"><div className="metric-label"><span>Outstanding rent</span><i className="metric-icon amber"><Clock3 size={18}/></i></div><strong>{money(expected - collected)}</strong><small><span className="attention-count">{attention.length} {attention.length === 1 ? "tenancy" : "tenancies"}</span> awaiting payment</small></div>
      <Link to="/app/properties" className="metric-card"><div className="metric-label"><span>Current occupancy</span><i className="metric-icon violet"><Building2 size={18}/></i></div><strong>{occupancy}<span className="metric-percent">%</span></strong><small>{activeUnits.filter((u) => occupied.has(u.id)).length} of {activeUnits.length} units occupied <ArrowUpRight size={13}/></small></Link>
      <Link to="/app/tasks" className="metric-card"><div className="metric-label"><span>Open maintenance</span><i className="metric-icon teal"><Wrench size={18}/></i></div><strong>{openTasks.length.toString().padStart(2, "0")}</strong><small><span className="attention-count">{openTasks.filter((t) => t.priority === "urgent" || t.priority === "high").length} high priority</span> <ArrowUpRight size={13}/></small></Link>
    </section>
    <section className="finance-grid">
      <div className="card cashflow-card"><div className="card-head"><div><h2>Cash flow</h2><p className="muted small">The bigger picture, month by month.</p></div><span className="chart-range">Last 6 months</span></div><div className="cashflow-summary"><strong>{money(received - spent)}</strong><span>Net recorded in {periodLabel(period, true)}</span><div className="chart-legend"><span><i/> Rent in</span><span><i/> Expenses</span></div></div>
        <div className="cash-chart"><div className="chart-axis">{[1, .75, .5, .25, 0].map((n) => <span key={n}>{money(Math.round(peak*n))}</span>)}</div><div className="chart-plot"><div className="chart-lines" aria-hidden>{[0,1,2,3,4].map((n) => <i key={n}/>)}</div><div className="chart-columns">{flow.map((f) => <div className={`chart-month ${f.m === period ? "current" : ""}`} key={f.m}><div className="chart-bars"><div className="income-bar" style={{height:`${f.incoming/peak*100}%`}}/><div className="expense-bar" style={{height:`${f.outgoing/peak*100}%`}}/></div><span>{periodLabel(f.m, true).split(" ")[0]}</span><div className="chart-tooltip">{periodLabel(f.m)}<br/>Rent: {money(f.incoming)}<br/>Expenses: {money(f.outgoing)}</div></div>)}</div></div></div><details className="chart-data"><summary>View chart data</summary><ul>{flow.map((f) => <li key={f.m}>{periodLabel(f.m)}: rent {money(f.incoming)}, expenses {money(f.outgoing)}</li>)}</ul></details>
      </div>
      <div className="collection-card"><div className="collection-card-top"><span><span className="live-dot"/> COLLECTION HEALTH</span><ArrowUpRight size={19}/></div><h2>Every payment.<br/>A little more progress.</h2><div className="collection-progress"><svg viewBox="0 0 180 108" aria-hidden><path d="M18 90a72 72 0 0 1 144 0" pathLength="100"/><path className="progress-arc" d="M18 90a72 72 0 0 1 144 0" pathLength="100" strokeDasharray={`${percent} 100`}/></svg><strong>{percent}<span>%</span></strong><small>of rent collected</small></div><div className="collection-footer"><span>{rows.filter((r) => r.status === "paid").length} of {rows.length} tenancies paid</span><Link to="/app/payments" aria-label="View payments"><ArrowRight size={19}/></Link></div></div>
    </section>
    <section className="dashboard-bottom">
      <div className="stack"><div className="card dues-card"><div className="card-head"><div className="row gap-sm"><h2>Needs a little attention</h2><span className="count-pill">{attention.length}</span></div><Link to="/app/reminders" className="text-action">View all <ArrowRight size={14}/></Link></div><div className="dues-filters">{["all", "overdue", "due"].map((f) => <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)} aria-pressed={filter === f}>{f === "all" ? "All outstanding" : f === "overdue" ? "Overdue" : "Upcoming"}</button>)}{reminderRows.length > 0 && <button className="remind-all" onClick={() => setQueue(0)}><Send size={13}/> Reminder round</button>}</div>
        {reminderRows.length === 0 ? <Empty title={!rows.length ? "No tenancies this month" : attention.length ? "All clear here" : "Everyone’s paid up"}>{!rows.length ? "No rent is due in this period." : `No ${filter === "overdue" ? "overdue" : "outstanding"} rent in this view.`}</Empty> : <div className="dues-table"><div className="dues-table-heading"><span>Tenant</span><span>Amount due</span><span>Status</span><span>Action</span></div>{reminderRows.map((r, index) => <div className="dues-row" key={r.lease.id}><Link to={`/app/tenants/${r.tenant.id}`} className="tenant-cell"><div className="avatar" data-tone={tone(r.tenant.name)}>{initials(r.tenant.name)}</div><div><strong>{r.tenant.name}</strong><small>{r.property.name} · {r.unit.label}</small></div></Link><div className="dues-amount"><strong>{money(r.balance)}</strong><small>{r.daysLate ? `${r.daysLate} days late` : `Due ${dateLabel(r.dueDate)}`}</small></div><Pill status={r.status}/><div className="row gap-sm">{canWrite && <button className="record-mini" onClick={() => setRecordFor(r)} aria-label={`Record payment for ${r.tenant.name}`}><Plus size={16}/></button>}{r.tenant.phone_whatsapp ? <a className="reminder-mini" href={waLink(r.tenant.phone_whatsapp, reminderText(r, ws))} target="_blank" rel="noreferrer" aria-label={`Remind ${r.tenant.name} on WhatsApp`}><MessageCircle size={16}/></a> : <button className="reminder-mini" onClick={() => setQueue(index)} aria-label={`Review reminder for ${r.tenant.name}: WhatsApp number missing`}><MessageCircle size={16}/></button>}</div></div>)}</div>}
      </div>
      <div className="card recent-card"><div className="card-head"><h2>Recent payments</h2><Link to="/app/payments" className="text-action">View all <ArrowRight size={14}/></Link></div>{payments.length ? payments.map((p) => {const l=live.leases.find((l) => l.id === p.lease_id);const t=data.tenants.find((t) => t.id === l?.tenant_id);return <Link to={`/app/payments/${p.id}`} className="recent-payment" key={p.id}><span className="payment-icon"><ArrowDownLeft size={18}/></span><div className="grow"><strong>{t?.name ?? "Rent payment"}</strong><small>{p.receipt_no} · {dateLabel(p.paid_at)}</small></div><strong className="positive">+{money(Number(p.amount))}</strong><ChevronRight size={15}/></Link>}) : <Empty title="Your first payment belongs here">Record a payment to create a receipt.</Empty>}</div></div>
      <aside className="stack portfolio-stack"><div className="card portfolio-card"><div className="card-head"><h2>Your properties</h2><Link to="/app/properties" className="text-action">View all <ArrowRight size={14}/></Link></div>{live.properties.slice(0, 2).map((p, i) => {const units=live.units.filter((u) => u.property_id === p.id);return <Link to={`/app/properties/${p.id}`} key={p.id} className="portfolio-item"><div className={`portfolio-photo property-art art-${i}`}>{live.demo ? <img src={`/media/property-${i === 0 ? "house" : "interior"}.jpg`} alt=""/> : <Building2 size={42}/>}<span className="property-type">{p.type}</span></div><div className="portfolio-info"><div><h3>{p.name}</h3><small>{units.length} units · {units.filter((u) => occupied.has(u.id)).length} occupied</small></div><span className="property-arrow"><ArrowUpRight size={17}/></span></div></Link>})}{canWrite && <button className="add-property-link" onClick={() => openAdd("property")}><Plus size={15}/> Add a property</button>}</div>
      <div className="renewal-note"><span className="renewal-icon"><CalendarDays size={19}/></span><div><strong>{ending.length ? `${ending.length} lease${ending.length === 1 ? "" : "s"} to review` : "No renewals coming up"}</strong><small>{ending.length ? "Active leases: ending in 60 days or up to 30 days past end." : "Your next 60 days look clear."}</small><Link to="/app/tenants">Manage tenancies <ArrowRight size={13}/></Link></div></div></aside>
    </section>
    <p className="dashboard-foot"><ReceiptText size={13}/> Based on your recorded payments. Not a live bank balance.</p>
    </>}
    <SheetIf open={queue !== null && reminderRows[queue]} title={queue !== null ? `Reminder ${queue + 1} of ${reminderRows.length}` : ""} onClose={() => setQueue(null)}>{queue !== null && reminderRows[queue] && <ReminderStep key={reminderRows[queue].lease.id} row={reminderRows[queue]} ws={ws} onNext={() => setQueue(queue + 1 < reminderRows.length ? queue + 1 : null)} last={queue + 1 >= reminderRows.length}/>}</SheetIf>
    <SheetIf open={recordAny} title="Record a payment" onClose={() => setRecordAny(false)}>{recordAny && <PaymentForm period={period} onDone={() => setRecordAny(false)}/>}</SheetIf>
    <SheetIf open={recordFor} title="Record a payment" onClose={() => setRecordFor(null)}>{recordFor && <PaymentForm leaseId={recordFor.lease.id} period={period} onDone={() => setRecordFor(null)}/>}</SheetIf>
  </div>;
}

function ReminderStep({ row, ws, onNext, last }: { row: LeaseRow; ws: NonNullable<ReturnType<typeof useLive>["workspace"]>; onNext: () => void; last: boolean }) {
  const [text, setText] = useState(reminderText(row, ws));
  return (
    <div className="form">
      <div className="row between">
        <div><strong>{row.tenant.name}</strong><div className="muted small">{row.property.name} · {row.unit.label}</div></div>
        <Pill status={row.status} />
      </div>
      {!row.tenant.phone_whatsapp && <p className="form-error">No WhatsApp number saved. WhatsApp opens so you can pick the contact.</p>}
      <label className="field"><span className="field-label">Message (edit before sending)</span><textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <div className="row gap">
        <button className="btn ghost" onClick={onNext}>{last ? "Finish" : "Skip"}</button>
        <a className="btn primary grow" href={waLink(row.tenant.phone_whatsapp, text)} target="_blank" rel="noreferrer" onClick={() => setTimeout(onNext, 300)}>
          <MessageCircle size={16} /> Open WhatsApp
        </a>
      </div>
    </div>
  );
}

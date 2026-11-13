import { useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Archive, Building2, MapPin, Pencil, Plus, Search, UserPlus } from "lucide-react";
import { useCanWrite, useData, useLive } from "../../state/data";
import { useNotify } from "../../state/notify";
import { supabase, errorMessage } from "../../services/supabase";
import { currentPeriod, money, todayISO } from "../../utils/format";
import { rentRows } from "../../domain/rent";
import { Empty, Pill, SheetIf } from "../../components/ui/ui";
import { PropertyForm, TenantLeaseForm } from "../../components/forms/forms";
import type { ShellCtx } from "../../components/layout/shell";

export function PropertiesPage() {
  const live = useLive();
  const canWrite = useCanWrite();
  const { openAdd } = useOutletContext<ShellCtx>();
  const rows = useMemo(() => rentRows(currentPeriod(), live), [live]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("All properties");
  const kinds = ["All properties", ...new Set(live.properties.map((p) => p.type))];
  const list = live.properties.filter((p) => (kind === "All properties" || p.type === kind) && `${p.name} ${p.address ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return <div className="page properties-page">
    <div className="page-head"><div><span className="welcome-label">YOUR PORTFOLIO</span><h1 className="display">Places with possibilities<span className="greeting-dot">.</span></h1><p className="page-sub">Every property. Every unit. All in a good place.</p></div>{canWrite && <button className="btn primary" onClick={() => openAdd("property")}><Plus size={16}/> Add property</button>}</div>
    <div className="portfolio-toolbar"><div className="property-filters">{kinds.map((k) => <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={kind === k ? "active" : ""}>{k}{k === "All properties" && <span>{live.properties.length}</span>}</button>)}</div><label className="property-search"><Search size={15}/><input aria-label="Search properties" placeholder="Find a property…" value={q} onChange={(e) => setQ(e.target.value)}/></label></div>
    {!list.length ? <div className="card"><Empty icon={<Building2/>} title={live.properties.length ? "No properties found" : "Make room for your first property"}>{live.properties.length ? "Try a different name or property type." : "Add a property and its units to start your rental journey."}</Empty></div> : <div className="premium-property-grid">{list.map((p) => {
      const units=live.units.filter((u) => u.property_id === p.id);
      const pr=rows.filter((r) => r.property.id === p.id);
      const rent=pr.reduce((s,r) => s+r.rent,0);
      const collected=pr.reduce((s,r) => s+Math.min(r.paid,r.rent),0);
      const occupied=new Set(live.leases.filter((l) => l.status === "active" && l.start_date <= todayISO() && (!l.end_date || l.end_date >= todayISO())).map((l) => l.unit_id));
      const count=units.filter((u) => occupied.has(u.id)).length;
      const demoIndex=live.properties.findIndex((x) => x.id === p.id);
      return <Link to={`/app/properties/${p.id}`} className="premium-property" key={p.id}><div className="premium-property-cover">{live.demo && demoIndex < 2 ? <img src={`/media/property-${demoIndex === 0 ? "house" : "interior"}.jpg`} alt=""/> : <Building2 size={60}/>}<span className="property-type">{p.type}</span><span className="property-open"><ArrowUpRight size={18}/></span></div><div className="premium-property-body"><h2>{p.name}</h2><p className="property-address"><MapPin size={12}/>{p.address || "Address not added"}</p><div className="property-unit-info"><span><Building2 size={13}/>{units.length} units</span><span><i/>{count} occupied</span></div><div className="property-financials"><div><small>Monthly rent</small><strong>{money(rent)}</strong></div><div><small>Collected</small><strong className="positive">{money(collected)}</strong></div></div><div className="property-collection-track"><i style={{width:`${rent ? collected/rent*100 : 0}%`}}/></div><small className="property-collection-label">{rent ? Math.round(collected/rent*100) : 0}% of this month’s rent recorded</small></div></Link>;
    })}{canWrite && <button className="property-add-card" onClick={() => openAdd("property")}><span><Plus size={25}/></span><strong>Your next property</strong><small>A new address. A new possibility.</small><span className="btn">Add property <ArrowUpRight size={14}/></span></button>}</div>}
  </div>;
}

export function PropertyDetailPage() {
  const { id } = useParams();
  const d = useData();
  const live = useLive();
  const notify = useNotify();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [addTenantFor, setAddTenantFor] = useState<string | null>(null);
  const p = d.properties.find((x) => x.id === id);
  const rows = useMemo(() => rentRows(currentPeriod(), live), [live]);
  if (!p) return <div className="page"><Empty title="Property not found"><Link to="/app/properties">Back</Link></Empty></div>;
  const units = live.units.filter((u) => u.property_id === p.id);

  async function archive(table: "properties" | "units", rowId: string, label: string) {
    if (!confirm(`Archive ${label}? It will be hidden but its history is kept.`)) return;
    const { error } = await supabase.from(table).update({ archived_at: new Date().toISOString() }).eq("id", rowId);
    if (error) return notify(errorMessage(error));
    await d.refresh();
    notify(`${label} archived`);
    if (table === "properties") navigate("/app/properties");
  }

  return (
    <div className="page">
      <div className="page-head">
        <Link to="/app/properties" className="btn ghost small"><ArrowLeft size={16} /> Properties</Link>
        <div className="row gap-sm">
          <button className="btn ghost small" onClick={() => setEditing(true)}><Pencil size={14} /> Edit</button>
          <button className="btn ghost small" onClick={() => archive("properties", p.id, p.name)}><Archive size={14} /> Archive</button>
        </div>
      </div>
      <div className="hero-card card">
        <span className="eyebrow">{p.type}</span>
        <h1 className="display">{p.name}</h1>
        {p.address && <p className="muted"><MapPin size={14} /> {p.address}</p>}
      </div>
      <div className="card">
        <div className="card-head"><h2>Units</h2></div>
        <ul className="list">
          {units.map((u) => {
            const r = rows.find((x) => x.unit.id === u.id);
            return (
              <li key={u.id} className="list-row">
                <span className="dot lg" style={{ background: u.pass_colour ?? "var(--accent)" }} />
                <div className="grow">
                  <strong>{u.label}</strong>
                  {r ? <small className="muted"><Link to={`/app/tenants/${r.tenant.id}`}>{r.tenant.name}</Link> · {money(r.rent)}/mo</small> : <small className="muted">Vacant</small>}
                </div>
                {r ? <Pill status={r.status} /> : <button className="btn small" onClick={() => setAddTenantFor(u.id)}><UserPlus size={14} /> Add tenant</button>}
                {!r && <button className="icon-btn" aria-label="Archive unit" onClick={() => archive("units", u.id, u.label)}><Archive size={15} /></button>}
              </li>
            );
          })}
        </ul>
      </div>
      <SheetIf open={editing} title="Edit property" onClose={() => setEditing(false)}>
        <PropertyForm property={p} onDone={() => setEditing(false)} />
      </SheetIf>
      <SheetIf open={addTenantFor} title="Add tenant & lease" onClose={() => setAddTenantFor(null)}>
        {addTenantFor && <TenantLeaseForm unitId={addTenantFor} onDone={() => setAddTenantFor(null)} />}
      </SheetIf>
    </div>
  );
}

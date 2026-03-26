import { useState, useMemo, useRef, useEffect } from "react";
import * as d3 from "d3";

// ─── Dummy data based on Simon-Kucher slides ───────────────────────────
const SEGMENTS = [
  "Industrial Production",
  "Retail & Consumer Networks",
  "Healthcare & Social Care",
  "Banking & Financial Services",
  "Logistics & Transport",
  "Real Estate", 
];

const SUB_SEGMENTS = {
  "Industrial Production": ["Automotive", "FMCG Manufacturing", "Heavy Industry", "Electronics", "Chemicals"],
  "Retail & Consumer Networks": ["Grocery Chains", "Fashion Retail", "DIY & Home", "Shopping Centers"],
  "Healthcare & Social Care": ["Hospitals", "Clinics", "Elderly Care", "Pharma Facilities"],
  "Banking & Financial Services": ["Retail Banking", "Corporate Banking", "Insurance", "FinTech"],
  "Logistics & Transport": ["Warehousing", "Distribution Centers", "Port Facilities", "Freight Hubs"],
  "Real Estate": ["Office Buildings", "Mixed-Use Complexes", "Industrial Parks", "Residential Estates"],
};

const REGIONS = ["Mazowieckie", "Śląskie", "Wielkopolskie", "Małopolskie", "Dolnośląskie", "Łódzkie", "Pomorskie", "Zachodniopomorskie"];
const STATUSES = ["New Suspect", "Lost Prospect", "Lost Client", "Current Client"];
const PRIORITIES = ["P1 - High Priority", "P2 - Opportunistic"];

function generateCompanies(count) {
  const polishCompanyPrefixes = [
    "Pol", "War", "Krak", "Gdań", "Wrocł", "Łódź", "Pozn", "Szcz", "Lub", "Kat",
    "Bial", "Czest", "Rad", "Tor", "Kiel", "Ols", "Rzesz", "Opol", "Gliwi", "Zabrz",
    "Bydg", "Tychy", "Sosnow", "Elbl", "Płock", "Tarn", "Chorzów", "Bytom", "Ruda",
  ];
  const companySuffixes = [
    "Tech Sp. z o.o.", "Invest S.A.", "Group Sp. z o.o.", "Solutions S.A.", "Holding Sp. z o.o.",
    "Industrial S.A.", "Logistics Sp. z o.o.", "Development S.A.", "Services Sp. z o.o.", "Capital S.A.",
    "Engineering Sp. z o.o.", "Systems S.A.", "Management Sp. z o.o.", "Partners S.A.", "International Sp. z o.o.",
  ];

  const companies = [];
  const usedNames = new Set();
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(1);

  for (let i = 0; i < count; i++) {
    let name;
    do {
      name = pick(polishCompanyPrefixes) + pick(["a", "o", "ex", "is", "um", "en", "ia"]) + " " + pick(companySuffixes);
    } while (usedNames.has(name));
    usedNames.add(name);

    const segment = pick(SEGMENTS);
    const subSegment = pick(SUB_SEGMENTS[segment]);
    const isPublic = Math.random() < 0.12;
    const revenue = rand(50, 2000);
    const priority = revenue > 200 ? "P1 - High Priority" : Math.random() < 0.55 ? "P1 - High Priority" : "P2 - Opportunistic";

    companies.push({
      id: i + 1,
      nip: `${rand(100, 999)}-${rand(10, 99)}-${rand(10, 99)}-${rand(100, 999)}`,
      name,
      segment,
      subSegment,
      region: pick(REGIONS),
      ownership: isPublic ? "Public" : "Private",
      priority,
      status: pick(STATUSES),
      revenue,
      profit: randFloat(1, 18),
      outsourcingPropensity: pick(["High", "Medium", "Low"]),
      potentialSpend: randFloat(0.2, 8),
      employees: rand(80, 12000),
      sites: rand(1, 45),
      businessScale: pick(["Large", "Mid-Market", "SME"]),
      avgSiteSize: rand(500, 25000),
      prioritizedRegion: Math.random() < 0.6,
      procurementCentralization: pick(["Centralized", "Decentralized", "Hybrid"]),
      providerStickiness: pick(["High", "Medium", "Low"]),
      existingRelationship: Math.random() < 0.15,
      linkedinUrl: "",
      email: "",
      phone: "",
    });
  }
  return companies;
}

const ALL_COMPANIES = generateCompanies(1390);

// ─── Waterfall data from slide ──────────────────────────────────────────
const WATERFALL_STEPS = [
  { label: "Active NIP codes\n(rev. >50m€)", value: 4344, type: "total" },
  { label: "Non-priority\nsegments", value: -894, type: "decrease" },
  { label: "Priority\nsegments", value: 3450, type: "subtotal" },
  { label: "Not mapped", value: -261, type: "decrease" },
  { label: "P2 -\nOpportunistic", value: -1613, type: "decrease" },
  { label: "P1 - High\npriority", value: 1576, type: "subtotal" },
  { label: "Public", value: -186, type: "decrease" },
  { label: "Private\n(Hunt scope)", value: 1390, type: "final" },
];

const SEGMENT_BREAKDOWN = [
  { segment: "Industrial Production", newSuspects: 885, color: "#0891b2" },
  { segment: "Retail & Consumer", newSuspects: 211, color: "#f97316" },
  { segment: "Healthcare & Social", newSuspects: 18, color: "#a78bfa" },
  { segment: "Banking & Financial", newSuspects: 97, color: "#22d3ee" },
  { segment: "Logistics & Transport", newSuspects: 71, color: "#4ade80" },
  { segment: "Real Estate", newSuspects: 74, color: "#f43f5e" },
];

// ─── Waterfall Chart ────────────────────────────────────────────────────
function WaterfallChart() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 420 });

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        if (w > 100) setDims({ w, h: Math.min(420, Math.max(300, w * 0.45)) });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 20, bottom: 80, left: 60 };
    const w = dims.w - margin.left - margin.right;
    const h = dims.h - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(WATERFALL_STEPS.map((d) => d.label)).range([0, w]).padding(0.25);
    const y = d3.scaleLinear().domain([0, 5000]).range([h, 0]);

    // Compute running positions
    let running = 0;
    const bars = WATERFALL_STEPS.map((step) => {
      let y0, y1, displayVal;
      if (step.type === "total" || step.type === "subtotal" || step.type === "final") {
        y0 = 0;
        y1 = Math.abs(step.value);
        displayVal = Math.abs(step.value);
        running = Math.abs(step.value);
      } else {
        y0 = running + step.value;
        y1 = running;
        displayVal = step.value;
        running = y0;
      }
      return { ...step, y0, y1, displayVal };
    });

    // Connector lines
    for (let i = 0; i < bars.length - 1; i++) {
      const curr = bars[i];
      const next = bars[i + 1];
      const fromY = curr.type === "decrease" ? y(curr.y0) : y(curr.y1);
      g.append("line")
        .attr("x1", x(curr.label) + x.bandwidth())
        .attr("x2", x(next.label))
        .attr("y1", fromY)
        .attr("y2", fromY)
        .attr("stroke", "#64748b")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0.5);
    }

    // Bars
    const barGroups = g
      .selectAll(".bar")
      .data(bars)
      .join("g")
      .attr("class", "bar");

    barGroups
      .append("rect")
      .attr("x", (d) => x(d.label))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(Math.max(d.y0, d.y1)))
      .attr("height", 0)
      .attr("rx", 3)
      .attr("fill", (d) => {
        if (d.type === "total") return "#1e293b";
        if (d.type === "subtotal") return "#475569";
        if (d.type === "final") return "#be123c";
        return "#fda4af";
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr("height", (d) => Math.abs(y(d.y0) - y(d.y1)));

    // Value labels
    barGroups
      .append("text")
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y", (d) => y(Math.max(d.y0, d.y1)) - 8)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("font-weight", 700)
      .attr("fill", "#1e293b")
      .attr("opacity", 0)
      .text((d) => {
        const v = d.type === "decrease" ? d.displayVal : d.displayVal;
        return d.type === "decrease" ? v.toLocaleString() : v.toLocaleString();
      })
      .transition()
      .duration(400)
      .delay((d, i) => i * 100 + 600)
      .attr("opacity", 1);

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll("text")
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .style("text-anchor", "middle");

    g.select(".domain").remove();

    // Y axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")))
      .selectAll("text")
      .attr("font-size", "10px")
      .attr("fill", "#94a3b8");

    g.selectAll(".tick line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2");
    g.select(".domain").remove();

    // Gridlines
    g.append("g")
      .selectAll("line")
      .data(y.ticks(5))
      .join("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "#f1f5f9")
      .attr("stroke-width", 1)
      .lower();

  }, [dims]);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <svg ref={svgRef} viewBox={`0 0 ${dims.w} ${dims.h}`} style={{ width: "100%", height: "auto" }} />
    </div>
  );
}

// ─── Segment Donut ──────────────────────────────────────────────────────
function SegmentDonut() {
  const svgRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const size = 260;
    const radius = size / 2;
    const inner = radius * 0.55;
    const g = svg.append("g").attr("transform", `translate(${radius},${radius})`);

    const pie = d3.pie().value((d) => d.newSuspects).sort(null).padAngle(0.02);
    const arc = d3.arc().innerRadius(inner).outerRadius(radius - 4);
    const arcHover = d3.arc().innerRadius(inner).outerRadius(radius);

    const arcs = g.selectAll("path").data(pie(SEGMENT_BREAKDOWN)).join("path");

    arcs
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .attr("opacity", 0.9)
      .on("mouseenter", function (event, d) {
        d3.select(this).transition().duration(200).attr("d", arcHover).attr("opacity", 1);
        setHovered(d.data);
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(200).attr("d", arc).attr("opacity", 0.9);
        setHovered(null);
      });

    // Center text
    g.append("text").attr("text-anchor", "middle").attr("dy", "-0.3em").attr("font-size", "28px").attr("font-weight", 800).attr("fill", "#1e293b").text("1,356");
    g.append("text").attr("text-anchor", "middle").attr("dy", "1.2em").attr("font-size", "11px").attr("fill", "#94a3b8").attr("letter-spacing", "0.05em").text("NEW SUSPECTS");
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <svg ref={svgRef} viewBox="0 0 260 260" style={{ width: "220px", height: "220px" }} />
      {hovered && (
        <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", fontWeight: 600, color: "#1e293b", border: `2px solid ${hovered.color}` }}>
          {hovered.segment}: {hovered.newSuspects} suspects
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center" }}>
        {SEGMENT_BREAKDOWN.map((s) => (
          <div key={s.segment} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#64748b" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block", flexShrink: 0 }} />
            {s.segment}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────────
function KPI({ label, value, sub, accent }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "20px 22px",
        borderLeft: `4px solid ${accent || "#be123c"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        flex: "1 1 180px",
        minWidth: "160px",
      }}
    >
      <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: "#64748b", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Table ──────────────────────────────────────────────────────────────
const COLS = [
  { key: "nip", label: "NIP", w: 130 },
  { key: "name", label: "Company Name", w: 200 },
  { key: "segment", label: "Segment", w: 170 },
  { key: "subSegment", label: "Sub-segment", w: 150 },
  { key: "region", label: "Region", w: 130 },
  { key: "ownership", label: "Public/Private", w: 105 },
  { key: "priority", label: "Priority", w: 140 },
  { key: "status", label: "Status", w: 130 },
  { key: "revenue", label: "Revenue (m€)", w: 110 },
  { key: "profit", label: "Profit (%)", w: 85 },
  { key: "outsourcingPropensity", label: "Outsourcing", w: 100 },
  { key: "potentialSpend", label: "Potential Spend (m€)", w: 140 },
  { key: "employees", label: "Employees", w: 95 },
  { key: "sites", label: "Sites in PL", w: 85 },
  { key: "businessScale", label: "Business Scale", w: 115 },
];

function StatusBadge({ status }) {
  const colors = {
    "New Suspect": { bg: "#fef3c7", text: "#92400e", border: "#fbbf24" },
    "Lost Prospect": { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
    "Lost Client": { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
    "Current Client": { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  };
  const c = colors[status] || { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const isP1 = priority.includes("P1");
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 700,
        background: isP1 ? "#be123c" : "#f1f5f9",
        color: isP1 ? "#fff" : "#64748b",
        whiteSpace: "nowrap",
      }}
    >
      {isP1 ? "P1 — High" : "P2 — Opp."}
    </span>
  );
}

function PropensityDot({ value }) {
  const color = value === "High" ? "#16a34a" : value === "Medium" ? "#f59e0b" : "#ef4444";
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "12px" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      {value}
    </span>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────
export default function HuntListApp() {
  const [view, setView] = useState("dashboard"); // dashboard | table
  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [prioFilter, setPrioFilter] = useState("All");
  const [sortKey, setSortKey] = useState("revenue");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const filtered = useMemo(() => {
    let data = [...ALL_COMPANIES];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((c) => c.name.toLowerCase().includes(q) || c.nip.includes(q));
    }
    if (segFilter !== "All") data = data.filter((c) => c.segment === segFilter);
    if (statusFilter !== "All") data = data.filter((c) => c.status === statusFilter);
    if (prioFilter !== "All") data = data.filter((c) => c.priority === prioFilter);
    data.sort((a, b) => {
      let av = a[sortKey],
        bv = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [search, segFilter, statusFilter, prioFilter, sortKey, sortDir]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  const avgRevenue = (filtered.reduce((s, c) => s + c.revenue, 0) / (filtered.length || 1)).toFixed(0);
  const p1Count = filtered.filter((c) => c.priority.includes("P1")).length;
  const newSuspects = filtered.filter((c) => c.status === "New Suspect").length;

  // ── Styles ──
  const fontStack = "'DM Sans', 'Segoe UI', system-ui, -apple-system, sans-serif";

  return (
    <div
      style={{
        fontFamily: fontStack,
        background: "#f8fafc",
        minHeight: "100vh",
        color: "#1e293b",
      }}
    >
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ─── Header ─── */}
      <header
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          padding: "28px 36px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: "8px", background: "#be123c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 16 }}>
              AP
            </div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Hunt List — Atalian Poland
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", marginTop: 4 }}>
            Companies in Poland with &gt;50m€ FY24 revenue · Prioritized segments · P1 scope
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["dashboard", "table"].map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setPage(0); }}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: fontStack,
                background: view === v ? "#be123c" : "rgba(255,255,255,0.08)",
                color: view === v ? "#fff" : "#94a3b8",
                transition: "all 0.2s",
              }}
            >
              {v === "dashboard" ? "📊 Dashboard" : "📋 Full List"}
            </button>
          ))}
        </div>
      </header>

      <main style={{ padding: "24px 32px 48px", maxWidth: 1440, margin: "0 auto" }}>
        {/* ─── KPI Row ─── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <KPI label="Total Companies" value={filtered.length.toLocaleString()} sub="In current scope" accent="#1e293b" />
          <KPI label="P1 — High Priority" value={p1Count.toLocaleString()} sub={`${((p1Count / (filtered.length || 1)) * 100).toFixed(0)}% of scope`} accent="#be123c" />
          <KPI label="New Suspects" value={newSuspects.toLocaleString()} sub="Untouched prospects" accent="#f59e0b" />
          <KPI label="Avg. Revenue" value={`${avgRevenue}m€`} sub="Across filtered scope" accent="#0891b2" />
        </div>

        {view === "dashboard" ? (
          /* ─── Dashboard View ─── */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
            <div style={{ background: "#fff", borderRadius: "14px", padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                Hunt List Scope — Waterfall
              </h2>
              <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#94a3b8" }}>
                From total NIP codes to private P1 hunt scope
              </p>
              <WaterfallChart />
            </div>
            <div style={{ background: "#fff", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                New Suspects by Segment
              </h2>
              <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
                Breakdown of 1,356 new suspects
              </p>
              <SegmentDonut />
            </div>

            {/* Segment bar chart */}
            <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: "14px", padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>Prospect Distribution by Segment & Status</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {SEGMENTS.map((seg) => {
                  const companies = ALL_COMPANIES.filter((c) => c.segment === seg);
                  const total = companies.length;
                  const statusCounts = STATUSES.map((st) => ({ status: st, count: companies.filter((c) => c.status === st).length }));
                  const statusColors = { "New Suspect": "#fbbf24", "Lost Prospect": "#fca5a5", "Lost Client": "#f9a8d4", "Current Client": "#6ee7b7" };
                  return (
                    <div key={seg} style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{seg}</div>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: "#be123c", marginBottom: 8 }}>{total}</div>
                      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 1 }}>
                        {statusCounts.map((sc) => (
                          <div
                            key={sc.status}
                            style={{
                              flex: sc.count,
                              background: statusColors[sc.status],
                              borderRadius: 2,
                            }}
                            title={`${sc.status}: ${sc.count}`}
                          />
                        ))}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", marginTop: 6 }}>
                        {statusCounts.map((sc) => (
                          <span key={sc.status} style={{ fontSize: "10px", color: "#94a3b8" }}>
                            {sc.status.replace("New ", "N.").replace("Lost ", "L.").replace("Current ", "C.")}: {sc.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ─── Table View ─── */
          <div>
            {/* Filters */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 18,
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Search company or NIP…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  fontFamily: fontStack,
                  width: 240,
                  outline: "none",
                  background: "#fff",
                }}
              />
              {[
                { val: segFilter, set: setSegFilter, opts: ["All", ...SEGMENTS], label: "Segment" },
                { val: statusFilter, set: setStatusFilter, opts: ["All", ...STATUSES], label: "Status" },
                { val: prioFilter, set: setPrioFilter, opts: ["All", ...PRIORITIES], label: "Priority" },
              ].map(({ val, set, opts, label }) => (
                <select
                  key={label}
                  value={val}
                  onChange={(e) => { set(e.target.value); setPage(0); }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    fontFamily: fontStack,
                    background: "#fff",
                    color: "#1e293b",
                    cursor: "pointer",
                  }}
                >
                  {opts.map((o) => (
                    <option key={o} value={o}>
                      {o === "All" ? `${label}: All` : o}
                    </option>
                  ))}
                </select>
              ))}
              <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "auto" }}>
                Showing {paged.length} of {filtered.length} companies
              </span>
            </div>

            {/* Table */}
            <div
              style={{
                background: "#fff",
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                border: "1px solid #f1f5f9",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr>
                      {COLS.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          style={{
                            padding: "12px 14px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: sortKey === col.key ? "#be123c" : "#94a3b8",
                            borderBottom: "2px solid #f1f5f9",
                            cursor: "pointer",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                            minWidth: col.w,
                            background: "#fafbfc",
                            position: "sticky",
                            top: 0,
                          }}
                        >
                          {col.label} {sortKey === col.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((c, i) => (
                      <tr
                        key={c.id}
                        style={{
                          background: i % 2 === 0 ? "#fff" : "#fafbfc",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafbfc")}
                      >
                        {COLS.map((col) => (
                          <td
                            key={col.key}
                            style={{
                              padding: "10px 14px",
                              borderBottom: "1px solid #f1f5f9",
                              whiteSpace: "nowrap",
                              color: "#334155",
                            }}
                          >
                            {col.key === "status" ? (
                              <StatusBadge status={c[col.key]} />
                            ) : col.key === "priority" ? (
                              <PriorityBadge priority={c[col.key]} />
                            ) : col.key === "outsourcingPropensity" ? (
                              <PropensityDot value={c[col.key]} />
                            ) : col.key === "revenue" || col.key === "potentialSpend" ? (
                              <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{c[col.key]}</span>
                            ) : col.key === "profit" ? (
                              <span style={{ fontVariantNumeric: "tabular-nums" }}>{c[col.key]}%</span>
                            ) : col.key === "employees" || col.key === "sites" ? (
                              <span style={{ fontVariantNumeric: "tabular-nums" }}>{c[col.key].toLocaleString()}</span>
                            ) : col.key === "name" ? (
                              <span style={{ fontWeight: 600, color: "#0f172a" }}>{c[col.key]}</span>
                            ) : (
                              c[col.key]
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 18 }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "7px",
                  border: "1px solid #e2e8f0",
                  background: page === 0 ? "#f8fafc" : "#fff",
                  cursor: page === 0 ? "default" : "pointer",
                  fontSize: "12px",
                  fontFamily: fontStack,
                  color: page === 0 ? "#cbd5e1" : "#1e293b",
                  fontWeight: 600,
                }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                Page {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "7px",
                  border: "1px solid #e2e8f0",
                  background: page >= totalPages - 1 ? "#f8fafc" : "#fff",
                  cursor: page >= totalPages - 1 ? "default" : "pointer",
                  fontSize: "12px",
                  fontFamily: fontStack,
                  color: page >= totalPages - 1 ? "#cbd5e1" : "#1e293b",
                  fontWeight: 600,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "16px", fontSize: "11px", color: "#cbd5e1", borderTop: "1px solid #f1f5f9" }}>
        © Simon-Kucher · Atalian International × Simon-Kucher · Commercial Strategy — Hunt List Tool (POC)
      </footer>
    </div>
  );
}

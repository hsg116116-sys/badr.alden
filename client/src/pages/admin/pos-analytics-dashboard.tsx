import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

/* ── Design tokens ─────────────────────────────── */
const C = {
  bg:     "#0d0d0d",
  card:   "#1a1a1a",
  card2:  "#161616",
  border: "rgba(255,255,255,0.08)",
  green:  "#10b981",
  greenL: "#34d399",
  red:    "#ef4444",
  amber:  "#f59e0b",
  blue:   "#3b82f6",
  purple: "#8b5cf6",
  gray:   "#9ca3af",
};

const PIE_COLORS = [C.green, "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#84cc16"];
const PERIOD_MAP: Record<string, string> = { day: "اليوم", week: "الأسبوع", month: "الشهر", year: "السنة" };
const CHART_MAP: Record<string, string> = { days: "أيام", weeks: "أسابيع", months: "شهور" };

/* ── formatters ─────────────────────────────────── */
function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " م";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + " ألف";
  return Math.round(n).toLocaleString("ar-EG");
}
function fmt(n: number) { return Math.round(n).toLocaleString("ar-EG"); }
function todayAr() {
  return new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

/* ── Dark Tooltip ────────────────────────────────── */
function DarkTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1f1f1f", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", direction: "rtl" }}>
      <p style={{ color: C.gray, fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 700, fontSize: 13 }}>
          {p.name}: {fmt(p.value)} ج.م
        </p>
      ))}
    </div>
  );
}

function DarkTipBar({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1f1f1f", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", direction: "rtl" }}>
      <p style={{ color: C.gray, fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>{payload[0]?.value} فاتورة</p>
    </div>
  );
}

/* ── Pill Button ─────────────────────────────────── */
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? C.green : "rgba(255,255,255,0.06)",
        color: active ? "#fff" : C.gray,
        border: "none",
        borderRadius: 999,
        padding: "8px 20px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );
}

/* ── KPI Card ────────────────────────────────────── */
function KPI({ label, value, icon, iconBg, loading }: {
  label: string; value: string; icon: string; iconBg: string; loading?: boolean;
}) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ background: iconBg, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</span>
        <span style={{ color: C.gray, fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
      </div>
      {loading ? (
        <div style={{ height: 28, background: "rgba(255,255,255,0.06)", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
      ) : (
        <p style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: 0 }}>{value}</p>
      )}
    </div>
  );
}

/* ── Comparison Card ─────────────────────────────── */
function CmpCard({ label, current, previous, growth, unit = "ج.م", icon }: {
  label: string; current: number; previous: number; growth: number; unit?: string; icon: string;
}) {
  const up = growth >= 0;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{
          background: up ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          color: up ? C.greenL : C.red,
          borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700,
        }}>
          {up ? "▲" : "▼"} {Math.abs(growth)}%
        </span>
      </div>
      <p style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>
        {fmt(current)} {unit !== "عدد" && <span style={{ fontSize: 12, fontWeight: 400, color: C.gray }}>ج.م</span>}
      </p>
      <p style={{ color: C.gray, fontSize: 11, margin: "0 0 12px" }}>{label}</p>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 11, color: C.gray }}>
        <span>السابق: <strong style={{ color: "#ccc" }}>{unit === "عدد" ? fmt(previous) : fmt(previous) + " ج.م"}</strong></span>
        <span>{up ? "↑" : "↓"} نمو</span>
      </div>
    </div>
  );
}

/* ── Section Title ───────────────────────────────── */
function Title({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <p style={{ color: "#fff", fontWeight: 900, fontSize: 15, margin: 0 }}>{text}</p>
        {sub && <p style={{ color: C.gray, fontSize: 11, margin: 0 }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════ */
export default function PosAnalyticsDashboard() {
  const [period, setPeriod] = useState<"day"|"week"|"month"|"year">("day");
  const [chartP, setChartP] = useState<"days"|"weeks"|"months">("months");
  const [topP, setTopP] = useState<"day"|"week"|"month"|"year">("month");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/pos/analytics/dashboard", period],
    queryFn: () => apiRequest("GET", `/api/pos/analytics/dashboard?period=${period}`).then(r => r.json()),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: topData } = useQuery({
    queryKey: ["/api/pos/analytics/dashboard-top", topP],
    queryFn: () => apiRequest("GET", `/api/pos/analytics/dashboard?period=${topP}`).then(r => r.json()),
    staleTime: 2 * 60 * 1000,
    enabled: topP !== period,
  });

  const d = topP === period ? data : (topData || data);

  const s   = data?.summary;
  const cmp = data?.comparison;
  const ps  = data?.periodStats;
  const sc  = data?.salesChart?.[chartP] || [];
  const tp  = d?.topProductsByPeriod || [];
  const tc  = data?.topCustomers || [];
  const cats = d?.categoryBreakdown || [];
  const pay  = data?.paymentMethods || [];
  const hourly = data?.hourlyTrend || [];
  const alerts = data?.alerts || [];
  const inv  = data?.inventorySummary;
  const pl   = data?.profitLoss;
  const loading = isLoading;

  const baseStyle: React.CSSProperties = {
    background: C.bg,
    color: "#fff",
    marginLeft: -24, marginRight: -24, marginTop: -24,
    padding: "28px 24px 48px",
    minHeight: "100vh",
    direction: "rtl",
    fontFamily: "inherit",
  };

  if (error) return (
    <div style={{ ...baseStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
        <p style={{ color: "#fff", fontWeight: 700 }}>تعذّر تحميل بيانات التحليلات</p>
        <p style={{ color: C.gray, fontSize: 12, marginTop: 6 }}>{(error as any).message}</p>
      </div>
    </div>
  );

  return (
    <div style={baseStyle}>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["day","week","month","year"] as const).map(p => (
            <Pill key={p} label={PERIOD_MAP[p]} active={period === p} onClick={() => setPeriod(p)} />
          ))}
        </div>
        <div style={{ textAlign: "left" }}>
          <p style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: 0 }}>لوحة القيادة</p>
          <p style={{ color: C.gray, fontSize: 12, margin: 0 }}>{todayAr()}</p>
        </div>
      </div>

      {/* ══ ROW 1 — KPI Cards ══════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <KPI label="إجمالي الإيرادات" value={s ? fmtNum(s.totalRevenue) + " ج.م" : "—"} icon="💰" iconBg="rgba(16,185,129,0.2)" loading={loading} />
        <KPI label="صافي الربح" value={s ? fmtNum(s.netProfit) + " ج.م" : "—"} icon="📈" iconBg="rgba(52,211,153,0.2)" loading={loading} />
        <KPI label="مبيعات اليوم" value={s ? fmtNum(s.todayRevenue) + " ج.م" : "—"} icon="📅" iconBg="rgba(59,130,246,0.2)" loading={loading} />
        <KPI label="عدد الفواتير" value={s ? fmt(s.invoiceCount) : "—"} icon="🧾" iconBg="rgba(99,102,241,0.2)" loading={loading} />
        <KPI label="العملاء" value={s ? fmt(s.customerCount) : "—"} icon="👥" iconBg="rgba(139,92,246,0.2)" loading={loading} />
        <KPI label="المنتجات" value={s ? fmt(s.productCount) : "—"} icon="📦" iconBg="rgba(245,158,11,0.2)" loading={loading} />
        <KPI label="إجمالي المشتريات" value={s ? fmtNum(s.totalPurchases) + " ج.م" : "—"} icon="🛒" iconBg="rgba(236,72,153,0.2)" loading={loading} />
        <KPI label="مخزون منخفض" value={s ? fmt(s.lowStockCount) : "—"} icon="⚠️" iconBg={`rgba(239,68,68,${(s?.lowStockCount ?? 0) > 0 ? "0.25" : "0.1"})`} loading={loading} />
        <KPI label="المستحقات" value={s ? fmtNum(s.receivables) + " ج.م" : "—"} icon="💳" iconBg="rgba(107,114,128,0.2)" loading={loading} />
      </div>

      {/* ══ ROW 2 — Comparison Cards ══════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
        <CmpCard label="الإيرادات" current={cmp?.revenue.current ?? 0} previous={cmp?.revenue.previous ?? 0} growth={cmp?.revenue.growth ?? 0} icon="💰" />
        <CmpCard label="الأرباح" current={cmp?.profit.current ?? 0} previous={cmp?.profit.previous ?? 0} growth={cmp?.profit.growth ?? 0} icon="📈" />
        <CmpCard label="عدد الفواتير" current={cmp?.invoices.current ?? 0} previous={cmp?.invoices.previous ?? 0} growth={cmp?.invoices.growth ?? 0} unit="عدد" icon="🧾" />
        <CmpCard label="متوسط الفاتورة" current={cmp?.avgOrder.current ?? 0} previous={cmp?.avgOrder.previous ?? 0} growth={cmp?.avgOrder.growth ?? 0} icon="🎯" />
      </div>

      {/* ══ ROW 3 — Sales Chart + Period Stats ════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, marginBottom: 28 }}>
        {/* Area Chart */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <Title icon="📅" text="المبيعات والمشتريات" />
            <div style={{ display: "flex", gap: 6 }}>
              {(["days","weeks","months"] as const).map(cp => (
                <button key={cp} onClick={() => setChartP(cp)} style={{
                  background: chartP === cp ? C.green : "rgba(255,255,255,0.06)",
                  color: chartP === cp ? "#fff" : C.gray,
                  border: "none", borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  {CHART_MAP[cp]}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sc} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: C.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: C.gray, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => fmtNum(v)} />
              <Tooltip content={<DarkTip />} />
              <Area type="monotone" dataKey="sales" name="المبيعات" stroke={C.green} strokeWidth={2} fill="url(#gS)" dot={false} />
              <Area type="monotone" dataKey="purchases" name="المشتريات" stroke={C.blue} strokeWidth={1.5} fill="url(#gP)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Period Stats */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <Title icon="📊" text={`إحصائيات ${PERIOD_MAP[period]}`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "إجمالي المبيعات", value: fmt(ps?.totalSales ?? 0) + " ج.م", color: C.green },
              { label: "إجمالي المشتريات", value: fmt(ps?.totalPurchases ?? 0) + " ج.م", color: C.blue },
              { label: "عدد الفواتير", value: fmt(ps?.invoiceCount ?? 0), color: C.purple },
              { label: "متوسط الفاتورة", value: fmt(ps?.avgOrderValue ?? 0) + " ج.م", color: C.amber },
            ].map(item => (
              <div key={item.label} style={{ background: C.card2, borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.gray, fontSize: 12 }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 800, fontSize: 13 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ROW 4 — Top Products + Category Pie ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 28 }}>
        {/* Top Products */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <Title icon="📈" text="أفضل المنتجات مبيعاً" />
            <div style={{ display: "flex", gap: 6 }}>
              {(["day","week","month","year"] as const).map(p => (
                <button key={p} onClick={() => setTopP(p)} style={{
                  background: topP === p ? C.green : "rgba(255,255,255,0.06)",
                  color: topP === p ? "#fff" : C.gray,
                  border: "none", borderRadius: 999, padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}>
                  {PERIOD_MAP[p]}
                </button>
              ))}
            </div>
          </div>
          {tp.length === 0 ? (
            <p style={{ color: C.gray, textAlign: "center", padding: "30px 0" }}>لا توجد بيانات للفترة المحددة</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tp.map((p: any) => {
                const maxRev = tp[0]?.revenue || 1;
                const pct = (p.revenue / maxRev) * 100;
                return (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0,
                      background: p.rank <= 3 ? C.amber : "rgba(255,255,255,0.08)",
                      color: p.rank <= 3 ? "#000" : C.gray,
                    }}>{p.rank}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                        <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        <div style={{ textAlign: "left", flexShrink: 0, marginRight: 8 }}>
                          <span style={{ color: C.greenL, fontWeight: 800, fontSize: 13 }}>{fmtNum(p.revenue)} ج.م</span>
                          <span style={{ color: C.gray, fontSize: 10, marginRight: 6 }}>{p.qty % 1 === 0 ? fmt(p.qty) : p.qty.toFixed(1)} وحدة</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: C.green, borderRadius: 4, transition: "width .4s" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Donut */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <Title icon="🕐" text="المبيعات حسب الفئة" />
          {cats.length === 0 ? (
            <p style={{ color: C.gray, textAlign: "center", padding: "30px 0" }}>لا توجد بيانات</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={cats} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" nameKey="name">
                    {cats.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmt(v) + " ج.م", ""]} contentStyle={{ background: "#1f1f1f", border: `1px solid ${C.border}`, borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {cats.slice(0, 5).map((c: any, i: number) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ color: C.gray, fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 11 }}>{fmt(c.value)} ج.م</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ ROW 5 — Payment Methods + Hourly ════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* Payment Methods */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <Title icon="💳" text="طرق الدفع" sub={PERIOD_MAP[period]} />
          {pay.length === 0 ? (
            <p style={{ color: C.gray, textAlign: "center", padding: "30px 0" }}>لا توجد بيانات</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {pay.map((p: any, i: number) => (
                <div key={p.method}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{p.method}</span>
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <span style={{ color: C.greenL, fontWeight: 800, fontSize: 14 }}>{fmtNum(p.amount)} ج.م</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ color: C.gray, fontSize: 11 }}>{p.pct}%  •  {p.count} فاتورة</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.pct}%`, background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 6, transition: "width .4s" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hourly Trend */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <Title icon="🕐" text="توزيع المبيعات حسب الساعة" sub="أوقات الذروة" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourly} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: C.gray, fontSize: 9 }}
                tickLine={false} axisLine={false}
                tickFormatter={h => h % 3 === 0 ? `${String(h).padStart(2,"0")}:00` : ""}
              />
              <YAxis tick={{ fill: C.gray, fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip content={<DarkTipBar />} />
              <Bar dataKey="count" name="الفواتير" radius={[3,3,0,0]}>
                {hourly.map((h: any, i: number) => {
                  const max = Math.max(...hourly.map((x: any) => x.count));
                  return <Cell key={i} fill={h.count === max && max > 0 ? C.amber : C.green} fillOpacity={h.count > 0 ? 1 : 0.2} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══ ROW 6 — P&L Summary + Monthly Chart ════ */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 28 }}>
        {/* P&L Summary Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <Title icon="📋" text="ملخص الأرباح والخسائر" />
          {pl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "إجمالي الإيرادات", value: pl.summary.revenue, color: C.greenL, prefix: "" },
                { label: "تكلفة البضاعة", value: pl.summary.cogs, color: C.red, prefix: "-" },
                { label: "إجمالي الربح", value: pl.summary.grossProfit, color: C.blue, prefix: "" },
                { label: "المصروفات", value: pl.summary.expenses, color: "#f97316", prefix: pl.summary.expenses > 0 ? "-" : "" },
                { label: "صافي الربح", value: pl.summary.netProfit, color: pl.summary.netProfit >= 0 ? C.greenL : C.red, prefix: "" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.card2, borderRadius: 10 }}>
                  <span style={{ color: C.gray, fontSize: 11 }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: 800, fontSize: 12 }}>
                    {row.prefix}{fmtNum(Math.abs(row.value))} ج.م
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(16,185,129,0.1)", borderRadius: 10, border: `1px solid rgba(16,185,129,0.2)` }}>
                <span style={{ color: C.greenL, fontSize: 12, fontWeight: 700 }}>هامش الربح</span>
                <span style={{ color: C.greenL, fontWeight: 900, fontSize: 15 }}>{pl.summary.margin}%</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} style={{ height: 38, background: C.card2, borderRadius: 10, opacity: 0.5 }} />
              ))}
            </div>
          )}
        </div>

        {/* Monthly Chart */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <Title icon="📈" text="الأداء المالي الشهري" sub="آخر 6 أشهر" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pl?.monthly || []} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: C.gray, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => fmtNum(v)} />
              <Tooltip content={<DarkTip />} />
              <Legend wrapperStyle={{ color: C.gray, fontSize: 11 }} />
              <Bar dataKey="revenue" name="الإيرادات" fill={C.amber} radius={[3,3,0,0]} />
              <Bar dataKey="cogs" name="التكلفة" fill={C.red} radius={[3,3,0,0]} fillOpacity={0.8} />
              <Bar dataKey="netProfit" name="صافي الربح" fill={C.green} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══ ROW 7 — Top Customers + Inventory ══════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* Top Customers */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <Title icon="👥" text="أفضل العملاء" sub="بناءً على إجمالي الإنفاق" />
          {tc.length === 0 ? (
            <p style={{ color: C.gray, textAlign: "center", padding: "30px 0" }}>لا توجد بيانات</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tc.map((c: any, i: number) => {
                const maxSpent = tc[0]?.totalSpent || 1;
                const medals = ["🥇","🥈","🥉"];
                return (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{medals[i] || (i+1)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                        <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                        <div style={{ textAlign: "left", flexShrink: 0 }}>
                          <span style={{ color: C.greenL, fontWeight: 800, fontSize: 13 }}>{fmtNum(c.totalSpent)} ج.م</span>
                          <span style={{ color: C.gray, fontSize: 10, marginRight: 8 }}>{c.orders} طلب</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4 }}>
                        <div style={{ height: "100%", width: `${(c.totalSpent / maxSpent) * 100}%`, background: C.purple, borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inventory Summary */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <Title icon="🏭" text="ملخص المخزون" />
          {inv ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "أنواع المنتجات", value: fmt(inv.total), color: C.blue, bg: "rgba(59,130,246,0.1)" },
                  { label: "إجمالي الوحدات", value: fmt(inv.totalUnits), color: C.purple, bg: "rgba(139,92,246,0.1)" },
                  { label: "قيمة المخزون", value: fmtNum(inv.totalValue) + " ج.م", color: C.amber, bg: "rgba(245,158,11,0.1)" },
                  { label: "منتجات جيدة", value: fmt(inv.good), color: C.green, bg: "rgba(16,185,129,0.1)" },
                ].map(item => (
                  <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: "12px 14px", border: `1px solid ${item.color}22` }}>
                    <p style={{ color: item.color, fontSize: 17, fontWeight: 900, margin: "0 0 4px" }}>{item.value}</p>
                    <p style={{ color: C.gray, fontSize: 10, margin: 0 }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 11, color: C.gray }}>
                  <span>توازن المخزون</span>
                  <span>{inv.good} جيد · {inv.low} منخفض · {inv.out} نافد</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden", display: "flex" }}>
                  {inv.total > 0 && <>
                    <div style={{ height: "100%", width: `${(inv.good / inv.total) * 100}%`, background: C.green }} />
                    <div style={{ height: "100%", width: `${(inv.low / inv.total) * 100}%`, background: C.amber }} />
                    <div style={{ height: "100%", width: `${(inv.out / inv.total) * 100}%`, background: C.red }} />
                  </>}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11 }}>
                  {[{c: C.green, l: "جيد"},{c: C.amber, l: "منخفض"},{c: C.red, l: "نافد"}].map(x => (
                    <span key={x.l} style={{ display: "flex", alignItems: "center", gap: 5, color: C.gray }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: x.c }} />{x.l}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Array.from({length: 4}).map((_, i) => <div key={i} style={{ height: 64, background: C.card2, borderRadius: 12, opacity: 0.5 }} />)}
            </div>
          )}
        </div>
      </div>

      {/* ══ ROW 8 — All-Time Products + Alerts ════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* All-Time Top Products */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <Title icon="🏆" text="أكثر المنتجات مبيعاً — كل الوقت" />
          {(data?.topProducts || []).length === 0 ? (
            <p style={{ color: C.gray, textAlign: "center", padding: "30px 0" }}>لا توجد بيانات</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(data?.topProducts || []).map((p: any) => {
                const maxRev = data.topProducts[0]?.revenue || 1;
                return (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0,
                      background: p.rank <= 3 ? C.amber : "rgba(255,255,255,0.08)",
                      color: p.rank <= 3 ? "#000" : C.gray,
                    }}>{p.rank}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        <div style={{ flexShrink: 0 }}>
                          <span style={{ color: C.greenL, fontWeight: 800, fontSize: 12 }}>{fmtNum(p.revenue)} ج.م</span>
                          <span style={{ color: C.gray, fontSize: 10, marginRight: 6 }}>{fmt(p.qty)} وحدة</span>
                        </div>
                      </div>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${(p.revenue / maxRev) * 100}%`, background: C.green, borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "22px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Title icon="🚨" text="تنبيهات المخزون" />
            <span style={{
              background: alerts.length > 0 ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
              color: alerts.length > 0 ? C.red : C.greenL,
              borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700,
            }}>{alerts.length} تنبيه</span>
          </div>
          {alerts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
              <p style={{ color: C.gray, fontSize: 13 }}>المخزون في حالة ممتازة</p>
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.map((a: any, i: number) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: a.type === "error" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                  border: `1px solid ${a.type === "error" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                  borderRadius: 12, padding: "10px 12px",
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{a.type === "error" ? "🔴" : "🟡"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.product}</p>
                    <p style={{ color: C.gray, fontSize: 10, margin: 0 }}>الحد الأدنى: {a.minStock}</p>
                  </div>
                  <span style={{
                    background: a.type === "error" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                    color: a.type === "error" ? C.red : C.amber,
                    fontWeight: 900, fontSize: 14, padding: "3px 10px", borderRadius: 8, flexShrink: 0,
                  }}>{a.stock}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ ROW 9 — Monthly P&L Table ════════════════ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <div>
            <p style={{ color: "#fff", fontWeight: 900, fontSize: 15, margin: 0 }}>تحليل الأرباح الشهري</p>
            <p style={{ color: C.gray, fontSize: 11, margin: 0 }}>آخر 6 أشهر — تقرير مالي تفصيلي</p>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["الشهر","الإيرادات","التكلفة","المصروفات","صافي الربح","الهامش"].map((h, i) => (
                  <th key={h} style={{
                    padding: "12px 20px", textAlign: i === 0 ? "right" : "left",
                    color: C.gray, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap",
                    background: C.card2,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length: 6}).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    {Array.from({length: 6}).map((_, j) => (
                      <td key={j} style={{ padding: "14px 20px" }}>
                        <div style={{ height: 14, background: "rgba(255,255,255,0.06)", borderRadius: 6 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (pl?.monthly || []).map((m: any, idx: number) => (
                <tr key={m.label} style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                }}>
                  <td style={{ padding: "14px 20px", color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>{m.label}</td>
                  <td style={{ padding: "14px 20px", color: C.amber, fontWeight: 700 }}>{fmtNum(m.revenue)} ج.م</td>
                  <td style={{ padding: "14px 20px", color: C.red, fontWeight: 600 }}>-{fmtNum(m.cogs)} ج.م</td>
                  <td style={{ padding: "14px 20px", color: "#f97316", fontWeight: 600 }}>
                    {m.expenses > 0 ? `-${fmtNum(m.expenses)} ج.م` : <span style={{ color: C.gray }}>—</span>}
                  </td>
                  <td style={{ padding: "14px 20px", color: m.netProfit >= 0 ? C.greenL : C.red, fontWeight: 800 }}>
                    {m.netProfit >= 0 ? "" : "-"}{fmtNum(Math.abs(m.netProfit))} ج.م
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      background: m.margin >= 20 ? "rgba(16,185,129,0.15)" : m.margin >= 10 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                      color: m.margin >= 20 ? C.greenL : m.margin >= 10 ? C.amber : C.red,
                      padding: "3px 10px", borderRadius: 999, fontWeight: 700, fontSize: 12,
                    }}>{m.margin}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
            {pl?.monthly?.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: `2px solid ${C.border}`, background: "rgba(16,185,129,0.05)" }}>
                  <td style={{ padding: "14px 20px", color: C.greenL, fontWeight: 900 }}>الإجمالي</td>
                  <td style={{ padding: "14px 20px", color: C.amber, fontWeight: 900 }}>{fmtNum(pl.monthly.reduce((a: number, m: any) => a + m.revenue, 0))} ج.م</td>
                  <td style={{ padding: "14px 20px", color: C.red, fontWeight: 800 }}>-{fmtNum(pl.monthly.reduce((a: number, m: any) => a + m.cogs, 0))} ج.م</td>
                  <td style={{ padding: "14px 20px", color: "#f97316", fontWeight: 800 }}>
                    {pl.monthly.some((m: any) => m.expenses > 0) ? `-${fmtNum(pl.monthly.reduce((a: number, m: any) => a + m.expenses, 0))} ج.م` : <span style={{ color: C.gray }}>—</span>}
                  </td>
                  <td style={{ padding: "14px 20px", color: pl.summary.netProfit >= 0 ? C.greenL : C.red, fontWeight: 900, fontSize: 15 }}>
                    {pl.summary.netProfit >= 0 ? "" : "-"}{fmtNum(Math.abs(pl.monthly.reduce((a: number, m: any) => a + m.netProfit, 0)))} ج.م
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      background: pl.summary.margin >= 20 ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                      color: pl.summary.margin >= 20 ? C.greenL : C.amber,
                      padding: "3px 10px", borderRadius: 999, fontWeight: 900, fontSize: 13,
                    }}>{pl.summary.margin}%</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
}

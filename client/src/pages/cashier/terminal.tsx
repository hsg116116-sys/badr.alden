import { useState, useEffect, useRef, useCallback } from "react";
import { posClient } from "@/lib/pos-client";
import { motion, AnimatePresence } from "framer-motion";

/* ── Design tokens ─────────────────────────── */
const C = {
  bg:      "#0a0a0a",
  card:    "#141414",
  card2:   "#1c1c1c",
  border:  "rgba(255,255,255,0.07)",
  green:   "#10b981",
  greenL:  "#34d399",
  red:     "#ef4444",
  amber:   "#f59e0b",
  blue:    "#3b82f6",
  gray:    "#6b7280",
  grayL:   "#9ca3af",
};

const CASHIERS = [
  { id: 1, name: "اسلام",    station: "كاشير ١", color: C.green,  emoji: "🟢" },
  { id: 2, name: "كاشير ٢",  station: "كاشير ٢", color: C.blue,   emoji: "🔵" },
  { id: 3, name: "كاشير ٣",  station: "كاشير ٣", color: C.amber,  emoji: "🟡" },
];

function fmt(n: number) { return Math.round(n).toLocaleString("ar-EG"); }

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `منذ ${diff} ثانية`;
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  return `منذ ${Math.floor(diff / 3600)} ساعة`;
}

/* ─── Order Notification Overlay ───────────── */
function OrderNotificationOverlay({
  notification, activeCashier, onAccept, onReject,
}: {
  notification: any;
  activeCashier: number;
  onAccept: (cashierId: number) => void;
  onReject: () => void;
}) {
  const [countdown, setCountdown] = useState(60);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { onReject(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onReject]);

  const cashier = CASHIERS.find(c => c.id === activeCashier) || CASHIERS[0];
  const items: any[] = (() => {
    try {
      const raw = notification.items;
      if (!raw) return [];
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { return []; }
  })();

  async function handleAccept() {
    setAccepting(true);
    await onAccept(cashier.id);
  }

  const pct = (countdown / 60) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 0, backdropFilter: "blur(8px)",
      }}
    >
      <motion.div
        initial={{ y: "-100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "-100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        style={{
          width: "100%", maxWidth: 680,
          background: C.card,
          borderBottom: `3px solid ${C.green}`,
          borderLeft: `1px solid ${C.border}`,
          borderRight: `1px solid ${C.border}`,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          overflow: "hidden",
          boxShadow: `0 20px 80px rgba(16,185,129,0.25), 0 0 0 1px rgba(16,185,129,0.1)`,
          direction: "rtl",
          fontFamily: "inherit",
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "linear" }}
            style={{ height: "100%", background: pct > 40 ? C.green : pct > 20 ? C.amber : C.red, transition: "background 0.5s" }}
          />
        </div>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)",
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                width: 52, height: 52, borderRadius: 16,
                background: "rgba(16,185,129,0.2)",
                border: `2px solid ${C.green}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26,
              }}
            >🛍️</motion.div>
            <div>
              <p style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: 0 }}>طلب جديد من الموقع!</p>
              <p style={{ color: C.greenL, fontSize: 13, margin: "4px 0 0", fontWeight: 600 }}>
                {cashier.emoji} يُستلم بواسطة: {cashier.name}
              </p>
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ color: C.green, fontSize: 32, fontWeight: 900, margin: 0 }}>
              {fmt(notification.total)} <span style={{ fontSize: 16 }}>ج.م</span>
            </p>
            <p style={{ color: C.gray, fontSize: 12, margin: "4px 0 0" }}>ينتهي خلال {countdown}ث</p>
          </div>
        </div>

        {/* Order Details */}
        <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InfoBlock icon="👤" label="العميل" value={notification.customer_name || "زبون"} />
          <InfoBlock icon="📞" label="الهاتف" value={notification.customer_phone || "—"} />
          <InfoBlock icon="📍" label="العنوان" value={notification.address || "—"} colSpan={2} />
          {notification.notes && <InfoBlock icon="📝" label="ملاحظات" value={notification.notes} colSpan={2} accent />}
        </div>

        {/* Items */}
        <div style={{ padding: "0 24px 16px" }}>
          <p style={{ color: C.grayL, fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            🛒 المنتجات ({items.length} عنصر)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto" }}>
            {items.map((item: any, i: number) => {
              const chips: { label: string; color: string; bg: string; icon: string }[] = [];
              if (item.unit)      chips.push({ icon: "⚖️", label: item.unit,      color: "#60a5fa", bg: "rgba(96,165,250,0.12)" });
              if (item.weight)    chips.push({ icon: "🏋️", label: item.weight,    color: "#a78bfa", bg: "rgba(167,139,250,0.12)" });
              if (item.size)      chips.push({ icon: "📐", label: item.size,      color: "#f472b6", bg: "rgba(244,114,182,0.12)" });
              if (item.badge)     chips.push({ icon: "🏷️", label: item.badge,     color: C.amber,  bg: "rgba(245,158,11,0.12)" });
              if (item.cutting)   chips.push({ icon: "✂️", label: item.cutting,   color: C.amber,  bg: "rgba(245,158,11,0.12)" });
              if (item.packaging) chips.push({ icon: "📦", label: item.packaging, color: "#34d399", bg: "rgba(52,211,153,0.12)" });
              return (
                <div key={i} style={{
                  background: C.card2, borderRadius: 14, padding: "12px 14px",
                  border: `1px solid ${C.border}`,
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  {/* Top row: qty + name + price */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{
                        background: "rgba(16,185,129,0.18)", color: C.green,
                        borderRadius: 10, padding: "4px 10px", fontSize: 14, fontWeight: 900,
                        flexShrink: 0, lineHeight: 1.4,
                      }}>×{item.quantity}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                          {item.name || item.productName}
                        </p>
                        {item.unit && (
                          <p style={{ color: "#60a5fa", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>
                            الوحدة: {item.unit}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "left", flexShrink: 0 }}>
                      <p style={{ color: C.greenL, fontWeight: 900, fontSize: 14, margin: 0 }}>
                        {fmt((item.price || 0) * (item.quantity || 1))} ج.م
                      </p>
                      <p style={{ color: C.gray, fontSize: 10, margin: "2px 0 0", textAlign: "left" }}>
                        {fmt(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p style={{ color: C.grayL, fontSize: 11, margin: 0, lineHeight: 1.5, borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
                      {item.description}
                    </p>
                  )}

                  {/* Chips row */}
                  {chips.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {chips.map((chip, ci) => (
                        <span key={ci} style={{
                          background: chip.bg, color: chip.color,
                          borderRadius: 999, padding: "3px 9px",
                          fontSize: 11, fontWeight: 700,
                          border: `1px solid ${chip.color}33`,
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                          {chip.icon} {chip.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p style={{
                      color: C.amber, fontSize: 11, margin: 0,
                      background: "rgba(245,158,11,0.08)", borderRadius: 8, padding: "5px 10px",
                      border: `1px solid rgba(245,158,11,0.2)`,
                    }}>
                      📝 {item.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "12px 24px 24px", display: "flex", gap: 12 }}>
          <button
            onClick={handleAccept}
            disabled={accepting}
            style={{
              flex: 1, height: 56, borderRadius: 16,
              background: accepting ? "rgba(16,185,129,0.4)" : `linear-gradient(135deg, ${C.green}, #059669)`,
              color: "#fff", border: "none", fontSize: 17, fontWeight: 900, cursor: "pointer",
              boxShadow: `0 8px 24px rgba(16,185,129,0.4)`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "all .2s",
            }}
          >
            {accepting ? "⏳ جاري الاستلام..." : "✅ استلام الطلب"}
          </button>
          <button
            onClick={onReject}
            style={{
              width: 120, height: 56, borderRadius: 16,
              background: "rgba(239,68,68,0.12)",
              color: C.red, border: `1px solid rgba(239,68,68,0.25)`,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}
          >
            ❌ تجاهل
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoBlock({ icon, label, value, colSpan, accent }: {
  icon: string; label: string; value: string; colSpan?: number; accent?: boolean;
}) {
  return (
    <div style={{
      background: accent ? "rgba(245,158,11,0.08)" : C.card2,
      border: `1px solid ${accent ? "rgba(245,158,11,0.2)" : C.border}`,
      borderRadius: 12, padding: "10px 14px",
      gridColumn: colSpan === 2 ? "span 2" : undefined,
    }}>
      <p style={{ color: C.gray, fontSize: 10, fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {icon} {label}
      </p>
      <p style={{ color: accent ? C.amber : "#fff", fontSize: 13, fontWeight: 600, margin: 0, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{value}</p>
    </div>
  );
}

/* ─── Cashier Station Card ──────────────────── */
function CashierCard({ cashier, isActive, stats, onClick }: {
  cashier: typeof CASHIERS[0];
  isActive: boolean;
  stats: { accepted: number; today: number };
  onClick: () => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: isActive
          ? `linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)`
          : C.card,
        border: `2px solid ${isActive ? cashier.color : C.border}`,
        borderRadius: 20, padding: "24px 20px",
        cursor: "pointer", textAlign: "center",
        boxShadow: isActive ? `0 0 30px rgba(16,185,129,0.15)` : "none",
        transition: "all .3s",
        direction: "rtl",
        position: "relative", overflow: "hidden",
      }}
    >
      {isActive && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          style={{
            position: "absolute", top: -30, right: -30,
            width: 100, height: 100, borderRadius: "50%",
            background: `radial-gradient(circle, ${cashier.color}22 0%, transparent 70%)`,
          }}
        />
      )}
      <div style={{
        width: 70, height: 70, borderRadius: "50%",
        background: isActive ? `rgba(16,185,129,0.2)` : "rgba(255,255,255,0.06)",
        border: `3px solid ${isActive ? cashier.color : "rgba(255,255,255,0.1)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, margin: "0 auto 14px",
        boxShadow: isActive ? `0 0 20px ${cashier.color}44` : "none",
      }}>
        👤
      </div>
      <p style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>{cashier.name}</p>
      <p style={{ color: C.gray, fontSize: 12, margin: "0 0 16px" }}>{cashier.station}</p>

      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 14 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: cashier.color, fontSize: 22, fontWeight: 900, margin: 0 }}>{stats.accepted}</p>
          <p style={{ color: C.gray, fontSize: 10, margin: 0 }}>مستلم</p>
        </div>
        <div style={{ width: 1, background: C.border }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ color: C.amber, fontSize: 22, fontWeight: 900, margin: 0 }}>{stats.today}</p>
          <p style={{ color: C.gray, fontSize: 10, margin: 0 }}>اليوم</p>
        </div>
      </div>

      <div style={{
        background: isActive ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isActive ? "rgba(16,185,129,0.3)" : C.border}`,
        borderRadius: 999, padding: "6px 16px",
        color: isActive ? C.greenL : C.gray,
        fontSize: 12, fontWeight: 700,
      }}>
        {isActive ? "● نشط الآن" : "○ غير نشط"}
      </div>
    </motion.div>
  );
}

/* ─── Notification History Row ──────────────── */
function NotifRow({ n, cashiers }: { n: any; cashiers: typeof CASHIERS }) {
  const cashier = cashiers.find(c => c.id === n.cashier_id);
  const accepted = n.status === "accepted";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 16px",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{accepted ? "✅" : "❌"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {n.customer_name || "زبون"} — {fmt(n.total)} ج.م
        </p>
        <p style={{ color: C.gray, fontSize: 11, margin: 0 }}>
          {timeAgo(n.created_at)} {cashier ? `• ${cashier.name}` : ""}
        </p>
      </div>
      <span style={{
        background: accepted ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
        color: accepted ? C.green : C.red,
        borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>{accepted ? "مستلم" : "مرفوض"}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN CASHIER TERMINAL
════════════════════════════════════════════════ */
export default function CashierTerminal() {
  const [activeCashier, setActiveCashier] = useState(1);
  const [pendingNotif, setPendingNotif] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<number, { accepted: number; today: number }>>({
    1: { accepted: 0, today: 0 },
    2: { accepted: 0, today: 0 },
    3: { accepted: 0, today: 0 },
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* Load history from POS Supabase */
  useEffect(() => {
    posClient
      .from("online_order_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setHistory(data);
          recalcStats(data);
        }
      });
  }, []);

  function recalcStats(data: any[]) {
    const today = new Date().toDateString();
    const s: typeof stats = { 1: { accepted: 0, today: 0 }, 2: { accepted: 0, today: 0 }, 3: { accepted: 0, today: 0 } };
    data.forEach(n => {
      if (!n.cashier_id) return;
      if (n.status === "accepted") {
        s[n.cashier_id].accepted = (s[n.cashier_id].accepted || 0) + 1;
        if (new Date(n.created_at).toDateString() === today)
          s[n.cashier_id].today = (s[n.cashier_id].today || 0) + 1;
      }
    });
    setStats(s);
  }

  /* Real-time subscription */
  useEffect(() => {
    const channel = posClient
      .channel("online_order_notifications_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "online_order_notifications" },
        (payload) => {
          const n = payload.new;
          if (n.status === "pending") {
            setPendingNotif(n);
            playSound();
          }
          setHistory(h => [n, ...h]);
        }
      )
      .subscribe();

    return () => { posClient.removeChannel(channel); };
  }, []);

  function playSound() {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  }

  const handleAccept = useCallback(async (cashierId: number) => {
    if (!pendingNotif) return;
    const cashier = CASHIERS.find(c => c.id === cashierId)!;
    const { error } = await posClient
      .from("online_order_notifications")
      .update({
        status: "accepted",
        cashier_id: cashierId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", pendingNotif.id);

    if (!error) {
      const updated = { ...pendingNotif, status: "accepted", cashier_id: cashierId };
      setHistory(h => h.map(n => n.id === updated.id ? updated : n));
      recalcStats([...history.map(n => n.id === updated.id ? updated : n)]);
    }
    setPendingNotif(null);
  }, [pendingNotif, history]);

  const handleReject = useCallback(() => {
    if (!pendingNotif) return;
    posClient
      .from("online_order_notifications")
      .update({ status: "rejected" })
      .eq("id", pendingNotif.id)
      .then(() => {
        const updated = { ...pendingNotif, status: "rejected" };
        setHistory(h => h.map(n => n.id === updated.id ? updated : n));
      });
    setPendingNotif(null);
  }, [pendingNotif, history]);

  const now = new Date();

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: "#fff",
      direction: "rtl", fontFamily: "inherit", padding: "0",
    }}>
      <AnimatePresence>
        {pendingNotif && (
          <OrderNotificationOverlay
            key={pendingNotif.id}
            notification={pendingNotif}
            activeCashier={activeCashier}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: "20px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "rgba(16,185,129,0.2)", border: `2px solid ${C.green}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>🖥️</div>
          <div>
            <p style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: 0 }}>محطة الكاشير</p>
            <p style={{ color: C.gray, fontSize: 12, margin: 0 }}>نظام استلام الطلبات الأونلاين</p>
          </div>
        </div>
        <div style={{ textAlign: "left" }}>
          <p style={{ color: C.green, fontSize: 14, fontWeight: 700, margin: 0 }}>
            ● مرتبط بالنظام
          </p>
          <p style={{ color: C.gray, fontSize: 12, margin: "2px 0 0" }}>
            {now.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
            {" · "}
            {now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>

        {/* Cashier Stations */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: C.grayL, fontSize: 12, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
            📍 محطات الكاشير — اضغط لاختيار الكاشير النشط
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {CASHIERS.map(c => (
              <CashierCard
                key={c.id}
                cashier={c}
                isActive={activeCashier === c.id}
                stats={stats[c.id] || { accepted: 0, today: 0 }}
                onClick={() => setActiveCashier(c.id)}
              />
            ))}
          </div>
        </div>

        {/* Two columns: Stats + History */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>

          {/* Stats Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "18px 16px" }}>
              <p style={{ color: C.grayL, fontSize: 12, fontWeight: 700, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 1 }}>📊 إحصائيات اليوم</p>
              {[
                { label: "إجمالي الطلبات", value: history.length, color: C.blue },
                { label: "مستلمة", value: history.filter(n => n.status === "accepted").length, color: C.green },
                { label: "مرفوضة/منتهية", value: history.filter(n => n.status !== "accepted").length, color: C.red },
                {
                  label: "الكاشير الأنشط",
                  value: (() => {
                    const counts = CASHIERS.map(c => ({ name: c.name, count: stats[c.id]?.accepted || 0 }));
                    counts.sort((a, b) => b.count - a.count);
                    return counts[0]?.count > 0 ? counts[0].name : "—";
                  })(),
                  color: C.amber,
                },
              ].map(item => (
                <div key={item.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{ color: C.gray, fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 800, fontSize: 15 }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Active Cashier Info */}
            <div style={{
              background: "rgba(16,185,129,0.08)",
              border: `1px solid rgba(16,185,129,0.2)`,
              borderRadius: 18, padding: "16px",
            }}>
              <p style={{ color: C.greenL, fontSize: 12, fontWeight: 700, margin: "0 0 10px" }}>🟢 الكاشير النشط</p>
              {(() => {
                const c = CASHIERS.find(x => x.id === activeCashier)!;
                return (
                  <>
                    <p style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>{c.name}</p>
                    <p style={{ color: C.gray, fontSize: 12, margin: "0 0 12px" }}>{c.station}</p>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ color: C.green, fontSize: 22, fontWeight: 900, margin: 0 }}>{stats[c.id]?.accepted || 0}</p>
                        <p style={{ color: C.gray, fontSize: 10 }}>إجمالي مستلم</p>
                      </div>
                      <div style={{ width: 1, background: C.border }} />
                      <div style={{ textAlign: "center" }}>
                        <p style={{ color: C.amber, fontSize: 22, fontWeight: 900, margin: 0 }}>{stats[c.id]?.today || 0}</p>
                        <p style={{ color: C.gray, fontSize: 10 }}>اليوم</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Notification History */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
            <div style={{
              padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, margin: 0 }}>سجل الإشعارات</p>
              </div>
              <span style={{
                background: "rgba(16,185,129,0.12)", color: C.green,
                borderRadius: 999, padding: "3px 12px", fontSize: 12, fontWeight: 700,
              }}>{history.length} إشعار</span>
            </div>

            <div style={{ maxHeight: 480, overflowY: "auto" }}>
              <AnimatePresence>
                {history.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
                    <p style={{ color: C.gray, fontSize: 14 }}>لا توجد إشعارات بعد</p>
                    <p style={{ color: C.gray, fontSize: 12, marginTop: 4 }}>ستظهر الطلبات الجديدة هنا فور وصولها</p>
                  </div>
                ) : (
                  history.map(n => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <NotifRow n={n} cashiers={CASHIERS} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

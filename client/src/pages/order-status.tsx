import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  Clock, CheckCircle2, XCircle, ChefHat, Package,
  MapPin, Phone, CreditCard, Truck, RefreshCw,
  Home, Share2, Sparkles, Flame,
  ShoppingBag, Star, Send, ThumbsUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { posClient } from "@/lib/pos-client";

type OrderNotifStatus = 'pending' | 'accepted' | 'preparation' | 'preparing' | 'out_for_delivery' | 'delivered' | 'rejected';

interface OrderNotif {
  id: number;
  order_id: number;
  status: OrderNotifStatus;
  customer_name: string;
  customer_phone: string;
  address: string;
  total: number;
  items: string;
  payment_method: string;
  created_at: string;
  accepted_at?: string;
  accepted_by?: string;
}

const STATUS_CONFIG: Record<OrderNotifStatus, {
  label: string; desc: string; icon: React.FC<any>;
  color: string; bg: string; border: string; gradient: string; emoji: string; step: number;
}> = {
  pending: {
    label: "⏳ في انتظار القبول",
    desc: "طلبك وصل للكاشير وسيتم مراجعته الآن",
    icon: Clock, color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)", emoji: "⏳", step: 1,
  },
  preparation: {
    label: "👨‍🍳 تم قبول الطلب",
    desc: "رائع! تم قبول طلبك وسيبدأ التجهيز قريباً",
    icon: CheckCircle2, color: "#3b82f6", bg: "#dbeafe", border: "#93c5fd",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)", emoji: "👨‍🍳", step: 2,
  },
  preparing: {
    label: "🔥 في حالة تجهيز الطلب",
    desc: "فريقنا يحضّر طلبك باحترافية الآن",
    icon: ChefHat, color: "#8b5cf6", bg: "#ede9fe", border: "#c4b5fd",
    gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)", emoji: "🔥", step: 3,
  },
  accepted: {
    label: "✅ تم تجهيز الطلب",
    desc: "طلبك جاهز وينتظر المندوب لاستلامه",
    icon: Flame, color: "#10b981", bg: "#d1fae5", border: "#6ee7b7",
    gradient: "linear-gradient(135deg, #10b981, #059669)", emoji: "✅", step: 4,
  },
  out_for_delivery: {
    label: "🚗 في التوصيل الان",
    desc: "المندوب في طريقه إليك الآن",
    icon: Truck, color: "#f97316", bg: "#ffedd5", border: "#fdba74",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)", emoji: "🚗", step: 5,
  },
  delivered: {
    label: "🎉 تم التوصيل",
    desc: "تم توصيل طلبك بنجاح. شكراً لك!",
    icon: CheckCircle2, color: "#059669", bg: "#ecfdf5", border: "#6ee7b7",
    gradient: "linear-gradient(135deg, #059669, #047857)", emoji: "🎉", step: 6,
  },
  rejected: {
    label: "❌ تم الرفض",
    desc: "نعتذر، لم نتمكن من استقبال طلبك في الوقت الحالي",
    icon: XCircle, color: "#ef4444", bg: "#fee2e2", border: "#fca5a5",
    gradient: "linear-gradient(135deg, #ef4444, #dc2626)", emoji: "❌", step: -1,
  },
};

const TIMELINE_STEPS = [
  { key: 'pending',          label: "في انتظار القبول",    icon: Clock,        step: 1 },
  { key: 'preparation',      label: "تم قبول الطلب",       icon: CheckCircle2, step: 2 },
  { key: 'preparing',        label: "في حالة تجهيز الطلب", icon: ChefHat,      step: 3 },
  { key: 'accepted',         label: "تم تجهيز الطلب",      icon: Flame,        step: 4 },
  { key: 'out_for_delivery', label: "في التوصيل الان",      icon: Truck,        step: 5 },
  { key: 'delivered',        label: "تم التوصيل",           icon: Package,      step: 6 },
];

const RATING_TAGS: Record<number, string[]> = {
  5: ["السائق ممتاز", "الأكل طازج", "التوصيل سريع", "التغليف رائع", "الكمية مضبوطة", "خدمة ممتازة"],
  4: ["التوصيل جيد", "الطعام لذيذ", "وقت مناسب", "التعامل حسن", "الكمية كافية", "يستحق التجربة"],
  3: ["مقبول", "تأخر قليلاً", "الطعام عادي", "يحتاج تحسين", "الكمية تقريبية", "يمكن أفضل"],
  2: ["التوصيل تأخر", "الطعام بارد", "الكمية أقل", "تغليف ضعيف", "بطء في الرد", "يحتاج تطوير"],
  1: ["تأخير كبير", "طعام غير طازج", "طلب ناقص", "تغليف سيء", "تعامل سيء", "تجربة سيئة"],
};

const STAR_LABELS = ["", "سيء جداً", "سيء", "مقبول", "جيد", "ممتاز!"];

const CONFETTI_COLORS = [
  '#f97316', '#fb923c', '#fbbf24', '#fcd34d', '#7c2d12',
  '#c2410c', '#f59e0b', '#d97706', '#ea580c', '#ef4444',
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
];

const confettiParticles = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: 5 + (i * 2.3) % 90,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 5 + (i % 5) * 2,
  delay: (i * 0.07) % 1.2,
  duration: 1.8 + (i % 4) * 0.4,
  isSquare: i % 3 !== 0,
  xDrift: -30 + (i % 7) * 10,
}));

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: color }} />
    </span>
  );
}

function DeliveredCelebration({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiParticles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: "110%",
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.isSquare ? "2px" : "50%",
            }}
            animate={{
              top: ["-10%", "110%"],
              x: [0, p.xDrift, p.xDrift * -0.5, p.xDrift * 0.7],
              rotate: [0, 180, 360, 540],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              repeatDelay: Math.random() * 0.5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.1 }}
        className="relative mx-4 rounded-[2.5rem] overflow-hidden shadow-2xl"
        style={{ maxWidth: 360, width: "100%" }}
      >
        {/* Gradient background */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #7c2d12 0%, #c2410c 40%, #f97316 100%)" }} />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 30% 20%, white 0%, transparent 50%), radial-gradient(circle at 70% 80%, #fbbf24 0%, transparent 40%)"
        }} />

        <div className="relative z-10 px-8 py-10 text-center">
          {/* Big animated emoji */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
            className="text-7xl mb-4 inline-block"
          >
            🎉
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black text-white mb-2 leading-tight"
          >
            تم توصيل الطلب
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-xl font-black mb-1"
            style={{ color: "#fcd34d" }}
          >
            شكراً لكم! 🙏
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm font-bold text-white/70 mb-8"
          >
            نتمنى أن تكون تجربتك رائعة
          </motion.p>

          {/* Stars decoration */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-1 mb-8"
          >
            {[1,2,3,4,5].map((s) => (
              <motion.span
                key={s}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.7 + s * 0.08, type: "spring", stiffness: 400 }}
              >
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              </motion.span>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onDismiss}
            className="w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all"
            style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "2px solid rgba(255,255,255,0.4)" }}
          >
            متابعة ← قيّم تجربتك
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OrderRatingSection({
  orderId,
  posNotifId,
  customerPhone,
  driverName,
  alreadyRated,
}: {
  orderId: number;
  posNotifId?: number;
  customerPhone?: string;
  driverName?: string;
  alreadyRated: boolean;
}) {
  const { toast } = useToast();
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadyRated);

  const activeStar = hovered || stars;
  const tags = activeStar > 0 ? RATING_TAGS[activeStar] : [];

  const handleStarClick = (s: number) => {
    setStars(s);
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (stars === 0) {
      toast({ title: "اختر تقييمك أولاً", description: "من فضلك اختر عدد النجوم", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: stars,
          tags: selectedTags,
          note: note.trim() || null,
          customer_phone: customerPhone || null,
          driver_name: driverName || null,
          pos_notif_id: posNotifId || null,
        }),
      });
      if (res.status === 409) {
        setSubmitted(true);
        return;
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "خطأ في الإرسال");
      }
      localStorage.setItem(`badr_rated_${orderId}`, "true");
      setSubmitted(true);
      toast({
        title: "شكراً لتقييمك! 🌟",
        description: "رأيك يساعدنا نتحسن أكثر",
        className: "bg-emerald-600 text-white border-none",
      });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl overflow-hidden shadow-lg border border-emerald-100"
        style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)" }}
      >
        <div className="p-7 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
          >
            <ThumbsUp className="w-9 h-9 text-white" />
          </motion.div>
          <h3 className="text-xl font-black text-emerald-900 mb-1">شكراً لتقييمك! 🌟</h3>
          <p className="text-sm font-bold text-emerald-700">رأيك يساعدنا على تقديم خدمة أفضل</p>
          <div className="flex justify-center gap-1 mt-4">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className="w-5 h-5" fill={s <= stars ? "#f59e0b" : "#d1d5db"} color={s <= stars ? "#f59e0b" : "#d1d5db"} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-[2rem] overflow-hidden shadow-xl"
      style={{ background: "linear-gradient(160deg, #1a0a00 0%, #3b0e00 50%, #7c2d12 100%)" }}
    >
      {/* Header shimmer */}
      <div className="relative px-6 pt-6 pb-4 text-center">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 50% 0%, #fbbf24, transparent 60%)"
        }} />
        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
          className="text-4xl mb-2 inline-block"
        >
          ⭐
        </motion.div>
        <h3 className="text-xl font-black text-white">قيّم تجربتك معنا</h3>
        <p className="text-xs font-bold text-white/60 mt-1">رأيك يساعدنا نتحسن أكثر</p>
      </div>

      <div className="px-6 pb-7 space-y-5">
        {/* Stars */}
        <div className="text-center">
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => handleStarClick(s)}
                className="relative focus:outline-none"
              >
                <motion.div
                  animate={{
                    scale: s <= activeStar ? [1, 1.15, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Star
                    className="w-10 h-10 transition-all duration-200"
                    fill={s <= activeStar ? "#fbbf24" : "transparent"}
                    color={s <= activeStar ? "#f59e0b" : "rgba(255,255,255,0.3)"}
                    strokeWidth={s <= activeStar ? 1.5 : 1.5}
                  />
                </motion.div>
                {s <= activeStar && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: "#fbbf24" }}
                  />
                )}
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {activeStar > 0 && (
              <motion.p
                key={activeStar}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-sm font-black"
                style={{ color: activeStar >= 4 ? "#fbbf24" : activeStar === 3 ? "#94a3b8" : "#f87171" }}
              >
                {STAR_LABELS[activeStar]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic tags */}
        <AnimatePresence mode="wait">
          {stars > 0 && tags.length > 0 && (
            <motion.div
              key={`tags-${stars}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-wrap gap-2 justify-center"
            >
              {tags.map((tag, i) => (
                <motion.button
                  key={tag}
                  initial={{ opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 400 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 border"
                  style={{
                    background: selectedTags.includes(tag)
                      ? "linear-gradient(135deg, #f97316, #ea580c)"
                      : "rgba(255,255,255,0.1)",
                    color: selectedTags.includes(tag) ? "white" : "rgba(255,255,255,0.75)",
                    borderColor: selectedTags.includes(tag) ? "#f97316" : "rgba(255,255,255,0.15)",
                    boxShadow: selectedTags.includes(tag) ? "0 4px 12px rgba(249,115,22,0.4)" : "none",
                  }}
                >
                  {selectedTags.includes(tag) ? "✓ " : ""}{tag}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes textarea */}
        <div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="اكتب ملاحظتك هنا... (اختياري)"
            dir="rtl"
            className="w-full rounded-2xl px-4 py-3 text-sm font-bold resize-none outline-none transition-all duration-200 placeholder-white/30"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "white",
              border: "1.5px solid rgba(255,255,255,0.15)",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(249,115,22,0.7)"; e.target.style.background = "rgba(255,255,255,0.12)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
          />
        </div>

        {/* Submit button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={submitting || stars === 0}
          className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: stars > 0
              ? "linear-gradient(to left, #7c2d12, #f97316)"
              : "rgba(255,255,255,0.1)",
            color: stars > 0 ? "white" : "rgba(255,255,255,0.4)",
            boxShadow: stars > 0 ? "0 8px 25px rgba(249,115,22,0.5)" : "none",
            cursor: stars === 0 ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              إرسال التقييم
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function OrderStatus() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const orderId = params?.id ? parseInt(params.id) : null;

  const [notif, setNotif] = useState<OrderNotif | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isPolling, setIsPolling] = useState(true);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // ── Celebration & Rating state ──
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDone, setCelebrationDone] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  const applyNotifData = useCallback((data: OrderNotif, silent = false) => {
    if (prevStatusRef.current && prevStatusRef.current !== data.status) {
      const cfg = STATUS_CONFIG[data.status];
      if (cfg) {
        toast({
          title: `${cfg.emoji} ${cfg.label}`,
          description: cfg.desc,
          className: data.status === 'rejected' ? "bg-red-600 text-white border-none" : "bg-emerald-600 text-white border-none",
        });
      }
    }
    prevStatusRef.current = data.status;
    setNotif(data);
    setLastUpdated(new Date());
    setError(null);
    try {
      const items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
      setParsedItems(Array.isArray(items) ? items : []);
    } catch { setParsedItems([]); }
  }, [toast]);

  const fetchStatus = useCallback(async (silent = false) => {
    if (!orderId) return;
    if (!silent) setLoading(true);
    try {
      const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch(`/api/order-status/${orderId}`, { headers });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "لم يتم العثور على الطلب");
        return;
      }
      const data: OrderNotif = await res.json();
      applyNotifData(data, silent);
    } catch (e: any) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orderId, applyNotifData]);

  useEffect(() => {
    if (!orderId) { setError("رقم الطلب غير موجود"); setLoading(false); return; }
    fetchStatus();
  }, [orderId, fetchStatus]);

  useEffect(() => {
    if (!orderId || !isPolling) return;
    intervalRef.current = setInterval(() => fetchStatus(true), 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [orderId, isPolling, fetchStatus]);

  useEffect(() => {
    if (!orderId) return;
    const channelName = `order_status_${orderId}`;
    const channel = posClient
      .channel(channelName)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'online_order_notifications' }, (payload) => {
        const row = payload.new as any;
        if (row.order_id === orderId || row.id === orderId) {
          applyNotifData(row as OrderNotif, true);
        }
      })
      .subscribe();
    return () => { posClient.removeChannel(channel); };
  }, [orderId, applyNotifData]);

  useEffect(() => {
    if (notif?.status === 'rejected' || notif?.status === 'delivered') {
      setIsPolling(false);
    }
  }, [notif?.status]);

  // ── Delivery celebration + rating timing logic ──
  useEffect(() => {
    if (!orderId || notif?.status !== 'delivered') return;

    const deliveredKey = `badr_delivered_${orderId}`;
    const celDoneKey = `badr_cel_done_${orderId}`;
    const ratedKey = `badr_rated_${orderId}`;

    // Set delivery timestamp if not set yet
    if (!localStorage.getItem(deliveredKey)) {
      localStorage.setItem(deliveredKey, new Date().toISOString());
    }

    const deliveredAt = new Date(localStorage.getItem(deliveredKey)!);
    const now = new Date();
    const hoursElapsed = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60);
    const celDismissed = localStorage.getItem(celDoneKey) === 'true';
    const rated = localStorage.getItem(ratedKey) === 'true';

    // Show celebration if within 24h and not dismissed
    if (hoursElapsed < 24 && !celDismissed) {
      setShowCelebration(true);
    } else {
      setCelebrationDone(true);
    }

    // Show rating section if within 32h
    if (hoursElapsed < 32) {
      setShowRating(true);
      if (rated) setAlreadyRated(true);
      else {
        // Also check from server
        fetch(`/api/orders/${orderId}/rating`)
          .then(r => r.json())
          .then(d => {
            if (d.rated) { setAlreadyRated(true); localStorage.setItem(ratedKey, "true"); }
          })
          .catch(() => {});
      }
    }
  }, [orderId, notif?.status]);

  const handleCelebrationDismiss = useCallback(() => {
    if (orderId) localStorage.setItem(`badr_cel_done_${orderId}`, 'true');
    setShowCelebration(false);
    setCelebrationDone(true);
  }, [orderId]);

  const cfg = notif ? STATUS_CONFIG[notif.status] : null;
  const currentStep = cfg?.step ?? 0;

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `طلب #${orderId}`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "تم نسخ الرابط", description: "شارك الرابط لمتابعة الطلب" });
    }
  };

  // Extract driver name from accepted_by (format: "DONE:driverName" or just name)
  const driverName = useMemo(() => {
    if (!notif?.accepted_by) return undefined;
    const v = notif.accepted_by;
    if (v.startsWith('DONE:')) return v.replace('DONE:', '').trim();
    return v;
  }, [notif?.accepted_by]);

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "linear-gradient(135deg, #fef9f5, #fdf3e7)" }}>
        <div className="text-center">
          <p className="text-xl font-black text-gray-700">رقم الطلب غير صحيح</p>
          <Link href="/"><button className="mt-4 px-8 py-3 rounded-2xl font-black text-white" style={{ background: "linear-gradient(to left, #7c2d12, #c2410c)" }}>العودة للرئيسية</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" dir="rtl" style={{ background: "linear-gradient(135deg, #fef9f5 0%, #fdf3e7 40%, #fef9f5 100%)" }}>
      <Navbar />

      {/* ── Delivered Celebration Overlay ── */}
      <AnimatePresence>
        {showCelebration && !celebrationDone && (
          <DeliveredCelebration onDismiss={handleCelebrationDismiss} />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #e8833b 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #7c2d12 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-8 max-w-2xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c)" }}>
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">تتبع طلبك</h1>
              <p className="text-sm font-bold text-gray-400">طلب رقم #{orderId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-orange-100 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchStatus()}
              className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-orange-100 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {loading && !notif ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-50 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fef3e2, #fde7c4)" }}>
                <RefreshCw className="w-9 h-9 animate-spin" style={{ color: "#c2410c" }} />
              </div>
              <p className="font-black text-gray-700 text-lg">جاري تحميل حالة الطلب...</p>
              <p className="text-sm text-gray-400 font-bold mt-1">الرجاء الانتظار لحظة</p>
            </div>
          </motion.div>
        ) : error && !notif ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-8 shadow-sm border border-red-100 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-50">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <p className="font-black text-gray-700 text-lg mb-2">تعذّر تحميل الطلب</p>
            <p className="text-sm text-gray-400 font-bold mb-6">{error}</p>
            <button onClick={() => fetchStatus()} className="px-8 py-3 rounded-2xl font-black text-white shadow-lg" style={{ background: "linear-gradient(to left, #7c2d12, #c2410c)" }}>
              إعادة المحاولة
            </button>
          </motion.div>
        ) : notif && cfg ? (
          <div className="space-y-5">

            {/* Main Status Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-[2rem] shadow-xl border overflow-hidden"
              style={{ borderColor: cfg.border }}
            >
              <div className="h-2 w-full" style={{ background: cfg.gradient }} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={notif.status !== 'rejected' && notif.status !== 'delivered' ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg text-3xl"
                      style={{ background: cfg.gradient }}
                    >
                      {cfg.emoji}
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900">{cfg.label}</h2>
                      <p className="text-sm font-bold text-gray-500 mt-0.5 max-w-[200px]">{cfg.desc}</p>
                    </div>
                  </div>
                  {notif.status !== 'rejected' && <PulsingDot color={cfg.color} />}
                </div>

                {/* Timeline */}
                {notif.status !== 'rejected' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-4 left-0 right-0 h-1 rounded-full bg-gray-100" style={{ top: "14px" }} />
                      <motion.div
                        className="absolute h-1 rounded-full"
                        style={{ top: "14px", right: 0, background: cfg.gradient, width: `${Math.min(((currentStep - 1) / 5) * 100, 100)}%` }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.min(((currentStep - 1) / 5) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                      />
                      {TIMELINE_STEPS.map((step) => {
                        const isDone = step.step < currentStep;
                        const isActive = step.step === currentStep;
                        return (
                          <div key={step.key} className="flex flex-col items-center gap-1.5 z-10">
                            <motion.div
                              animate={{ scale: isActive ? 1.2 : 1 }}
                              className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all"
                              style={{
                                background: isDone || isActive ? cfg.gradient : "white",
                                borderColor: isDone || isActive ? cfg.color : "#e5e7eb",
                                boxShadow: isActive ? `0 0 0 4px ${cfg.color}30` : "none",
                              }}
                            >
                              <step.icon className="w-3.5 h-3.5" style={{ color: isDone || isActive ? "white" : "#d1d5db" }} />
                            </motion.div>
                            <span className="text-[9px] font-black whitespace-nowrap" style={{ color: isDone || isActive ? cfg.color : "#9ca3af" }}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  {isPolling && notif.status !== 'rejected' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      تحديث تلقائي
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Order Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl shadow-sm border border-orange-50 overflow-hidden"
            >
              <div className="px-5 py-4 flex items-center gap-2 border-b border-orange-50" style={{ background: "linear-gradient(to left, #7c2d12, #c2410c)" }}>
                <Star className="w-4 h-4 text-amber-300" fill="#fcd34d" />
                <h3 className="font-black text-white">تفاصيل الطلب</h3>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-50 shrink-0">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">رقم الطلب</p>
                    <p className="font-black text-gray-900">#{notif.order_id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 shrink-0">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">الإجمالي</p>
                    <p className="font-black text-gray-900">{notif.total} <span className="text-xs text-gray-400">ج.م</span></p>
                  </div>
                </div>
                {notif.customer_name && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-50 shrink-0">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">العميل</p>
                      <p className="font-black text-gray-900 text-sm">{notif.customer_name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-50 shrink-0">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">وقت الطلب</p>
                    <p className="font-black text-gray-900 text-sm">{new Date(notif.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                {notif.address && (
                  <div className="col-span-2 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50 shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">عنوان التوصيل</p>
                      <p className="font-bold text-gray-700 text-sm leading-relaxed">{notif.address}</p>
                    </div>
                  </div>
                )}
                {notif.payment_method && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-50 shrink-0">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">الدفع</p>
                      <p className="font-black text-gray-900 text-sm">
                        {notif.payment_method === 'cash' ? '💵 كاش' : notif.payment_method === 'vodafone' ? '📱 فودافون' : notif.payment_method === 'instapay' ? '⚡ إنستا باي' : '💳 بطاقة'}
                      </p>
                    </div>
                  </div>
                )}
                {driverName && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 shrink-0">
                      <Truck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">المندوب</p>
                      <p className="font-black text-gray-900 text-sm">{driverName}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Products */}
            {parsedItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl shadow-sm border border-orange-50 overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-orange-50 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-orange-600" />
                  <h3 className="font-black text-gray-900">المنتجات ({parsedItems.length})</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {parsedItems.map((item: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      className="flex items-center gap-4 px-5 py-3.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 font-black text-orange-700">
                        {item.quantity}×
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-sm truncate">{item.name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.cutting && <span className="text-[9px] font-bold bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full">✂️ {item.cutting}</span>}
                          {item.packaging && <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">📦 {item.packaging}</span>}
                        </div>
                      </div>
                      <span className="font-black text-sm shrink-0" style={{ color: "#7c2d12" }}>{(item.price * item.quantity).toFixed(0)} ج.م</span>
                    </motion.div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-orange-50/50 flex justify-between items-center border-t border-orange-100">
                  <span className="font-black text-gray-700">الإجمالي</span>
                  <span className="font-black text-xl" style={{ color: "#7c2d12" }}>{notif.total} ج.م</span>
                </div>
              </motion.div>
            )}

            {/* ── Rating Section (shown for 32h after delivery) ── */}
            <AnimatePresence>
              {showRating && celebrationDone && (
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 250, damping: 22 }}
                >
                  <OrderRatingSection
                    orderId={orderId}
                    posNotifId={notif.id}
                    customerPhone={notif.customer_phone}
                    driverName={driverName}
                    alreadyRated={alreadyRated}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rejected tips */}
            <AnimatePresence>
              {notif.status === 'rejected' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-2 border-red-200 rounded-3xl p-5"
                >
                  <h3 className="font-black text-red-800 mb-2 flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> تم رفض الطلب
                  </h3>
                  <p className="text-sm font-bold text-red-600 mb-4">نعتذر عن عدم تمكّننا من تلبية طلبك في الوقت الراهن. يمكنك المحاولة مرة أخرى أو التواصل معنا.</p>
                  <button
                    onClick={() => setLocation("/products")}
                    className="w-full py-3 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(to left, #7c2d12, #c2410c)" }}
                  >
                    <Sparkles className="w-4 h-4" /> طلب مجدداً
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-3 pb-4"
            >
              <Link href="/profile">
                <button className="w-full h-13 py-3.5 rounded-2xl font-bold text-gray-700 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Package className="w-4 h-4" /> كل طلباتي
                </button>
              </Link>
              <Link href="/">
                <button className="w-full h-13 py-3.5 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2" style={{ background: "linear-gradient(to left, #7c2d12, #c2410c)" }}>
                  <Home className="w-4 h-4" /> الرئيسية
                </button>
              </Link>
            </motion.div>
          </div>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}

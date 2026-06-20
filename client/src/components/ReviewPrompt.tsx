import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { fetchPosOrderStatus } from "@/lib/pos-client";

const TAGS_BY_STARS: Record<number, string[]> = {
  5: ["السائق محترم 😊", "المنتجات طازجة 🌿", "توصيل سريع ⚡", "تغليف ممتاز 📦", "سأطلب مجدداً 🔄"],
  4: ["جيد بشكل عام 👍", "توصيل في الوقت ⏰", "منتجات جيدة ✅", "خدمة مرضية 🤝"],
  3: ["يمكن التحسين 📈", "تأخر قليلاً ⏳", "منتجات عادية 😐", "خدمة مقبولة"],
  2: ["تأخر التوصيل 😕", "منتجات أقل جودة", "يحتاج تحسين 🔧"],
  1: ["تأخر كثيراً 😞", "مشكلة في المنتجات 😤", "خدمة سيئة", "لن أطلب مجدداً"],
};

const DISMISSED_KEY  = "badr_dismissed_reviews";
const WINDOW_MS      = 24 * 60 * 60 * 1000; // 24 hours
const REVIEW_STATUSES = new Set(["accepted", "out_for_delivery", "delivered"]);

function getDismissed(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]")); }
  catch { return new Set(); }
}
function dismiss(orderId: number) {
  const s = getDismissed(); s.add(orderId);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...s]));
}

export function ReviewPrompt() {
  const { user } = useAuth();
  const [orderId, setOrderId]     = useState<number | null>(null);
  const [rating, setRating]       = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (!user || checked.current) return;
    checked.current = true;

    (async () => {
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (!res.ok) return;
        const orders: { id: number; createdAt?: string; created_at?: string }[] = await res.json();

        const dismissed = getDismissed();
        const now = Date.now();

        for (const order of orders) {
          const created = new Date(order.createdAt || order.created_at || 0).getTime();
          if (now - created > WINDOW_MS) continue;
          if (dismissed.has(order.id)) continue;

          const checkRes = await fetch(`/api/reviews/check/${order.id}`, { credentials: "include" });
          const { reviewed } = await checkRes.json();
          if (reviewed) continue;

          const pos = await fetchPosOrderStatus(order.id);
          if (pos?.status && REVIEW_STATUSES.has(pos.status)) {
            setOrderId(order.id);
            break;
          }
        }
      } catch { /* silent */ }
    })();
  }, [user]);

  const handleDismiss = () => {
    if (orderId) dismiss(orderId);
    setOrderId(null);
  };

  const toggleTag = (t: string) =>
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSubmit = async () => {
    if (!orderId || rating === 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, rating, tags: selectedTags, notes }),
      });
      dismiss(orderId);
      setSubmitted(true);
      setTimeout(() => setOrderId(null), 2200);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const stars = rating || hovered;
  const tags  = TAGS_BY_STARS[stars] ?? [];

  return (
    <AnimatePresence>
      {orderId && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[998]"
            onClick={handleDismiss}
          />

          {/* Bottom Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[999] rounded-t-3xl bg-white shadow-2xl overflow-hidden"
            dir="rtl"
            style={{ maxHeight: "92vh", overflowY: "auto" }}
          >
            {/* Gradient top bar */}
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(to left, #7c2d12, #c2410c, #f97316)" }} />

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pb-8 pt-2">

              {submitted ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3 py-8"
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                    style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
                    ⭐
                  </div>
                  <p className="text-xl font-black text-gray-900">شكراً لتقييمك!</p>
                  <p className="text-sm font-bold text-gray-400">رأيك يساعدنا على التحسين 💪</p>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                        style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
                        ⭐
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900">قيّم الخدمة</h3>
                        <p className="text-xs font-bold text-gray-400">طلب رقم #{orderId}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDismiss}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stars */}
                  <div className="flex justify-center gap-3 mb-5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.85 }}
                        whileHover={{ scale: 1.15 }}
                        onClick={() => { setRating(i); setSelectedTags([]); }}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(0)}
                        className="focus:outline-none"
                      >
                        <Star
                          className="w-10 h-10 transition-all duration-150"
                          style={{
                            fill: i <= stars ? "#f59e0b" : "none",
                            color: i <= stars ? "#f59e0b" : "#d1d5db",
                            filter: i <= stars ? "drop-shadow(0 0 6px #f59e0b80)" : "none",
                          }}
                        />
                      </motion.button>
                    ))}
                  </div>

                  {/* Star label */}
                  <AnimatePresence mode="wait">
                    {stars > 0 && (
                      <motion.p
                        key={stars}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="text-center text-sm font-black mb-4"
                        style={{ color: stars >= 4 ? "#059669" : stars === 3 ? "#d97706" : "#dc2626" }}
                      >
                        {stars === 5 ? "ممتاز جداً! 🎉" : stars === 4 ? "جيد جداً 👍" : stars === 3 ? "مقبول 😐" : stars === 2 ? "يحتاج تحسين 😕" : "سيئ 😞"}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Context tags */}
                  <AnimatePresence>
                    {stars > 0 && tags.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                      >
                        <p className="text-xs font-black text-gray-500 mb-2">اختر ما ينطبق</p>
                        <div className="flex flex-wrap gap-2">
                          {tags.map(tag => (
                            <motion.button
                              key={tag}
                              whileTap={{ scale: 0.93 }}
                              onClick={() => toggleTag(tag)}
                              className="text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-150"
                              style={selectedTags.includes(tag) ? {
                                background: "linear-gradient(135deg, #7c2d12, #c2410c)",
                                color: "#fff",
                                borderColor: "transparent",
                              } : {
                                background: "#f9fafb",
                                color: "#374151",
                                borderColor: "#e5e7eb",
                              }}
                            >
                              {tag}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Notes */}
                  <AnimatePresence>
                    {stars > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-5"
                      >
                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="أضف ملاحظاتك هنا... (اختياري)"
                          rows={2}
                          className="w-full text-sm font-bold px-3 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:border-orange-300 focus:bg-white transition-all"
                          dir="rtl"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleDismiss}
                      className="flex-none px-5 py-3 rounded-2xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      تجاهل
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleSubmit}
                      disabled={rating === 0 || submitting}
                      className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                      style={{ background: rating > 0 ? "linear-gradient(to left, #7c2d12, #c2410c)" : "#9ca3af" }}
                    >
                      {submitting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          إرسال التقييم
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

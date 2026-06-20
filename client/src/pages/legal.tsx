import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Link, useRoute } from "wouter";

/* ─── Content ─── */
const PAGES: Record<string, {
  title: string; emoji: string; badge: string;
  grad: string; light: string; accent: string;
  sections: { title: string; body: string; tag?: "warn" | "ok" | "info" }[];
}> = {
  privacy: {
    title: "سياسة الخصوصية",
    emoji: "🔒",
    badge: "حماية بياناتك",
    grad: "135deg, #0f172a 0%, #1e3a8a 100%",
    light: "rgba(59,130,246,0.07)",
    accent: "#3b82f6",
    sections: [
      { title: "مقدمة", body: "نحن في محمصة بدر الدين نقدّر خصوصيتك ونلتزم بحمايتها. تُوضح هذه السياسة كيفية جمع بياناتك واستخدامها وحمايتها." },
      { title: "المعلومات التي نجمعها", body: "• الاسم ورقم الهاتف والبريد الإلكتروني عند إنشاء الحساب\n• عنوان التوصيل لتنفيذ طلباتك\n• بيانات الطلبات والمنتجات التي تتصفحها" },
      { title: "كيف نستخدم بياناتك", body: "• معالجة طلباتك وتنسيق التوصيل\n• إرسال تحديثات حالة الطلب\n• تحسين منتجاتنا وخدماتنا\n• التواصل بشأن العروض بموافقتك" },
      { title: "حماية المعلومات", body: "• تشفير كامل للبيانات بـ SSL\n• تخزين آمن على خوادم محمية\n• وصول محدود للموظفين\n• مراجعات دورية لممارسات الأمن", tag: "ok" },
      { title: "حقوقك", body: "يحق لك الاطلاع على بياناتك وتصحيحها أو حذفها في أي وقت عبر التواصل معنا.", tag: "ok" },
      { title: "تحديثات السياسة", body: "قد نحدّث هذه السياسة دورياً. الاستمرار في استخدام الموقع يعني القبول بأي تحديثات." },
    ]
  },
  terms: {
    title: "الشروط والأحكام",
    emoji: "📋",
    badge: "اقرأ بعناية",
    grad: "135deg, #1c0a00 0%, #92400e 100%",
    light: "rgba(245,158,11,0.07)",
    accent: "#f59e0b",
    sections: [
      { title: "قبول الشروط", body: "باستخدامك للموقع أو إجراء أي طلب، فإنك توافق على هذه الشروط كاملةً." },
      { title: "الأسعار والدفع", body: "• جميع الأسعار تشمل ضريبة القيمة المضافة 14%\n• يُؤكَّد الطلب بعد اكتمال الدفع فقط\n• نحتفظ بحق تعديل الأسعار دون إشعار مسبق", tag: "info" },
      { title: "الطلبات والتوصيل", body: "• يُحضَّر الطلب فور التأكيد\n• مواعيد التوصيل تقديرية\n• أوقات العمل: 8 ص — 11 م" },
      { title: "جودة المنتجات", body: "منتجاتنا طازجة محمصة يومياً. في حال وجود عيب تواصل معنا فوراً.", tag: "ok" },
      { title: "حساب المستخدم", body: "أنت مسؤول عن سرية بيانات حسابك. يحق لنا تعليق الحسابات المنتهكة للشروط." },
      { title: "الملكية الفكرية", body: "جميع محتويات الموقع من صور وشعارات ونصوص هي ملك حصري لمحمصة بدر الدين." },
      { title: "القانون المطبّق", body: "تخضع هذه الشروط لقوانين جمهورية مصر العربية." },
    ]
  },
  returns: {
    title: "سياسة الاسترجاع",
    emoji: "🚫",
    badge: "اقرأ قبل الطلب",
    grad: "135deg, #1a0202 0%, #991b1b 100%",
    light: "rgba(239,68,68,0.07)",
    accent: "#ef4444",
    sections: [
      { title: "السياسة الأساسية", body: "نظراً لطبيعة منتجاتنا الغذائية الطازجة المحمصة يومياً:\n\n🚫 لا يُقبل استرجاع أي طلب مقدَّم عبر الموقع بعد تأكيده ومعالجته.", tag: "warn" },
      { title: "حالات الشكاوى المقبولة", body: "✅ وصول منتج تالف أو معيب بوضوح\n✅ وصول منتج مختلف عن المطلوب\n✅ وجود جسم غريب في المنتج\n\nيجب الإبلاغ خلال ساعتين من الاستلام.", tag: "ok" },
      { title: "إجراءات الإبلاغ", body: "1️⃣ تواصل فوراً عبر واتساب\n2️⃣ أرسل صوراً واضحة للمنتج\n3️⃣ احتفظ بالمنتج وتغليفه الأصلي\n4️⃣ أرفق رقم الطلب", tag: "info" },
      { title: "منتجات لا تُسترجع", body: "• المنتجات المفتوحة\n• طلبات بمواصفات مخصصة\n• ما مضى على استلامه أكثر من 48 ساعة", tag: "warn" },
      { title: "الطلبات الإلكترونية", body: "🚫 بعد تأكيد الطلب لا يمكن إلغاؤه\n🚫 لا استبدال إلا بخطأ من جانبنا\n🚫 لا استرجاع بسبب تغيير الرأي", tag: "warn" },
      { title: "استرداد المبالغ", body: "في الحالات المقبولة فقط، يتم الاسترداد خلال 3-5 أيام عمل بنفس طريقة الدفع.", tag: "info" },
    ]
  }
};

const NAV = [
  { id: "privacy",  label: "سياسة الخصوصية", emoji: "🔒" },
  { id: "terms",   label: "الشروط والأحكام",  emoji: "📋" },
  { id: "returns", label: "سياسة الاسترجاع", emoji: "🚫" },
];

const TAG_STYLE = {
  warn: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.18)", label: "⚠️ تنبيه", text: "#ef4444" },
  ok:   { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.18)", label: "✅ مهم",   text: "#22c55e" },
  info: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.18)", label: "ℹ️ معلومة", text: "#3b82f6" },
};

export default function Legal() {
  const [mP] = useRoute("/legal/privacy");
  const [mT] = useRoute("/legal/terms");
  const [mR] = useRoute("/legal/returns");
  const type = mP ? "privacy" : mT ? "terms" : mR ? "returns" : "privacy";
  const p = PAGES[type];

  return (
    <div className="min-h-screen bg-[#f6f7f9]" dir="rtl">
      <Navbar />

      {/* ══ HERO ══ */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(${p.grad})` }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 10% 40%, rgba(255,255,255,0.07) 0%, transparent 55%), radial-gradient(circle at 90% 10%, rgba(255,255,255,0.05) 0%, transparent 45%)" }} />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-black/20 pointer-events-none" />

        <div className="container mx-auto px-4 pt-10 pb-14 relative z-10">
          <Link href="/">
            <motion.span
              whileHover={{ x: 3 }}
              className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs font-bold mb-8 transition-colors cursor-pointer"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              الرئيسية
            </motion.span>
          </Link>

          <div className="flex items-end justify-between gap-6 flex-wrap">
            <motion.div
              key={type + "-hero"}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center text-2xl">
                  {p.emoji}
                </div>
                <span className="text-xs font-black text-white/45 tracking-widest uppercase">{p.badge}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">{p.title}</h1>
            </motion.div>

            <div className="text-right">
              <div className="text-[10px] text-white/35 font-black tracking-widest mb-1">آخر تحديث</div>
              <div className="text-sm font-black text-white/70">
                {new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
          </div>

          {/* Page tab bar */}
          <div className="flex gap-2 mt-10 flex-wrap">
            {NAV.map((n) => (
              <Link key={n.id} href={`/legal/${n.id}`}>
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black cursor-pointer transition-all ${
                    type === n.id
                      ? "bg-white text-gray-900 shadow-lg"
                      : "bg-white/10 text-white/65 hover:bg-white/18 border border-white/10"
                  }`}
                >
                  {n.emoji} {n.label}
                </motion.span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {p.sections.map((s, i) => {
              const tag = s.tag ? TAG_STYLE[s.tag] : null;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-3xl overflow-hidden border"
                  style={{
                    borderColor: tag ? tag.border : "#eef0f4",
                    background: tag ? tag.bg : "#fff",
                    boxShadow: "0 1px 8px rgba(0,0,0,0.04)"
                  }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b"
                    style={{ borderColor: tag ? tag.border : "#f1f5f9" }}>
                    <span className="font-black text-gray-900 text-sm">{s.title}</span>
                    {tag && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full border"
                        style={{ color: tag.text, borderColor: tag.border, background: tag.bg }}>
                        {tag.label}
                      </span>
                    )}
                  </div>
                  {/* Card body */}
                  <div className="px-5 py-4">
                    <p className="text-gray-600 text-sm leading-7 whitespace-pre-line">{s.body}</p>
                  </div>
                </motion.div>
              );
            })}

            {/* ── WhatsApp CTA ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: p.sections.length * 0.04 + 0.05 }}
              className="rounded-3xl overflow-hidden mt-6"
              style={{ background: `linear-gradient(${p.grad})` }}
            >
              <div className="relative overflow-hidden p-7 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.07) 0%, transparent 55%)" }} />
                <div className="relative z-10 text-right">
                  <div className="text-2xl mb-1">💬</div>
                  <h3 className="text-lg font-black text-white mb-1">لديك استفسار؟</h3>
                  <p className="text-white/55 text-xs">فريقنا جاهز للمساعدة 8 ص — 11 م</p>
                </div>
                <a href="https://api.whatsapp.com/send?phone=201110085927" target="_blank" rel="noopener noreferrer"
                  className="relative z-10 shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2.5 px-7 py-3 rounded-2xl text-white text-sm font-black"
                    style={{ background: "linear-gradient(to left, #15803d, #22c55e)", boxShadow: "0 6px 20px rgba(34,197,94,0.35)" }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    تواصل عبر واتساب
                  </motion.div>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}

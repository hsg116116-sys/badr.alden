import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Sparkles,
  Package, Tag, Gift, Clock, Shield, Truck, Star,
  ChevronRight, Heart, RefreshCw, Info, Zap, CheckCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const TRUST_BADGES = [
  { icon: Shield, label: "دفع آمن ١٠٠%", color: "#10b981" },
  { icon: Truck, label: "توصيل سريع", color: "#3b82f6" },
  { icon: RefreshCw, label: "إرجاع مجاني", color: "#f59e0b" },
  { icon: Star, label: "جودة مضمونة", color: "#7c2d12" },
];

function CartItemCard({ item, index, onUpdate, onRemove }: {
  item: any;
  index: number;
  onUpdate: (id: any, delta: number) => void;
  onRemove: (id: any) => void;
}) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(item.id), 300);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: isRemoving ? 0 : 1, x: isRemoving ? -40 : 0, height: isRemoving ? 0 : "auto" }}
      exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.35, delay: isRemoving ? 0 : index * 0.07 }}
      className="group bg-white rounded-3xl shadow-sm border border-orange-50/80 overflow-hidden"
      style={{ boxShadow: "0 2px 16px rgba(124,45,18,0.06)" }}
    >
      <div className="flex items-stretch gap-0">
        {/* Image */}
        <div className="relative shrink-0 w-28 h-28 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-white/10 to-transparent" />
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md z-10"
            style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c)" }}>
            {item.quantity}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-black text-gray-900 text-[15px] leading-tight truncate">{item.name}</h3>
            {(item.cutting || item.packaging || item.extras) && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {item.cutting && (
                  <span className="text-[9px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100">✂️ {item.cutting}</span>
                )}
                {item.packaging && (
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">📦 {item.packaging}</span>
                )}
                {item.extras && (
                  <span className="text-[9px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">✨ {item.extras}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black" style={{ color: "#7c2d12" }}>{(item.price * item.quantity).toFixed(0)}</span>
              <span className="text-xs font-bold text-gray-400">ج.م</span>
              {item.quantity > 1 && (
                <span className="text-[10px] font-bold text-gray-300 mr-1">{item.price} × {item.quantity}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Quantity */}
              <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                <button
                  onClick={() => onUpdate(item.id, -1)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-all active:scale-90"
                >
                  <Minus className="w-3 h-3" strokeWidth={3} />
                </button>
                <span className="w-7 text-center font-black text-gray-800 text-sm">{item.quantity}</span>
                <button
                  onClick={() => onUpdate(item.id, 1)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm transition-all active:scale-90"
                  style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c)" }}
                >
                  <Plus className="w-3 h-3" strokeWidth={3} />
                </button>
              </div>
              {/* Delete */}
              <button
                onClick={handleRemove}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-red-300 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Cart() {
  const { items: cartItems, updateQuantity, removeItem, subtotal, deliveryFee, total, clearCart } = useCart() as any;
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const itemCount = cartItems.reduce((s: number, i: any) => s + i.quantity, 0);
  const savings = cartItems.reduce((s: number, i: any) => {
    const orig = i.originalPrice || i.price;
    return s + (orig - i.price) * i.quantity;
  }, 0);

  const handleCheckout = () => {
    if (!user) {
      toast({ title: "يرجى تسجيل الدخول", description: "يجب عليك تسجيل الدخول للمتابعة.", variant: "destructive" });
      setLocation("/auth");
      return;
    }
    setLocation("/checkout");
  };

  const handleClearCart = () => {
    if (clearCart) clearCart();
    setShowClearConfirm(false);
    toast({ title: "تم مسح السلة", className: "bg-gray-700 text-white border-none" });
  };

  return (
    <div className="min-h-screen pb-32 md:pb-10" dir="rtl" style={{ background: "linear-gradient(135deg, #fef9f5 0%, #fdf3e7 40%, #fef9f5 100%)" }}>
      <Navbar />

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #e8833b 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #7c2d12 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ background: "radial-gradient(circle, #c2410c 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-8 max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative"
              style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c)" }}>
              <ShoppingCart className="w-7 h-7 text-white" strokeWidth={2.5} />
              {cartItems.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -left-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow"
                >
                  {itemCount}
                </motion.div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">سلة التسوق</h1>
              <p className="text-sm font-bold text-gray-400 mt-0.5">
                {cartItems.length > 0
                  ? `${cartItems.length} منتج • ${itemCount} وحدة`
                  : "سلتك فارغة حالياً"}
              </p>
            </div>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> مسح الكل
            </button>
          )}
        </motion.div>

        {/* Clear confirm */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4"
            >
              <p className="font-bold text-red-700 text-sm">هل تريد مسح السلة بالكامل؟</p>
              <div className="flex gap-2">
                <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded-xl bg-white border border-gray-200 font-bold text-gray-600 text-sm">إلغاء</button>
                <button onClick={handleClearCart} className="px-4 py-2 rounded-xl bg-red-500 font-bold text-white text-sm">نعم، امسح</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item: any, i: number) => (
                  <CartItemCard
                    key={`${item.id}-${item.cutting}-${item.packaging}`}
                    item={item}
                    index={i}
                    onUpdate={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </AnimatePresence>

              {/* Promo hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-orange-800">هل لديك كوبون خصم؟</p>
                  <p className="text-xs font-bold text-orange-500">أدخله في خطوة الدفع للحصول على خصمك 🎉</p>
                </div>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {TRUST_BADGES.map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2 bg-white rounded-2xl p-2.5 shadow-sm border border-gray-50">
                    <badge.icon className="w-4 h-4 shrink-0" style={{ color: badge.color }} />
                    <span className="text-[10px] font-black text-gray-700">{badge.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-24 bg-white rounded-3xl shadow-xl border border-orange-50 overflow-hidden"
                style={{ boxShadow: "0 8px 40px rgba(124,45,18,0.12)" }}
              >
                {/* Header */}
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c)" }}>
                  <Package className="w-5 h-5 text-white/80" />
                  <h3 className="text-white font-black text-lg">ملخص الطلب</h3>
                  <Sparkles className="w-4 h-4 text-amber-300 mr-auto" />
                </div>

                <div className="p-6 space-y-4">
                  {/* Items summary */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold text-sm flex items-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5" /> المنتجات ({itemCount})
                      </span>
                      <span className="font-black text-gray-800">{subtotal} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold text-sm flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" /> التوصيل
                      </span>
                      <span className="font-bold text-gray-500 text-sm">
                        {deliveryFee > 0 ? `${deliveryFee} ج.م` : "يُحدد لاحقاً"}
                      </span>
                    </div>
                    {savings > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5"
                      >
                        <span className="text-emerald-700 font-bold text-sm flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" /> وفّرت
                        </span>
                        <span className="font-black text-emerald-700">{savings.toFixed(0)} ج.م</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-l from-transparent via-orange-200 to-transparent" />

                  {/* Total */}
                  <div className="flex justify-between items-center py-1">
                    <span className="font-black text-gray-900 text-lg">الإجمالي</span>
                    <div>
                      <span className="text-3xl font-black" style={{ color: "#7c2d12" }}>{total}</span>
                      <span className="text-sm font-bold text-gray-400 mr-1">ج.م</span>
                    </div>
                  </div>

                  {/* Delivery estimate */}
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl p-3">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-amber-800">وقت التوصيل المتوقع</p>
                      <p className="text-xs font-bold text-amber-600">٣٠ - ٦٠ دقيقة بعد التأكيد</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 16px 40px rgba(124,45,18,0.35)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCheckout}
                    className="w-full h-14 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 shadow-xl mt-1"
                    style={{ background: "linear-gradient(to left, #7c2d12, #c2410c, #e8833b)", boxShadow: "0 8px 24px rgba(124,45,18,0.3)" }}
                  >
                    <span>إتمام الطلب</span>
                    <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                  </motion.button>

                  <Link href="/products">
                    <button className="w-full h-11 rounded-2xl font-bold text-gray-500 text-sm hover:bg-gray-50 transition-colors border border-gray-100 mt-1 flex items-center justify-center gap-1">
                      <ChevronRight className="w-4 h-4" /> مواصلة التسوق
                    </button>
                  </Link>

                  {/* Security note */}
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 pt-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>دفعك محمي ومشفّر ١٠٠%</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="text-center py-16 bg-white rounded-[2.5rem] shadow-xl border border-orange-50 max-w-md mx-auto mt-8 overflow-hidden"
          >
            <div className="h-1.5 w-full mb-8" style={{ background: "linear-gradient(to left, #7c2d12, #c2410c, #e8833b)" }} />
            <div className="px-8">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "linear-gradient(135deg, #fef3e2, #fde7c4)" }}
              >
                <ShoppingCart className="w-12 h-12" style={{ color: "#c2410c" }} strokeWidth={1.5} />
              </motion.div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">سلتك فارغة!</h2>
              <p className="text-gray-400 font-bold mb-3 leading-relaxed">لم تضف أي منتجات بعد. تفضل بتصفح متجرنا الرائع!</p>

              <div className="flex flex-col gap-2 mb-6">
                {["🥩 لحوم طازجة يومياً", "⚡ توصيل سريع لبابك", "✅ جودة مضمونة ١٠٠%"].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm font-bold text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <Link href="/products">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-xl flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(to left, #7c2d12, #c2410c)", boxShadow: "0 8px 24px rgba(124,45,18,0.3)" }}
                >
                  <Zap className="w-5 h-5" />
                  تسوق الآن
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

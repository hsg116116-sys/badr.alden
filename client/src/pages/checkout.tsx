
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, MapPin, CreditCard, Truck, ShoppingBag,
  ChevronRight, ChevronLeft, Banknote, Navigation,
  Ticket, Percent, X, Clock, Phone, Loader2,
  Wallet, Smartphone, Star
} from "lucide-react";
import UserLocationMap from "@/components/checkout/UserLocationMap";
import { isPointInPolygon } from "@/lib/geo";
import { DeliveryZone } from "@shared/schema";
import { CountrySelect } from "@/components/ui/country-select";

const steps = [
  { id: 1, name: "مراجعة الطلب", icon: ShoppingBag, color: "#e8833b" },
  { id: 2, name: "موقع التوصيل", icon: MapPin, color: "#3b82f6" },
  { id: 3, name: "الدفع والتأكيد", icon: CreditCard, color: "#10b981" },
];

const paymentOptions = [
  {
    id: "cash",
    label: "كاش عند الاستلام",
    desc: "ادفع نقداً عند وصول طلبك",
    icon: Banknote,
    color: "#10b981",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    emoji: "💵",
  },
  {
    id: "vodafone",
    label: "فودافون كاش",
    desc: "تحويل عبر محفظة فودافون",
    icon: Smartphone,
    color: "#e11d48",
    bg: "#fff1f2",
    border: "#fecdd3",
    emoji: "📱",
  },
  {
    id: "instapay",
    label: "إنستا باي",
    desc: "تحويل فوري عبر InstaPay",
    icon: Wallet,
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    emoji: "⚡",
  },
  {
    id: "card",
    label: "Visa / MasterCard",
    desc: "بطاقة ائتمانية أو خصم مباشر",
    icon: CreditCard,
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    emoji: "💳",
  },
];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user, updateProfileMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [countryCode, setCountryCode] = useState("+20");
  const [phoneInput, setPhoneInput] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [addressType, setAddressType] = useState<"saved" | "new">("saved");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [newAddress, setNewAddress] = useState({ city: "", district: "", street: "", building: "", landmark: "" });

  const { data: siteSettings = [] } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const settingsMap = siteSettings.reduce((acc: any, curr: any) => {
    try { acc[curr.key] = JSON.parse(curr.value); } catch { acc[curr.key] = curr.value; }
    return acc;
  }, {});

  const isStoreClosed = settingsMap.store_status === 'closed';

  const { data: zones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ['delivery_zones_active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('delivery_zones').select('*').eq('is_active', true);
      if (error) throw error;
      return data as DeliveryZone[];
    }
  });

  const u = user as any;
  const savedAddressStr = (() => {
    const parts = [
      u?.city, u?.district, u?.street,
      u?.building ? `مبنى ${u.building}` : null,
      u?.landmark ? `(${u.landmark})` : null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" - ");
    if (typeof u?.address === 'string') return u.address || "";
    return "";
  })();

  const userGpsLat = user?.gpsLat ?? (user as any)?.gps_lat ?? null;
  const userGpsLng = user?.gpsLng ?? (user as any)?.gps_lng ?? null;

  useEffect(() => {
    if (userGpsLat && userGpsLng && !pickedLocation) {
      const saved = { lat: Number(userGpsLat), lng: Number(userGpsLng) };
      setPickedLocation(saved);
      if (zones.length > 0) {
        const zone = zones.find((z: any) => {
          if (!z.coordinates) return false;
          const poly = typeof z.coordinates === 'string' ? JSON.parse(z.coordinates) : z.coordinates;
          return isPointInPolygon([saved.lat, saved.lng], poly);
        });
        setSelectedZone(zone || null);
      }
    }
  }, [userGpsLat, userGpsLng, zones.length]);

  useEffect(() => {
    if (user?.id && (u?.city || u?.street || u?.district)) {
      setNewAddress({
        city: u?.city || "",
        district: u?.district || "",
        street: u?.street || "",
        building: u?.building || "",
        landmark: u?.landmark || "",
      });
    }
  }, [user?.id]);

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch("/api/orders", { method: "POST", headers, body: JSON.stringify(orderData), credentials: "include" });
      if (!res.ok) { const msg = await res.text(); throw new Error(msg || "فشل إرسال الطلب"); }
      return res.json();
    },
    onSuccess: (order: any) => {
      const profileUpdate: Record<string, any> = {};
      if (pickedLocation) {
        profileUpdate.gps_lat = pickedLocation.lat;
        profileUpdate.gps_lng = pickedLocation.lng;
      }
      if (addressType === "new" && (newAddress.city || newAddress.street)) {
        const parts = [newAddress.city, newAddress.district, newAddress.street,
          newAddress.building ? `مبنى ${newAddress.building}` : null,
          newAddress.landmark ? `(${newAddress.landmark})` : null].filter(Boolean);
        profileUpdate.address = parts.join(" - ");
        profileUpdate.city = newAddress.city || null;
        profileUpdate.district = newAddress.district || null;
        profileUpdate.street = newAddress.street || null;
        profileUpdate.building = newAddress.building || null;
        profileUpdate.landmark = newAddress.landmark || null;
      } else if (addressType === "saved" && pickedLocation) {
        profileUpdate.gps_lat = pickedLocation.lat;
        profileUpdate.gps_lng = pickedLocation.lng;
      }
      if (Object.keys(profileUpdate).length > 0) {
        updateProfileMutation.mutate(profileUpdate as any);
      }
      clearCart();
      setLocation("/profile");
      toast({ title: "تم إرسال الطلب بنجاح! 🎉", description: "تابع حالة طلبك في صفحة حسابك." });
    },
    onError: (error: Error) => {
      toast({ title: "فشل إرسال الطلب", description: error.message, variant: "destructive" });
    }
  });

  const discount = appliedCoupon
    ? (appliedCoupon.discount_type === 'percentage' ? (subtotal * appliedCoupon.discount_value / 100) : appliedCoupon.discount_value)
    : 0;
  const grandTotal = (subtotal + (selectedZone?.fee || 0)) - discount;

  const handleNext = () => {
    if (currentStep === 1) {
      if (items.length === 0) { toast({ title: "السلة فارغة", variant: "destructive" }); return; }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!pickedLocation) {
        toast({ title: "يرجى تحديد موقعك على الخريطة أولاً", description: "انقر على الخريطة لتضع الدبوس على موقعك بدقة", variant: "destructive" }); return;
      }
      if (!selectedZone) {
        toast({ title: "موقعك خارج نطاق التوصيل", description: "يرجى تحديد موقع داخل مناطق التوصيل المتاحة", variant: "destructive" }); return;
      }
      const hasTextAddress = addressType === "saved"
        ? !!savedAddressStr
        : !!(newAddress.city || newAddress.street);
      if (!hasTextAddress) {
        toast({ title: "يرجى إدخال عنوانك النصي", description: "أدخل المدينة أو الشارع على الأقل في حقول العنوان", variant: "destructive" }); return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      let finalAddress: string;
      if (addressType === "saved") {
        const parts = [
          u?.city, u?.district, u?.street,
          u?.building ? `مبنى ${u.building}` : null,
          u?.landmark ? `(${u.landmark})` : null,
        ].filter(Boolean);
        finalAddress = parts.join(" - ") || savedAddressStr || "غير محدد";
      } else {
        const a = newAddress;
        const parts = [
          a.city, a.district, a.street,
          a.building ? `مبنى ${a.building}` : null,
          a.landmark ? `(${a.landmark})` : null,
        ].filter(Boolean);
        finalAddress = parts.join(" - ") || "غير محدد";
      }

      orderMutation.mutate({
        user_id: user?.id, items, total: grandTotal, subtotal, status: 'pending',
        delivery_fee: selectedZone?.fee || 0, discount_amount: discount,
        coupon_code: appliedCoupon?.code || null, address: finalAddress,
        customer_name: user?.username || user?.email || null, customer_phone: user?.phone || null,
        gps_lat: pickedLocation?.lat, gps_lng: pickedLocation?.lng,
        payment_method: paymentMethod, zone_id: selectedZone?.id,
        notes: deliveryNotes || null,
      });
    }
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); else setLocation("/cart"); };

  const handleUpdatePhone = () => {
    if (!phoneInput || phoneInput.length < 9) { toast({ title: "رقم الجوال قصير جداً", variant: "destructive" }); return; }
    const fullPhone = countryCode.replace('+', '') + (phoneInput.startsWith('0') ? phoneInput.substring(1) : phoneInput);
    updateProfileMutation.mutate({ phone: fullPhone }, { onSuccess: () => toast({ title: "تم حفظ الرقم بنجاح", className: "bg-green-600 text-white" }) });
  };

  if (!user) { setLocation("/auth"); return null; }

  if (!user.phone) {
    return (
      <div className="min-h-screen pb-24" dir="rtl" style={{ background: "linear-gradient(135deg, #fef9f5 0%, #fdf3e7 100%)" }}>
        <Navbar />
        <div className="container mx-auto px-4 py-12 max-w-md mt-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden text-center"
          >
            <div className="h-2 w-full" style={{ background: "linear-gradient(to left, #7c2d12, #c2410c, #e8833b)" }} />
            <div className="p-10">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ background: "linear-gradient(135deg, #fef3e2, #fde7c4)" }}>
                <Phone className="w-12 h-12" style={{ color: "#c2410c" }} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">نحتاج لرقم جوالك</h2>
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">لإتمام طلبك ومتابعة التوصيل، يجب إضافة رقم جوال نشط لحسابك أولاً.</p>
              <div className="space-y-4">
                <div className="flex gap-3" dir="ltr">
                  <CountrySelect value={countryCode} onChange={setCountryCode} />
                  <Input
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 13))}
                    type="tel" maxLength={13} placeholder="5xxxxxxxx"
                    className="h-14 bg-gray-50 border-gray-100 rounded-2xl flex-1 font-black text-xl px-5 focus:border-orange-400"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleUpdatePhone}
                  disabled={updateProfileMutation.isPending}
                  className="w-full h-14 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 shadow-xl"
                  style={{ background: "linear-gradient(to left, #7c2d12, #c2410c)" }}
                >
                  {updateProfileMutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : "إضافة الرقم والمتابعة ←"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" dir="rtl" style={{ background: "linear-gradient(135deg, #fef9f5 0%, #fdf3e7 40%, #fef9f5 100%)" }}>
      <Navbar />

      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #e8833b 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #7c2d12 0%, transparent 70%)" }} />
      </div>

      {/* Store closed banner */}
      {isStoreClosed && (
        <div className="relative z-10 container mx-auto px-4 pt-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 p-5 rounded-3xl flex items-center gap-4 shadow-lg"
          >
            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-black text-red-800">المحل مغلق حالياً</p>
              <p className="text-sm font-bold text-red-600 opacity-80">نعتذر منك، لا يمكننا استقبال طلبات في الوقت الحالي.</p>
            </div>
          </motion.div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 pt-8 pb-4 max-w-4xl">

        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            {/* Track */}
            <div className="absolute top-6 left-0 right-0 h-1 rounded-full bg-gray-100" style={{ top: "22px" }} />
            <motion.div
              className="absolute rounded-full h-1"
              style={{ top: "22px", right: 0, background: "linear-gradient(to left, #7c2d12, #c2410c, #e8833b)" }}
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />

            {steps.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 z-10">
                  <motion.div
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-11 h-11 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-500"
                    style={{
                      background: isActive ? "linear-gradient(135deg, #7c2d12, #c2410c)" : isCompleted ? "#7c2d12" : "white",
                      borderColor: isCompleted || isActive ? "#7c2d12" : "#e5e7eb",
                      boxShadow: isActive ? "0 4px 20px rgba(124,45,18,0.4)" : "none"
                    }}
                  >
                    {isCompleted
                      ? <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      : <step.icon className="w-4.5 h-4.5" style={{ color: isActive ? "white" : "#9ca3af" }} />
                    }
                  </motion.div>
                  <span className="text-xs font-black whitespace-nowrap" style={{ color: isActive ? "#7c2d12" : isCompleted ? "#c2410c" : "#9ca3af" }}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >

            {/* ── Step 1: Order Review ── */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fef3e2, #fde7c4)" }}>
                    <ShoppingBag className="w-5 h-5" style={{ color: "#c2410c" }} />
                  </div>
                  <h2 className="text-xl font-black text-gray-900">مراجعة طلبك</h2>
                </div>

                <div className="space-y-3">
                  {items.map((item, i) => (
                    <motion.div
                      key={`${item.id}-${item.cutting}-${item.packaging}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50 flex gap-4"
                    >
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-orange-50">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-black text-gray-900 text-[15px] leading-tight">{item.name}</h3>
                          <span className="font-black text-lg shrink-0" style={{ color: "#7c2d12" }}>{item.price * item.quantity} ج.م</span>
                        </div>
                        <p className="text-xs text-gray-400 font-bold mt-0.5">الكمية: {item.quantity} × {item.price} ج.م</p>
                        {(item.cutting || item.packaging || item.extras) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.cutting && <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100">✂️ {item.cutting}</span>}
                            {item.packaging && <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">📦 {item.packaging}</span>}
                            {item.extras && <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">✨ {item.extras}</span>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Mini summary */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50 space-y-2">
                  <div className="flex justify-between text-sm font-bold text-gray-500">
                    <span>إجمالي المنتجات</span>
                    <span className="text-gray-800">{subtotal} ج.م</span>
                  </div>
                  <div className="h-px bg-gray-100 my-1" />
                  <div className="flex justify-between font-black text-base">
                    <span className="text-gray-900">الإجمالي (بدون توصيل)</span>
                    <span style={{ color: "#7c2d12" }}>{subtotal} ج.م</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Location ── */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900">موقع التوصيل</h2>
                </div>

                <div className="bg-white rounded-3xl p-4 shadow-sm border border-blue-50 overflow-hidden">
                  <p className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
                    <Navigation className="w-4 h-4" /> حدد موقعك على الخريطة بدقة
                  </p>
                  <UserLocationMap
                    initialLocation={pickedLocation || undefined}
                    onLocationSelect={(latlng) => {
                      setPickedLocation(latlng);
                      const zone = zones.find((z: any) => {
                        if (!z.coordinates) return false;
                        const poly = typeof z.coordinates === 'string' ? JSON.parse(z.coordinates) : z.coordinates;
                        return isPointInPolygon([latlng.lat, latlng.lng], poly);
                      });
                      setSelectedZone(zone || null);
                      if (zone) {
                        toast({ title: `✅ المنطقة: ${zone.name}`, description: `رسوم التوصيل: ${zone.fee} ج.م`, className: "bg-emerald-600 text-white border-none" });
                      } else {
                        toast({ title: "خارج نطاق التغطية", description: "الموقع خارج مناطق التوصيل المتاحة.", variant: "destructive" });
                      }
                    }}
                  />
                </div>

                <AnimatePresence>
                  {selectedZone && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl"
                    >
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <p className="font-black text-emerald-900 leading-tight">المنطقة: {selectedZone.name}</p>
                        <p className="text-sm font-bold text-emerald-600">رسوم التوصيل: {selectedZone.fee} ج.م</p>
                      </div>
                      <div className="mr-auto text-2xl">🚚</div>
                    </motion.div>
                  )}
                  {pickedLocation && !selectedZone && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl"
                    >
                      <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                        <X className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <p className="font-black text-red-900">خارج نطاق التغطية</p>
                        <p className="text-sm font-bold text-red-600">يرجى اختيار موقع آخر داخل مناطق التوصيل.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Map requirement hint */}
                {!pickedLocation && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                    <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
                      <Navigation className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-amber-900 text-sm">ضع الدبوس على الخريطة أولاً</p>
                      <p className="text-xs font-bold text-amber-600">لا يمكنك المتابعة بدون تحديد موقعك بدقة</p>
                    </div>
                  </div>
                )}

                {/* Address options */}
                <div className="space-y-3">
                  <RadioGroup value={addressType} onValueChange={(v) => setAddressType(v as "saved" | "new")} className="space-y-3">
                    <div
                      onClick={() => setAddressType("saved")}
                      className={`relative flex items-start gap-4 rounded-3xl border-2 p-5 cursor-pointer transition-all ${addressType === "saved" ? "border-orange-300 bg-orange-50 shadow-md" : "border-gray-100 bg-white hover:border-orange-200"}`}
                    >
                      <RadioGroupItem value="saved" id="saved" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="saved" className="cursor-pointer font-black text-base text-gray-900">📍 العنوان المحفوظ</Label>
                        {savedAddressStr
                          ? <p className="text-gray-600 mt-1 text-sm font-medium leading-relaxed">{savedAddressStr}</p>
                          : <p className="text-amber-600 mt-1 text-sm font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 inline-block">لا يوجد عنوان محفوظ — اختر عنوان جديد</p>
                        }
                      </div>
                    </div>

                    <div
                      onClick={() => setAddressType("new")}
                      className={`relative flex items-start gap-4 rounded-3xl border-2 p-5 cursor-pointer transition-all ${addressType === "new" ? "border-orange-300 bg-orange-50 shadow-md" : "border-gray-100 bg-white hover:border-orange-200"}`}
                    >
                      <RadioGroupItem value="new" id="new" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="new" className="cursor-pointer font-black text-base text-gray-900">✏️ عنوان جديد</Label>
                        <AnimatePresence>
                          {addressType === "new" && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-4 grid gap-3 overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-gray-600">المدينة</Label>
                                  <Input placeholder="القاهرة" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="h-11 rounded-2xl border-gray-100 bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-gray-600">الحي</Label>
                                  <Input placeholder="مدينة نصر" value={newAddress.district} onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })} className="h-11 rounded-2xl border-gray-100 bg-white" />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-600">الشارع</Label>
                                <Input placeholder="اسم الشارع" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} className="h-11 rounded-2xl border-gray-100 bg-white" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-gray-600">المبنى</Label>
                                  <Input placeholder="رقم 12" value={newAddress.building} onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })} className="h-11 rounded-2xl border-gray-100 bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-gray-600">معلم مميز</Label>
                                  <Input placeholder="بجانب مسجد..." value={newAddress.landmark} onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })} className="h-11 rounded-2xl border-gray-100 bg-white" />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Delivery notes — always visible */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50 space-y-2">
                  <Label className="text-sm font-black text-gray-800 flex items-center gap-2">
                    <span>📝</span> ملاحظات للسائق (اختياري)
                  </Label>
                  <Textarea
                    placeholder="مثال: اتصل بي عند الوصول • الطابق الثالث • الباب الأحمر..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="rounded-2xl border-gray-100 bg-gray-50 min-h-[80px] text-sm"
                  />
                </div>
              </div>
            )}

            {/* ── Step 3: Payment ── */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900">طريقة الدفع</h2>
                </div>

                {/* Payment methods grid */}
                <div className="grid grid-cols-2 gap-3">
                  {paymentOptions.map((opt) => {
                    const isSelected = paymentMethod === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setPaymentMethod(opt.id)}
                        className="relative flex flex-col items-center gap-2 p-4 rounded-3xl border-2 text-center transition-all"
                        style={{
                          background: isSelected ? opt.bg : "white",
                          borderColor: isSelected ? opt.color : "#f3f4f6",
                          boxShadow: isSelected ? `0 4px 20px ${opt.color}25` : "none",
                        }}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: opt.color }}
                          >
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                        <div className="text-3xl">{opt.emoji}</div>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: opt.bg }}>
                          <opt.icon className="w-5 h-5" style={{ color: opt.color }} />
                        </div>
                        <p className="font-black text-[13px] text-gray-900 leading-tight">{opt.label}</p>
                        <p className="text-[10px] font-bold text-gray-400 leading-tight">{opt.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Coupon */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50">
                  <div className="flex items-center gap-2 mb-4">
                    <Ticket className="w-5 h-5" style={{ color: "#e8833b" }} />
                    <h3 className="font-black text-gray-900">كوبون الخصم</h3>
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="أدخل رمز الكوبون هنا..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.substring(0, 20).toUpperCase())}
                      className="h-13 py-3.5 rounded-2xl pr-12 pl-28 font-bold text-base border-2 border-gray-100 focus:border-orange-300 bg-gray-50"
                      disabled={!!appliedCoupon}
                    />
                    <Ticket className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                      {!appliedCoupon ? (
                        <button
                          onClick={async () => {
                            if (!couponCode) return;
                            setIsApplyingCoupon(true);
                            try {
                              const { data, error } = await supabase.from('coupons').select('*').eq('code', couponCode).eq('is_active', true).single();
                              if (error || !data) throw new Error("الكوبون غير صحيح أو منتهي الصلاحية");
                              if (data.min_order_amount && subtotal < data.min_order_amount) throw new Error(`صالح للطلبات فوق ${data.min_order_amount} ج.م`);
                              setAppliedCoupon(data);
                              toast({ title: "تم تطبيق الكوبون! 🎉", description: `خصم ${data.discount_value}${data.discount_type === 'percentage' ? '%' : ' ج.م'}`, className: "bg-emerald-600 text-white border-none" });
                            } catch (err: any) {
                              toast({ title: "خطأ في الكوبون", description: err.message, variant: "destructive" });
                            } finally { setIsApplyingCoupon(false); }
                          }}
                          disabled={isApplyingCoupon || !couponCode}
                          className="h-10 px-5 rounded-xl font-black text-sm text-white disabled:opacity-50 transition-all"
                          style={{ background: "linear-gradient(to left, #7c2d12, #c2410c)" }}
                        >
                          {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
                        </button>
                      ) : (
                        <button
                          onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                          className="h-10 px-4 rounded-xl font-black text-sm text-red-500 hover:bg-red-50 transition-all flex items-center gap-1"
                        >
                          <X className="w-4 h-4" /> إزالة
                        </button>
                      )}
                    </div>
                  </div>
                  <AnimatePresence>
                    {appliedCoupon && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-emerald-700">
                          <Check className="w-4 h-4 bg-emerald-500 text-white rounded-full p-0.5" />
                          <span className="text-sm font-black">كوبون {appliedCoupon.code} مُفعّل ✅</span>
                        </div>
                        <span className="text-sm font-black text-emerald-700">-{discount.toFixed(0)} ج.م</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Final invoice */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-orange-50">
                  <div className="px-6 py-4 flex items-center gap-2" style={{ background: "linear-gradient(to left, #7c2d12, #c2410c)" }}>
                    <Star className="w-4 h-4 text-amber-300" fill="#fcd34d" />
                    <h3 className="font-black text-white text-base">ملخص الفاتورة</h3>
                    <Star className="w-4 h-4 text-amber-300 mr-auto" fill="#fcd34d" />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex justify-between text-sm font-bold text-gray-500">
                      <span>قيمة المنتجات</span>
                      <span className="text-gray-800">{subtotal} ج.م</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-blue-600 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> التوصيل ({selectedZone?.name || '—'})</span>
                      <span className="text-blue-700">+{selectedZone?.fee || 0} ج.م</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-emerald-600 flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> خصم الكوبون</span>
                        <span className="text-emerald-700">-{discount.toFixed(0)} ج.م</span>
                      </div>
                    )}
                    <div className="h-px bg-gradient-to-l from-transparent via-orange-200 to-transparent my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-black text-gray-900">الإجمالي</span>
                      <div className="text-left">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black" style={{ color: "#7c2d12" }}>{grandTotal.toLocaleString()}</span>
                          <span className="font-black text-gray-400">ج.م</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50" dir="rtl">
        <div className="bg-white/95 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-8px_40px_rgba(0,0,0,0.08)] px-4 py-3 pb-safe">
          <div className="container mx-auto max-w-4xl flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleBack}
              className="flex items-center gap-1.5 h-13 px-5 py-3 rounded-2xl font-bold text-gray-500 bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
              السابق
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01, boxShadow: "0 12px 32px rgba(124,45,18,0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (isStoreClosed) { toast({ title: "المحل مغلق", variant: "destructive" }); return; }
                handleNext();
              }}
              disabled={orderMutation.isPending || (currentStep === 3 && isStoreClosed)}
              className="flex-1 h-13 py-3 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(to left, #7c2d12, #c2410c, #e8833b)", boxShadow: "0 6px 20px rgba(124,45,18,0.3)" }}
            >
              {orderMutation.isPending
                ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...</>
                : currentStep === 3
                  ? <><span>إرسال الطلب الآن 🎉</span></>
                  : <><span>الخطوة التالية</span><ChevronLeft className="w-5 h-5" /></>
              }
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

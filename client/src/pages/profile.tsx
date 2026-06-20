import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User, MapPin, LogOut, Loader2, Package, ShoppingBag,
  Shield, Lock, UserCircle, Mail, Phone, Building,
  Navigation, Star, Settings2, Map as MapIcon, CheckCircle2,
  Clock, ChefHat, Truck, XCircle, Flame, Copy, ChevronDown,
  ChevronRight, Crown, Calendar, CreditCard, Sparkles,
  AlertCircle, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Order } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { posClient, fetchPosOrderStatus, type PosOrderStatus } from "@/lib/pos-client";
import { useToast } from "@/hooks/use-toast";
import { MapPicker } from "@/components/ui/map-picker";


const STATUS_STEPS = [
  { key: 'pending',          label: 'في انتظار القبول',    icon: Clock,        color: '#f59e0b', activeColor: '#fef3c7' },
  { key: 'preparation',      label: 'تم قبول الطلب',       icon: CheckCircle2, color: '#3b82f6', activeColor: '#dbeafe' },
  { key: 'preparing',        label: 'في حالة تجهيز الطلب', icon: ChefHat,      color: '#8b5cf6', activeColor: '#ede9fe' },
  { key: 'accepted',         label: 'تم تجهيز الطلب',      icon: Flame,        color: '#10b981', activeColor: '#d1fae5' },
  { key: 'out_for_delivery', label: 'في التوصيل الان',      icon: Truck,        color: '#f97316', activeColor: '#ffedd5' },
  { key: 'delivered',        label: 'تم التوصيل',          icon: CheckCircle2, color: '#059669', activeColor: '#ecfdf5' },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0, preparation: 1, preparing: 2, accepted: 3, out_for_delivery: 4, delivered: 5
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  pending:          { label: 'في انتظار القبول',    color: '#d97706', bg: '#fef9c3', border: '#fde68a', emoji: '⏳' },
  preparation:      { label: 'تم قبول الطلب',       color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', emoji: '👨‍🍳' },
  preparing:        { label: 'في حالة تجهيز الطلب', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', emoji: '🔥' },
  accepted:         { label: 'تم تجهيز الطلب',      color: '#059669', bg: '#d1fae5', border: '#6ee7b7', emoji: '✅' },
  out_for_delivery: { label: 'في التوصيل الان',      color: '#ea580c', bg: '#fff7ed', border: '#fdba74', emoji: '🚗' },
  delivered:        { label: 'تم التوصيل',          color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', emoji: '🎉' },
  rejected:         { label: 'تم الرفض',            color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', emoji: '❌' },
};

/* ─── Live Status Badge ─── */
function LiveBadge({ status }: { status: PosOrderStatus | null }) {
  if (!status) return null;
  const m = STATUS_META[status];
  if (!m) return null;
  const isActive = status !== 'rejected' && status !== 'delivered';
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border"
      style={{ background: m.bg, color: m.color, borderColor: m.border }}
    >
      {m.emoji} {m.label}
      {isActive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: m.color }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: m.color }} />
        </span>
      )}
    </span>
  );
}

/* ─── Order Status Timeline — reads directly from POS Supabase ─── */
function OrderTimeline({ orderId }: { orderId: number }) {
  const [posStatus, setPosStatus] = useState<PosOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  /* Initial fetch from POS Supabase directly */
  useEffect(() => {
    let cancelled = false;
    fetchPosOrderStatus(orderId).then((data) => {
      if (cancelled) return;
      if (data?.status) {
        setPosStatus(data.status);
        setLastUpdate(new Date());
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orderId]);

  /* Real-time subscription on POS Supabase */
  useEffect(() => {
    const channel = posClient
      .channel(`order-notif-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'online_order_notifications',
          filter: `order_id=eq.${orderId}`,
        },
        (payload: any) => {
          const newStatus = payload.new?.status as PosOrderStatus;
          if (newStatus) { setPosStatus(newStatus); setLastUpdate(new Date()); }
        }
      )
      .subscribe();
    return () => { posClient.removeChannel(channel); };
  }, [orderId]);

  /* Fallback polling every 8s */
  useEffect(() => {
    const t = setInterval(async () => {
      const data = await fetchPosOrderStatus(orderId);
      if (data?.status) { setPosStatus(data.status); setLastUpdate(new Date()); }
    }, 8000);
    return () => clearInterval(t);
  }, [orderId]);

  const currentIdx = posStatus ? (STATUS_INDEX[posStatus] ?? -1) : -1;
  const isRejected = posStatus === 'rejected';

  /* Source label always shown */
  const sourceLabel = (
    <div className="flex items-center gap-1.5 mt-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[10px] font-black text-emerald-600">🟢 تحديث مباشر من المحل</span>
      {lastUpdate && (
        <span className="text-[10px] font-bold text-gray-400 mr-auto">
          {lastUpdate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}
    </div>
  );

  if (loading) return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-gray-50 border border-gray-100 mt-3">
      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
      <span className="text-xs font-bold text-gray-400">جاري التحقق من الكاشير...</span>
    </div>
  );

  if (!posStatus) return (
    <div className="flex flex-col gap-1 mt-3">
      <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-amber-50 border border-amber-100">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs font-bold text-amber-700">لم يتم استلام الطلب في الكاشير بعد</span>
      </div>
      {sourceLabel}
    </div>
  );

  return (
    <div className="mt-3 space-y-1.5">
      {isRejected ? (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-red-50 border border-red-100">
          <XCircle className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <p className="font-black text-red-700 text-sm">❌ تم رفض الطلب من الكاشير</p>
            <p className="text-xs text-red-400 font-bold mt-0.5">تواصل مع خدمة العملاء للاستفسار</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
          <div className="relative">
            <div className="flex items-start justify-between relative z-10">
              {STATUS_STEPS.map((step, idx) => {
                const done = idx <= currentIdx;
                const current = idx === currentIdx;
                const StepIcon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                    <motion.div
                      animate={{ scale: current ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 1.5, repeat: current ? Infinity : 0 }}
                      className="w-9 h-9 rounded-full flex items-center justify-center border-2 relative"
                      style={{
                        background: done ? step.activeColor : '#f3f4f6',
                        borderColor: done ? step.color : '#e5e7eb',
                      }}
                    >
                      <StepIcon className="w-4 h-4" style={{ color: done ? step.color : '#9ca3af' }} />
                      {current && (
                        <span className="absolute inset-0 rounded-full animate-ping opacity-25" style={{ background: step.color }} />
                      )}
                    </motion.div>
                    <span className="text-[9px] font-black text-center leading-tight" style={{ color: done ? step.color : '#d1d5db' }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Connector line — anchored to circle centers */}
            {(() => {
              const n = STATUS_STEPS.length;
              const segPct = 100 / n;           // each cell = 100/6 ≈ 16.67%
              const startPct = segPct / 2;       // center of first (rightmost) cell ≈ 8.33%
              const totalLinePct = 100 - segPct; // line spans 83.33% of container
              const filledPct = currentIdx > 0
                ? (currentIdx / (n - 1)) * totalLinePct
                : 0;
              const activeColor = STATUS_STEPS[Math.min(currentIdx, n - 1)]?.color || '#e8833b';
              return (
                <>
                  {/* gray background line */}
                  <div
                    className="absolute h-0.5 bg-gray-200 -z-0"
                    style={{ top: 18, right: `${startPct}%`, left: `${startPct}%` }}
                  />
                  {/* colored progress line, grows from right (RTL first step) */}
                  {currentIdx > 0 && (
                    <motion.div
                      className="absolute h-0.5"
                      style={{ top: 18, right: `${startPct}%`, background: `linear-gradient(to left, ${activeColor}, #e8833b)` }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${filledPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
      {sourceLabel}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PROFILE PAGE
═══════════════════════════════════════ */
export default function Profile() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'orders' | 'address' | 'settings'>('orders');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  /* Address editing */
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [landmark, setLandmark] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  /* Username editing */
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    if (user) {
      setCity(user.city || '');
      setDistrict(user.district || '');
      setStreet(user.street || '');
      setBuilding(user.building || '');
      setLandmark(user.landmark || '');
      if (user.gpsLat && user.gpsLng) setGpsLocation({ lat: user.gpsLat, lng: user.gpsLng });
    }
  }, [user]);

  useEffect(() => {
    if (!user) { setLocation('/auth'); return; }
    const isStaff = user.isAdmin || (user.role && user.role !== 'customer');
    if (isStaff) setLocation(user.isAdmin ? '/admin' : `/${user.role}`);
  }, [user, setLocation]);

  /* Orders */
  const { data: orders = [], isLoading: ordersLoading } = useQuery<(Order & { items: any[] })[]>({
    queryKey: ['/api/orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(image, unit))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((o: any) => ({
        ...o,
        createdAt: o.created_at,
        items: (o.order_items || []).map((item: any) => ({
          ...item,
          product: item.products,
        })),
      }));
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const handleSaveAddress = async () => {
    if (!user) return;
    setIsSavingAddress(true);
    const fullAddress = [city, district, street, building ? `مبنى ${building}` : '', landmark ? `(${landmark})` : ''].filter(Boolean).join('، ');
    try {
      const { error } = await supabase.from('users').update({
        address: fullAddress, city, district, street, building, landmark,
        gps_lat: gpsLocation?.lat, gps_lng: gpsLocation?.lng,
      }).eq('id', user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['auth_user'] });
      toast({ title: '✅ تم حفظ العنوان بنجاح', className: 'bg-emerald-600 text-white border-none' });
      setIsEditingAddress(false);
    } catch (e: any) {
      toast({ title: 'فشل حفظ العنوان', description: e.message, variant: 'destructive' });
    } finally { setIsSavingAddress(false); }
  };

  const handleSaveUsername = async () => {
    if (!user || !newUsername.trim()) return;
    setIsSavingUsername(true);
    try {
      const { error } = await supabase.from('users').update({ username: newUsername.trim() }).eq('id', user.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { username: newUsername.trim() } });
      await queryClient.invalidateQueries({ queryKey: ['auth_user'] });
      toast({ title: '✅ تم تغيير الاسم', className: 'bg-emerald-600 text-white border-none' });
      setIsEditingUsername(false);
    } catch (e: any) {
      toast({ title: 'فشل تغيير الاسم', description: e.message, variant: 'destructive' });
    } finally { setIsSavingUsername(false); }
  };

  if (!user) return null;

  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
  const avatarUrl = (user as any).avatar_url;

  const TABS = [
    { key: 'orders' as const, label: 'طلباتي', icon: Package, count: orders.length },
    { key: 'address' as const, label: 'عنواني', icon: MapPin, count: null },
    { key: 'settings' as const, label: 'حسابي', icon: Settings2, count: null },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: 'linear-gradient(160deg,#fff8f4 0%,#fef3e7 60%,#fff8f4 100%)' }}>
      <Navbar />

      {/* ══════ HERO ══════ */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4a1508 0%, #7c2d12 40%, #c2410c 75%, #e8833b 100%)' }}>
        {/* Texture dots */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 w-96 h-96 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" style={{ background: 'rgba(232,131,59,0.35)' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full translate-x-1/3 translate-y-1/2 blur-3xl" style={{ background: 'rgba(124,45,18,0.5)' }} />

        <div className="relative container mx-auto px-4 max-w-3xl pt-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-5"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl bg-white/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserCircle className="w-12 h-12 text-white/60" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-emerald-400 rounded-lg border-2 border-white/30 flex items-center justify-center shadow-lg">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl md:text-2xl font-black text-white truncate">{user.username}</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  <Crown className="w-3 h-3" /> مميز
                </span>
              </div>
              <p className="text-white/60 text-sm font-bold truncate flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {user.phone || user.email}
              </p>
            </div>

            {/* Logout on desktop */}
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-bold border border-white/10"
            >
              {logoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              خروج
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-3 gap-3 mt-6"
          >
            {[
              { label: 'طلبات', value: orders.length, icon: '🛍️' },
              { label: 'إنفاق', value: `${totalSpent.toFixed(0)} ج.م`, icon: '💰' },
              { label: 'عضو منذ', value: new Date((user as any).created_at || Date.now()).getFullYear(), icon: '📅' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-3 text-center backdrop-blur-sm border border-white/10" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-base md:text-lg font-black text-white">{stat.value}</div>
                <div className="text-[10px] font-bold text-white/50 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ══════ MAIN CARD ══════ */}
      <div className="container mx-auto px-4 max-w-3xl -mt-10 pb-28 relative z-10">
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-white border border-orange-50">

          {/* ── Tab Navigation ── */}
          <div className="flex border-b border-gray-100">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col md:flex-row items-center justify-center gap-1.5 py-3.5 px-2 text-xs md:text-sm font-black transition-all relative"
                style={{
                  color: activeTab === tab.key ? '#7c2d12' : '#9ca3af',
                  background: activeTab === tab.key ? '#fff8f4' : 'transparent',
                }}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className="w-5 h-5 rounded-full text-[9px] font-black text-white flex items-center justify-center" style={{ background: '#c2410c' }}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(to left,#7c2d12,#e8833b)' }} />
                )}
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="p-4 md:p-6"
            >

              {/* ═══ ORDERS ═══ */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {ordersLoading ? (
                    <>
                      {[1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
                    </>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg,#fef3e2,#fde7c4)' }}>🛍️</div>
                      <h3 className="font-black text-gray-800 text-lg mb-2">لا توجد طلبات بعد</h3>
                      <p className="text-gray-400 font-bold text-sm mb-5">تسوّق الآن وجرب منتجاتنا الطازجة</p>
                      <Link href="/products">
                        <button className="px-8 py-3 rounded-2xl font-black text-white shadow-lg" style={{ background: 'linear-gradient(to left,#7c2d12,#c2410c)' }}>
                          تسوق الآن ←
                        </button>
                      </Link>
                    </div>
                  ) : (
                    orders.map((order, idx) => {
                      const isOpen = expandedOrder === order.id;
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="rounded-2xl border overflow-hidden transition-all"
                          style={{ borderColor: isOpen ? '#fcd9bd' : '#f3f4f6', boxShadow: isOpen ? '0 4px 24px rgba(194,65,12,0.08)' : undefined }}
                        >
                          {/* Order Header */}
                          <button
                            className="w-full text-right p-4 flex items-start gap-3 hover:bg-orange-50/50 transition-colors"
                            onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                          >
                            {/* Icon */}
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg,#fef3e2,#fde7c4)' }}>
                              🧺
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                                <span className="font-black text-gray-900 text-base">طلب #{order.id}</span>
                                <span className="text-xl font-black" style={{ color: '#7c2d12' }}>{order.total} <span className="text-sm font-bold text-gray-400">ج.م</span></span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 flex-wrap mb-2">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(order.createdAt!).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>{order.items.length} منتج</span>
                              </div>

                              {/* Live status timeline (always visible per order) */}
                              <OrderTimeline orderId={order.id} />
                            </div>

                            {/* Expand arrow */}
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
                              style={{ background: isOpen ? '#fef3e2' : '#f9fafb' }}
                            >
                              <ChevronDown className="w-4 h-4" style={{ color: isOpen ? '#c2410c' : '#9ca3af' }} />
                            </motion.div>
                          </button>

                          {/* Order Details (expanded) */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden border-t"
                                style={{ borderColor: '#fcd9bd' }}
                              >
                                <div className="p-4 space-y-3" style={{ background: 'linear-gradient(to bottom,#fff8f4,white)' }}>

                                  {/* Address + Payment row */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                                      <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 mb-0.5">العنوان</p>
                                        <p className="text-xs font-bold text-gray-700 leading-relaxed">{order.address || 'غير محدد'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-400 mb-0.5">طريقة الدفع</p>
                                        <p className="text-xs font-black text-gray-800">
                                          {order.paymentMethod === 'cash' ? '💵 كاش عند الاستلام'
                                            : order.paymentMethod === 'vodafone' ? '📱 فودافون كاش'
                                            : order.paymentMethod === 'instapay' ? '⚡ إنستا باي'
                                            : '💳 بطاقة'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Products */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-black text-gray-600">المنتجات</p>
                                    {order.items.map((item: any, i: number) => (
                                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm">
                                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-orange-50 shrink-0">
                                          <img
                                            src={item.product?.image || '/logo.png'}
                                            alt={item.productName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-black text-gray-900 text-sm truncate">{item.productName}</p>
                                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                            <span className="text-[11px] font-bold text-gray-400">{item.quantity} × {item.price} ج.م</span>
                                            {item.cutting && <span className="text-[9px] font-black bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full border border-orange-100">✂️ {item.cutting}</span>}
                                            {item.packaging && <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100">📦 {item.packaging}</span>}
                                          </div>
                                        </div>
                                        <span className="font-black text-sm shrink-0" style={{ color: '#7c2d12' }}>{(item.price * item.quantity).toFixed(0)} ج.م</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Total */}
                                  <div className="flex justify-between items-center p-3 rounded-xl border" style={{ background: 'linear-gradient(to left,#fef3e2,#fff8f4)', borderColor: '#fcd9bd' }}>
                                    <span className="font-bold text-gray-600 text-sm">الإجمالي</span>
                                    <span className="font-black text-xl" style={{ color: '#7c2d12' }}>{order.total} <span className="text-sm font-bold text-gray-400">ج.م</span></span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ═══ ADDRESS ═══ */}
              {activeTab === 'address' && (
                <div className="space-y-4">
                  {/* Current address display */}
                  {!isEditingAddress ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl overflow-hidden border border-orange-100">
                        <div className="px-5 py-3.5 flex items-center gap-2" style={{ background: 'linear-gradient(to left,#7c2d12,#c2410c)' }}>
                          <Navigation className="w-4 h-4 text-white/80" />
                          <h3 className="font-black text-white">عنوان التوصيل الرئيسي</h3>
                        </div>
                        <div className="p-5 space-y-3 bg-white">
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: 'المدينة', value: user.city, icon: Building },
                              { label: 'الحي', value: user.district, icon: MapPin },
                              { label: 'الشارع', value: user.street, icon: Navigation },
                              { label: 'المبنى', value: user.building, icon: Building },
                            ].map((f) => (
                              <div key={f.label} className="rounded-xl p-3 border" style={{ background: '#fffbf8', borderColor: '#fde8d0' }}>
                                <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1 mb-1">
                                  <f.icon className="w-3 h-3" /> {f.label}
                                </p>
                                <p className="font-black text-gray-800 text-sm">{f.value || '—'}</p>
                              </div>
                            ))}
                          </div>
                          {user.landmark && (
                            <div className="rounded-xl p-3 border" style={{ background: '#fffbf8', borderColor: '#fde8d0' }}>
                              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">🗺️ معلم مميز</p>
                              <p className="font-bold text-gray-700 text-sm">{user.landmark}</p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
                            {user.address && (
                              <button
                                onClick={() => { navigator.clipboard.writeText(user.address || ''); toast({ title: '📋 تم نسخ العنوان' }); }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 font-bold text-gray-500 text-sm hover:bg-gray-100 transition-colors"
                              >
                                <Copy className="w-4 h-4" /> نسخ
                              </button>
                            )}
                            <button
                              onClick={() => setIsEditingAddress(true)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-white shadow-md text-sm"
                              style={{ background: 'linear-gradient(to left,#7c2d12,#c2410c)' }}
                            >
                              {user.address ? '✏️ تعديل العنوان' : '➕ إضافة عنوان'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { title: 'توصيل أسرع', desc: 'حدد موقعك بدقة على الخريطة لتوصيل فوري', color: '#2563eb', bg: '#eff6ff', icon: Truck },
                          { title: 'بياناتك محمية', desc: 'عنوانك مشفر ويُستخدم لأغراض التوصيل فقط', color: '#059669', bg: '#f0fdf4', icon: Shield },
                        ].map((tip) => (
                          <div key={tip.title} className="rounded-2xl p-3.5 flex items-start gap-3" style={{ background: tip.bg }}>
                            <tip.icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: tip.color }} />
                            <div>
                              <p className="font-black text-gray-900 text-xs">{tip.title}</p>
                              <p className="text-[10px] font-bold text-gray-500 leading-relaxed mt-0.5">{tip.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'المدينة', value: city, setter: setCity, ph: 'القاهرة' },
                          { label: 'الحي', value: district, setter: setDistrict, ph: 'مدينة نصر' },
                          { label: 'الشارع', value: street, setter: setStreet, ph: 'اسم الشارع', full: true },
                          { label: 'رقم المبنى', value: building, setter: setBuilding, ph: '12' },
                          { label: 'معلم مميز', value: landmark, setter: setLandmark, ph: 'بجوار مسجد...' },
                        ].map((f) => (
                          <div key={f.label} className={`space-y-1.5 ${(f as any).full ? 'col-span-2' : ''}`}>
                            <Label className="text-xs font-black text-gray-700">{f.label}</Label>
                            <Input value={f.value} onChange={(e) => f.setter(e.target.value)} placeholder={f.ph} className="rounded-xl h-11 border-gray-100 bg-gray-50 font-bold" />
                          </div>
                        ))}
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <MapPicker location={gpsLocation} onLocationSelect={(lat, lng) => setGpsLocation({ lat, lng })} />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setIsEditingAddress(false)} disabled={isSavingAddress} className="px-5 py-3 rounded-xl font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-sm">
                          إلغاء
                        </button>
                        <button onClick={handleSaveAddress} disabled={isSavingAddress} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white shadow-lg text-sm" style={{ background: 'linear-gradient(to left,#7c2d12,#c2410c)' }}>
                          {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : '✅ حفظ العنوان'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ═══ SETTINGS ═══ */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {/* Account info card */}
                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <h3 className="font-black text-gray-700 text-sm">معلومات الحساب</h3>
                    </div>
                    <div className="p-4 space-y-3 bg-white">
                      {/* Username */}
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><User className="w-3 h-3" /> اسم المستخدم</span>
                          {!isEditingUsername ? (
                            <button onClick={() => { setNewUsername(user.username); setIsEditingUsername(true); }} className="text-[10px] font-black text-orange-600 hover:underline">تعديل</button>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={handleSaveUsername} disabled={isSavingUsername} className="text-[10px] font-black text-white bg-emerald-500 px-2.5 py-1 rounded-lg">
                                {isSavingUsername ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'حفظ'}
                              </button>
                              <button onClick={() => setIsEditingUsername(false)} className="text-[10px] font-bold text-gray-500 px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">إلغاء</button>
                            </div>
                          )}
                        </div>
                        {isEditingUsername ? (
                          <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUsername(); }} className="h-9 rounded-lg border-orange-200 bg-white font-bold text-sm" autoFocus />
                        ) : (
                          <p className="font-black text-gray-900">{user.username}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1 mb-1"><Mail className="w-3 h-3" /> البريد الإلكتروني</p>
                          <p className="font-black text-gray-900 text-sm">{user.email}</p>
                        </div>
                        <span className="text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">موثق ✓</span>
                      </div>

                      {/* Phone */}
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1 mb-1"><Phone className="w-3 h-3" /> رقم الجوال</p>
                        <p className="font-black text-gray-900 text-sm">{user.phone || 'لم يُضف رقم بعد'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Security card */}
                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <h3 className="font-black text-gray-700 text-sm">الأمان</h3>
                    </div>
                    <div className="p-4 space-y-2 bg-white">
                      {[
                        { icon: Lock, label: 'تغيير كلمة المرور', sub: 'آمّن حسابك بكلمة مرور قوية', color: '#7c2d12', bg: '#fef3e2' },
                        { icon: Shield, label: 'المصادقة الثنائية', sub: 'طبقة أمان إضافية - قريباً', color: '#7c3aed', bg: '#ede9fe', badge: 'قريباً' },
                      ].map((item) => (
                        <button key={item.label} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-orange-50/60 hover:border-orange-100 transition-all text-right">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-gray-900 text-sm">{item.label}</p>
                            <p className="text-[10px] font-bold text-gray-400">{item.sub}</p>
                          </div>
                          {(item as any).badge ? (
                            <span className="text-[9px] font-black text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{(item as any).badge}</span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-black text-red-600 bg-red-50 border-2 border-red-100 hover:bg-red-100 transition-all text-sm"
                  >
                    {logoutMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                    تسجيل الخروج
                  </button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

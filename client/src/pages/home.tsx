import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import {
  ArrowLeft, Clock, Truck, ShieldCheck, Star,
  Instagram, Facebook, MessageCircle, Phone, MapPin,
  Award, Flame, ChevronRight, Leaf, Coffee, Package, Sparkles
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { type Product, type Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { getRoleRedirect } from "@/lib/role-redirect";
import logoImg from "@assets/logo_1779558557784_1781284041844.png";

/* ── Animated Counter ── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString('ar-EG')}{suffix}</span>;
}

/* ── Floating Particle ── */
function FloatingParticle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/10 backdrop-blur-sm pointer-events-none"
      style={{ left: x, top: y, width: size, height: size }}
      animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
      transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isBrowsing = params.get('browse') === '1';
    if (!authLoading && user && !isBrowsing) {
      const staffRoles = ['admin', 'delivery', 'butcher', 'manager', 'accountant', 'support', 'designer'];
      if (user.isAdmin || (user.role && staffRoles.includes(user.role))) {
        setLocation(getRoleRedirect(user.role, !!user.isAdmin));
      }
    }
  }, [user, authLoading, setLocation]);

  const { data: siteSettings = [] } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const settingsMap = siteSettings.reduce((acc: any, curr: any) => {
    try { acc[curr.key] = JSON.parse(curr.value); }
    catch (e) { acc[curr.key] = curr.value; }
    return acc;
  }, {});

  const isStoreClosed = settingsMap.store_status === 'closed';

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p, categoryId: p.category_id, isFeatured: p.is_featured,
        isActive: p.is_active, imageObjectPosition: p.image_object_position
      })) as Product[];
    }
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      if (!data || data.length === 0) {
        return [
          { id: 'nuts', name: 'مكسرات وبذور', icon: '🥜', image: null, parentId: null },
          { id: 'chocolate', name: 'شوكولاتة', icon: '🍫', image: null, parentId: null },
          { id: 'dates', name: 'تمور ومعمول', icon: '🌴', image: null, parentId: null },
          { id: 'coffee', name: 'قهوة وشاي', icon: '☕', image: null, parentId: null },
          { id: 'eastern_sweets', name: 'حلوى شرقية', icon: '🍯', image: null, parentId: null },
          { id: 'biscuits', name: 'بسكويت وكوكيز', icon: '🍪', image: null, parentId: null },
          { id: 'chips', name: 'مقرمشات وشيبس', icon: '🍿', image: null, parentId: null },
          { id: 'dried_fruits', name: 'فواكه مجففة', icon: '🍇', image: null, parentId: null },
        ] as Category[];
      }
      return data
        .filter(c => c.id !== 'all')
        .map((c: any) => {
          const nameOverrides: Record<string, string> = {
            'candy': 'حلوى شرقية',
            'toys': 'هدايا وتغليف',
            'lollipop': 'حلوى متنوعة',
          };
          const iconOverrides: Record<string, string> = {
            'candy': '🍯',
            'toys': '🎁',
            'lollipop': '🍬',
          };
          return {
            ...c,
            name: nameOverrides[c.id] || c.name,
            icon: iconOverrides[c.id] || c.icon,
            parentId: c.parent_id ?? null,
          };
        }) as Category[];
    }
  });

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 8);

  const categoryImages: Record<string, string> = {
    chocolate: '/images/categories/chocolate.png',
    nuts: '/images/categories/nuts.png',
    dates: '/images/categories/dates.png',
    soda: '/images/categories/soda.png',
    energy: '/images/categories/energy.png',
    jelly: '/images/categories/jelly.png',
    biscuits: '/images/categories/biscuits.png',
    toffee: '/images/categories/toffee.png',
    candy: '/images/categories/eastern_sweets.png',
    coffee: '/images/categories/coffee.png',
    chips: '/images/categories/chips.png',
    eastern_sweets: '/images/categories/eastern_sweets.png',
    water: '/images/categories/soda.png',
    dried_fruits: '/images/categories/dates.png',
    toys: '/images/categories/biscuits.png',
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-[#fdf8f4] flex items-center justify-center">
        <div className="space-y-4 w-full px-6">
          <Skeleton className="h-[480px] w-full rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-[#fdf8f4] pb-20 md:pb-0 font-sans overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Navbar />
      <MobileHeader />

      {isStoreClosed && (
        <div className="bg-rose-600 text-white py-3 px-6 text-center font-black animate-pulse z-[100] sticky top-0 md:top-[80px] shadow-lg flex items-center justify-center gap-3">
          <Clock className="w-5 h-5" />
          <span className="text-sm">عذراً، المحل مغلق حالياً. لا يمكن استقبال طلبات جديدة.</span>
        </div>
      )}

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] md:min-h-[100vh] w-full overflow-hidden flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-banner.png"
            alt="محمصة بدر الدين"
            className="w-full h-full object-cover object-center scale-105"
            style={{ filter: "brightness(0.75)" }}
          />
          {/* Subtle dark overlay — left side only for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Floating particles */}
        <FloatingParticle delay={0} x="70%" y="20%" size={60} />
        <FloatingParticle delay={1.2} x="80%" y="55%" size={40} />
        <FloatingParticle delay={2.4} x="88%" y="35%" size={25} />
        <FloatingParticle delay={0.8} x="60%" y="70%" size={18} />

        {/* Content */}
        <div className="relative z-20 container mx-auto px-6 py-24 md:py-0">
          <div className="max-w-2xl">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold mb-6 shadow-lg"
            >
              <Flame className="h-3.5 w-3.5 text-[#e8833b]" />
              <span>محمصة بدر الدين — جودة لا تُضاهى</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
              className="text-5xl sm:text-6xl md:text-8xl font-black text-white leading-tight tracking-tighter mb-4"
              style={{ textShadow: "0 4px 30px rgba(0,0,0,0.4)" }}
            >
              بدر الدين
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <span
                className="text-4xl sm:text-5xl md:text-7xl font-black block mb-8 leading-tight"
                style={{
                  background: "linear-gradient(to left, #f59e0b, #e8833b, #f97316)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 4px 12px rgba(232,131,59,0.4))"
                }}
              >
                طعم الأصالة
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base md:text-xl text-gray-300 font-medium leading-relaxed mb-10 max-w-lg"
            >
              مكسرات وبن محمص بحرفية عالية، شوكولاتة مستوردة وحلوى متنوعة — كل ما تشتهيه في مكان واحد.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/products">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-3 h-14 px-8 rounded-2xl text-white font-black text-lg shadow-2xl"
                  style={{
                    background: "linear-gradient(to left, #7c2d12, #e8833b)",
                    boxShadow: "0 8px 32px rgba(232,131,59,0.4), 0 2px 8px rgba(0,0,0,0.3)"
                  }}
                >
                  تسوق الآن
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>
              </Link>
              <a href="https://api.whatsapp.com/send?phone=201110085927" target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-3 h-14 px-8 rounded-2xl font-bold text-white text-base border-2 border-white/25 backdrop-blur-md bg-white/10"
                >
                  <MessageCircle className="h-5 w-5 text-green-400" />
                  تواصل معنا
                </motion.button>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 text-xs font-bold"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-transparent to-white/30" />
          <span className="tracking-widest text-[10px]">اسحب للأسفل</span>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section className="bg-gradient-to-l from-[#7c2d12] to-[#3d1408] py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-x-reverse md:divide-white/10">
            {[
              { value: 500, suffix: "+", label: "منتج متاح" },
              { value: 10000, suffix: "+", label: "عميل سعيد" },
              { value: 15, suffix: " عام", label: "خبرة في المجال" },
              { value: 99, suffix: "%", label: "رضا العملاء" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center text-white md:px-8"
              >
                <div className="text-3xl md:text-4xl font-black mb-1 text-[#f59e0b]">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs md:text-sm text-white/70 font-bold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#7c2d12]/8 text-[#7c2d12] text-xs font-black mb-3 tracking-wider">لماذا بدر الدين؟</span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 font-heading">مميزاتنا التي تميزنا</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                icon: Star,
                emoji: "⭐",
                title: "جودة مضمونة",
                desc: "مكسرات وبن محمص طازج يومياً بأعلى المعايير",
                gradient: "from-amber-50 to-yellow-50",
                iconColor: "text-amber-600",
                border: "border-amber-100",
              },
              {
                icon: Truck,
                emoji: "🚚",
                title: "شحن سريع وآمن",
                desc: "تغليف محكم مفرغ من الهواء للحفاظ على القرمشة",
                gradient: "from-orange-50 to-red-50",
                iconColor: "text-orange-600",
                border: "border-orange-100",
              },
              {
                icon: Leaf,
                emoji: "🌿",
                title: "فرز يدوي ونقي",
                desc: "منتجات منتقاة بعناية خالية من الشوائب",
                gradient: "from-green-50 to-emerald-50",
                iconColor: "text-green-600",
                border: "border-green-100",
              },
              {
                icon: Coffee,
                emoji: "☕",
                title: "تحميص مخصص",
                desc: "اختر درجة التحميص للمكسرات ونوع الطحن للبن",
                gradient: "from-brown-50 to-amber-50",
                iconColor: "text-[#7c2d12]",
                border: "border-amber-100",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`bg-gradient-to-br ${f.gradient} p-5 md:p-8 rounded-[2rem] border ${f.border} flex flex-col items-center text-center gap-4 cursor-default group transition-all`}
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
              >
                <motion.div
                  className="text-4xl md:text-5xl"
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                >
                  {f.emoji}
                </motion.div>
                <div>
                  <h4 className="font-black text-gray-900 text-sm md:text-base mb-1">{f.title}</h4>
                  <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CATEGORIES GRID
      ══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-[#fdf8f4]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-end mb-10 px-1"
          >
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#7c2d12]/8 text-[#7c2d12] text-xs font-black mb-2 tracking-wider">تشكيلتنا</span>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 font-heading">أقسامنا</h2>
              <p className="text-gray-500 font-medium text-sm mt-1">اختر من أجود المنتجات</p>
            </div>
            <Link href="/products">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 text-[#7c2d12] font-black text-sm bg-[#7c2d12]/8 px-4 py-2 rounded-xl hover:bg-[#7c2d12]/15 transition-colors"
              >
                عرض الكل
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {categories.filter(c => c.id !== 'all').slice(0, 8).map((cat, i) => {
              const imgSrc = cat.image || categoryImages[cat.id];
              return (
                <Link key={cat.id} href={`/products?category=${cat.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -6, scale: 1.03 }}
                    className="group cursor-pointer relative overflow-hidden rounded-[1.75rem] aspect-square shadow-lg"
                    style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                  >
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, hsl(${20 + i * 15} 58% ${28 + i * 3}%), hsl(${26 + i * 10} 80% ${45 + i * 2}%))`
                        }}
                      />
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-[#7c2d12]/80 transition-all duration-500" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end p-4 md:p-5 text-white">
                      <motion.span
                        className="text-3xl md:text-4xl mb-2 drop-shadow-lg"
                        whileHover={{ scale: 1.3, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {cat.icon}
                      </motion.span>
                      <h3 className="text-sm md:text-base font-black text-center drop-shadow-lg leading-tight">{cat.name}</h3>
                      <motion.div
                        className="h-0.5 bg-[#e8833b] mt-2 rounded-full"
                        initial={{ width: 0 }}
                        whileHover={{ width: 48 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/5 group-hover:via-white/0 group-hover:to-white/0 transition-all duration-500" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURED PRODUCTS
      ══════════════════════════════════════════ */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex justify-between items-end mb-10 px-1"
            >
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#7c2d12]/8 text-[#7c2d12] text-xs font-black mb-2 tracking-wider">الأكثر طلباً</span>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 font-heading">الأكثر مبيعاً</h2>
                <p className="text-gray-500 font-medium text-sm mt-1">المنتجات المفضلة لدى عملائنا</p>
              </div>
              <Link href="/products">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 text-[#7c2d12] font-black text-sm bg-[#7c2d12]/8 px-4 py-2 rounded-xl hover:bg-[#7c2d12]/15 transition-colors"
                >
                  عرض الكل
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </motion.div>

            {/* Mobile: horizontal scroll */}
            <div className="md:hidden flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex-none w-[170px] snap-start"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>

            {/* Desktop: grid */}
            <div className="hidden md:grid grid-cols-4 gap-6">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          WHATSAPP CTA
      ══════════════════════════════════════════ */}
      <section className="py-14 bg-[#fdf8f4]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] p-8 md:p-12 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}
          >
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #22c55e33 0%, transparent 50%), radial-gradient(circle at 80% 50%, #16a34a22 0%, transparent 50%)" }}
            />
            <div className="relative z-10">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl md:text-4xl font-black text-gray-900 mb-3">لديك استفسار؟</h3>
              <p className="text-gray-600 text-sm md:text-base mb-8 max-w-md mx-auto">تواصل معنا مباشرة عبر واتساب وسيرد عليك فريقنا في أقل من دقيقة!</p>
              <a href="https://api.whatsapp.com/send?phone=201110085927" target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.06, boxShadow: "0 12px 40px rgba(34,197,94,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-3 h-14 px-10 rounded-2xl text-white font-black text-base"
                  style={{ background: "linear-gradient(to left, #15803d, #22c55e)", boxShadow: "0 8px 28px rgba(34,197,94,0.35)" }}
                >
                  <MessageCircle className="h-5 w-5" />
                  تواصل عبر واتساب
                </motion.button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ background: "linear-gradient(180deg, #1a1208 0%, #120d05 100%)" }}>
        {/* Gradient top border */}
        <div className="h-px w-full" style={{ background: "linear-gradient(to left, transparent 0%, #7c2d12 25%, #e8833b 50%, #7c2d12 75%, transparent 100%)" }} />

        <div className="container mx-auto px-5 pt-10 pb-28 md:pb-10">

          {/* ── Row 1: Brand + Socials + WhatsApp ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-8 border-b border-white/[0.06]">
            {/* Logo + Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#3d1408,#7c2d12)" }}>
                <img src={logoImg} alt="بدر الدين" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <div className="font-black text-base text-white leading-tight">بدر الدين</div>
                <div className="text-[10px] text-[#e8833b]/70 font-bold">محمصة الجودة والنكهة</div>
              </div>
            </div>

            {/* Social + WhatsApp */}
            <div className="flex items-center gap-2.5">
              {[
                { href: "https://www.instagram.com/badr_alden_roastery", bg: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", icon: <Instagram className="h-3.5 w-3.5" /> },
                { href: "https://www.facebook.com/share/16sijBdhH5/", bg: "#1877f2", icon: <Facebook className="h-3.5 w-3.5" /> },
                { href: "https://www.tiktok.com/@badr.alden19", bg: "#111", icon: <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.53V6.77a4.84 4.84 0 01-1.01-.08z"/></svg> },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
                  style={{ background: s.bg }}>
                  {s.icon}
                </a>
              ))}
              <a href="https://api.whatsapp.com/send?phone=201110085927" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-white text-[11px] font-black hover:opacity-90 transition-opacity"
                style={{ background: "#25d366" }}>
                <MessageCircle className="h-3.5 w-3.5" />
                واتساب
              </a>
            </div>
          </div>

          {/* ── Row 2: 4-col grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 py-8 border-b border-white/[0.06]">

            {/* Quick Links */}
            <div>
              <p className="text-[10px] font-black text-[#e8833b] tracking-widest mb-3">روابط سريعة</p>
              <div className="space-y-2">
                {[
                  { label: "الرئيسية", href: "/" },
                  { label: "المنتجات", href: "/products" },
                  { label: "سلة الشراء", href: "/cart" },
                  { label: "حسابي", href: "/profile" },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="block text-xs text-gray-500 hover:text-white transition-colors font-medium">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[10px] font-black text-[#e8833b] tracking-widest mb-3">قانوني</p>
              <div className="space-y-2">
                {[
                  { label: "سياسة الخصوصية", href: "/legal/privacy" },
                  { label: "الشروط والأحكام", href: "/legal/terms" },
                  { label: "سياسة الاسترجاع", href: "/legal/returns" },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="block text-xs text-gray-500 hover:text-white transition-colors font-medium">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[10px] font-black text-[#e8833b] tracking-widest mb-3">تواصل</p>
              <div className="space-y-2.5">
                <a href="https://api.whatsapp.com/send?phone=201110085927" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 group">
                  <MessageCircle className="h-3.5 w-3.5 text-[#25d366] shrink-0" />
                  <span className="text-xs text-gray-500 group-hover:text-white transition-colors font-medium" dir="ltr">+20 111 008 5927</span>
                </a>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#e8833b] shrink-0" />
                  <span className="text-xs text-gray-500 font-medium">8 ص — 11 م يومياً</span>
                </div>
                <a href="https://www.instagram.com/badr_alden_roastery" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 group">
                  <Instagram className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                  <span className="text-xs text-gray-500 group-hover:text-white transition-colors font-medium">@badr_alden_roastery</span>
                </a>
              </div>
            </div>

            {/* Payment */}
            <div>
              <p className="text-[10px] font-black text-[#e8833b] tracking-widest mb-3">طرق الدفع</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "كاش", icon: "💵" },
                  { label: "فودافون", icon: "📱" },
                  { label: "إنستا باي", icon: "⚡" },
                  { label: "Visa", icon: "💳" },
                ].map(m => (
                  <div key={m.label}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03]">
                    <span className="text-[11px]">{m.icon}</span>
                    <span className="text-[9px] font-black text-gray-500">{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 px-2 py-1.5 rounded-lg bg-[#e8833b]/8 border border-[#e8833b]/15 text-center">
                <span className="text-[9px] font-black text-[#e8833b]">شامل ضريبة 14%</span>
              </div>
            </div>
          </div>

          {/* ── Bottom strip ── */}
          <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] text-gray-700 font-bold">© 2026 محمصة بدر الدين — جميع الحقوق محفوظة</p>
            <div className="flex gap-4">
              {[
                { label: "الخصوصية", href: "/legal/privacy" },
                { label: "الشروط", href: "/legal/terms" },
                { label: "الاسترجاع", href: "/legal/returns" },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="text-[10px] text-gray-700 hover:text-[#e8833b] transition-colors font-bold">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </footer>

      <BottomNav />
    </motion.div>
  );
}

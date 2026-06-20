import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { ProductCard } from "@/components/ui/product-card";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Filter, ShoppingBag, Flame, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { type Product, type Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";


export default function Products() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return (data || [])
        .filter((p: any) => {
          const excludedProducts = [
            'حاشي لباني (بالكيلو)', 'عجل بلدي رضيع (بالكيلو)',
            'بقدونس', 'الكزبرة', 'كزبرة', 'نعناع', 'جرجير',
            'زهرة (قرنبيط)', 'ملفوف (كرنب)'
          ];
          return !excludedProducts.includes(p.name) && p.is_active !== false;
        })
        .map((p: any) => {
          let imagePos = p.image_object_position;
          if (p.name === 'خروف حري كامل' || p.name === 'تيس بلدي محايل') imagePos = 'object-top';
          return {
            ...p,
            categoryId: p.category_id,
            isFeatured: p.is_featured,
            isActive: p.is_active !== false,
            imageObjectPosition: imagePos
          };
        }).concat([
          !data.find((p: any) => p.name === 'خروف نعيمي متوسط') ? {
            id: 998,
            name: 'خروف نعيمي متوسط',
            price: 1200.00,
            unit: 'ذبيحة',
            image: '/images/lamb/خروف نعيمي متوسط.png',
            description: 'خروف نعيمي بلدي حجم متوسط، مثالي للعائلة الصغيرة.',
            categoryId: 'lamb',
            isFeatured: false,
            badge: null,
            size: 'متوسط',
            weight: '7-9 كجم',
            imageObjectPosition: null
          } : [],
          !data.find((p: any) => p.name === 'نعيمي لباني') ? {
            id: 999,
            name: 'نعيمي لباني',
            price: 900.00,
            unit: 'ذبيحة',
            image: '/images/lamb/نعيمي لباني.png',
            description: 'خروف نعيمي صغير (لباني)، لحم طري جداً ولذيذ.',
            categoryId: 'lamb',
            isFeatured: true,
            badge: 'لباني',
            size: 'صغير',
            weight: '5-7 كجم',
            imageObjectPosition: null
          } : []
        ].flat()) as Product[];
    }
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      if (!data || data.length === 0) {
        return [
          { id: 'all', name: 'الكل', icon: '🍽️', image: '' },
          { id: 'lamb', name: 'نعيمي', icon: '🐑', image: '' },
          { id: 'beef', name: 'عجل', icon: '🐄', image: '' },
          { id: 'chicken', name: 'دواجن', icon: '🐔', image: '' },
        ] as Category[];
      }
      const sortedData = (data || []).sort((a: any, b: any) => {
        const order = ['lamb', 'beef', 'chicken'];
        const iA = order.indexOf(a.id), iB = order.indexOf(b.id);
        if (iA !== -1 && iB !== -1) return iA - iB;
        if (iA !== -1) return -1;
        if (iB !== -1) return 1;
        return 0;
      });
      return [{ id: 'all', name: 'الكل', icon: '🍽️' }, ...sortedData] as Category[];
    }
  });

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.categoryId === activeCategory;
    const matchesSearch = product.name.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const isLoading = productsLoading || categoriesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 md:pb-0" style={{ background: "linear-gradient(135deg, #fef7f0 0%, #fff8f5 50%, #fef3ee 100%)" }}>
        <Navbar />
        <MobileHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-40 mb-6 rounded-2xl" />
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-[20px] overflow-hidden shadow-sm">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-6 w-1/2 rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen pb-24 md:pb-0 font-sans"
      style={{ background: "linear-gradient(160deg, #fef7f0 0%, #fff8f5 40%, #fef3ee 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Navbar />
      <MobileHeader />

      {/* Store Closed Banner */}
      {isStoreClosed && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-l from-red-700 to-[#7c2d12] text-white py-3 px-6 text-center font-black sticky top-0 z-[100] shadow-lg flex items-center justify-center gap-3"
        >
          <span className="text-base">⚠️ نعتذر، المتجر مغلق ولا يمكن استقبال طلبات حالياً</span>
        </motion.div>
      )}

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7c2d12]/8 via-[#c2410c]/4 to-transparent pointer-events-none" />

        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#7c2d12]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-8 right-32 w-32 h-32 bg-[#c2410c]/6 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 pt-6 pb-4 md:pt-10 md:pb-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-[#7c2d12] to-[#c2410c] rounded-xl flex items-center justify-center shadow-md">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-[#3d1408]">منتجاتنا</h1>
            </div>
            <p className="text-sm text-[#7c2d12]/60 font-medium mr-11">
              {filteredProducts.length} منتج متوفر
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-6">

        {/* ── Search Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-5"
        >
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7c2d12]/50" />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              className="w-full h-11 pr-11 pl-4 rounded-2xl bg-white border border-[#7c2d12]/10 shadow-sm focus:outline-none focus:border-[#7c2d12]/40 focus:shadow-md text-sm font-medium text-gray-700 placeholder:text-gray-400 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Category Filter ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6"
        >
          {/* Mobile & Desktop: horizontal scroll pills */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat, index) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap border",
                  activeCategory === cat.id
                    ? "bg-gradient-to-l from-[#7c2d12] to-[#c2410c] text-white border-transparent shadow-md shadow-[#7c2d12]/20 scale-105"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#7c2d12]/30 hover:text-[#7c2d12]"
                )}
              >
                <span className="text-base">{cat.icon}</span>
                {cat.name}
                {activeCategory === cat.id && cat.id !== 'all' && (
                  <span className="bg-white/20 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {filteredProducts.length}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Product Grid ── */}
        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div
              key={activeCategory + searchQuery}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
                >
                  <ProductCard
                    product={product}
                    relatedProducts={filteredProducts}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-24 gap-4"
            >
              <div className="w-16 h-16 bg-[#7c2d12]/10 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-[#7c2d12]/40" />
              </div>
              <p className="text-gray-500 font-medium">لا توجد منتجات مطابقة</p>
              <button
                className="text-[#7c2d12] font-bold text-sm underline underline-offset-2"
                onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
              >
                عرض كل المنتجات
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </motion.div>
  );
}

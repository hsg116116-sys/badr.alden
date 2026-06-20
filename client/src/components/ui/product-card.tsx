import { type Product } from "@shared/schema";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, ChevronDown, Maximize2, X, Star, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { type ProductAttribute } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface ProductCardProps {
  product: Product;
  relatedProducts?: Product[];
  showNavigation?: boolean;
  showArrows?: boolean;
}

export function ProductCard({ product, relatedProducts = [], showNavigation = false, showArrows = false }: ProductCardProps) {
  const categoryProducts = relatedProducts.length > 0 ? relatedProducts : [product];
  const [activeProduct, setActiveProduct] = useState<Product>(product);

  const [quantity, setQuantity] = useState(1);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedCutting, setSelectedCutting] = useState("");
  const [selectedPackaging, setSelectedPackaging] = useState("");
  const [selectedExtra, setSelectedExtra] = useState("");
  const [note, setNote] = useState("");
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { data: attributes = [] } = useQuery<ProductAttribute[]>({
    queryKey: ['product_attributes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('product_attributes').select('*').eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: isOptionsOpen
  });

  const cuttingMethods = attributes.filter(a => a.type === 'cutting');
  const packagingMethods = attributes.filter(a => a.type === 'packaging');
  const extraMethods = attributes.filter(a => a.type === 'extra');

  useEffect(() => {
    if (isOptionsOpen && attributes.length > 0) {
      if (!selectedCutting && cuttingMethods.length > 0) setSelectedCutting(cuttingMethods[0].name);
      if (!selectedPackaging && packagingMethods.length > 0) setSelectedPackaging(packagingMethods[0].name);
      if (!selectedExtra && extraMethods.length > 0) setSelectedExtra(extraMethods[0].name);
    }
  }, [isOptionsOpen, attributes]);

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const { addItem } = useCart();
  const { toast } = useToast();

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => Math.max(1, q - 1));

  const handleAddToCart = () => {
    addItem(activeProduct, quantity, {
      cutting: selectedCutting,
      packaging: selectedPackaging,
      extras: selectedExtra,
      notes: note
    });
    setIsOptionsOpen(false);
    toast({
      title: "✅ تمت الإضافة للسلة",
      description: `${quantity} × ${activeProduct.name}`,
    });
  };

  return (
    <>
      <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <DialogTrigger asChild>
          <motion.div
            className="cursor-pointer group relative select-none"
            whileHover={{ y: -5, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            {/* Card Shell */}
            <div
              className="relative bg-white"
              style={{
                borderRadius: "18px",
                boxShadow: isHovered
                  ? "0 14px 40px rgba(124,45,18,0.2), 0 4px 14px rgba(0,0,0,0.07)"
                  : "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
                transition: "box-shadow 0.3s ease",
                overflow: "hidden",
              }}
            >
              {/* ── Image ── */}
              <div
                className="relative"
                style={{ aspectRatio: "1/0.85", overflow: "hidden", borderRadius: "18px 18px 0 0" }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[#7c2d12]/8 to-[#c2410c]/8 z-10"
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />

                <motion.img
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  className={`w-full h-full object-cover ${activeProduct.imageObjectPosition || 'object-center'}`}
                  animate={{ scale: isHovered ? 1.08 : 1 }}
                  transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                />

                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white/20 to-transparent" />

                {/* Badge */}
                {activeProduct.badge && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                    className={`absolute top-2.5 right-2.5 z-20 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-xl flex items-center gap-1 backdrop-blur-sm ${
                      activeProduct.badge === 'وفر المال'
                        ? 'bg-gradient-to-l from-orange-500 to-amber-500'
                        : 'bg-gradient-to-l from-[#7c2d12] to-[#c2410c]'
                    }`}
                    style={{ boxShadow: "0 3px 12px rgba(124,45,18,0.4)" }}
                  >
                    {activeProduct.badge === 'طازج' && <Flame className="w-3 h-3" />}
                    {activeProduct.badge}
                  </motion.div>
                )}
              </div>

              {/* ── Content ── */}
              <motion.div
                className="relative bg-white px-2.5 pt-3 pb-2.5 md:px-3.5 md:pt-4 md:pb-3.5"
                style={{ zIndex: 10 }}
                animate={{ y: isHovered ? -2 : 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Name */}
                <h3
                  className="font-black text-[12px] md:text-[14px] text-gray-900 text-center line-clamp-1 mb-2 leading-tight"
                  style={{ fontFeatureSettings: "'kern' 1" }}
                >
                  {activeProduct.name}
                </h3>

                {/* Price row — number big, ج.م/unit small inline */}
                <div className="flex items-baseline justify-center gap-1 mb-2.5 md:mb-3">
                  <span
                    className="text-[26px] md:text-[30px] font-black leading-none"
                    style={{ color: "#1a1a1a" }}
                  >
                    {activeProduct.price.toFixed(0)}
                  </span>
                  <span className="text-[11px] md:text-[12px] font-bold text-gray-500 leading-none">
                    ج.م/{activeProduct.unit}
                  </span>
                </div>

                {/* Add Button */}
                <motion.button
                  className="w-full flex items-center justify-center gap-1.5 font-black text-white text-[12px] md:text-[13px]"
                  style={{
                    height: "38px",
                    borderRadius: "12px",
                    background: "linear-gradient(to left, #7c2d12, #c2410c)",
                    boxShadow: "0 4px 14px rgba(124,45,18,0.32)",
                  }}
                  whileHover={{
                    boxShadow: "0 6px 20px rgba(124,45,18,0.42)",
                    background: "linear-gradient(to left, #6b2410, #b53a0b)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                  <span>أضف</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </DialogTrigger>

        {/* ─── Product Detail Modal ─── */}
        <DialogContent
          className="p-0 overflow-hidden border-none gap-0 focus:outline-none bg-transparent"
          style={{
            maxWidth: "min(96vw, 860px)",
            maxHeight: "92vh",
            borderRadius: "22px",
          }}
          dir="rtl"
        >
          <div className="flex flex-col md:flex-row h-full max-h-[92vh] overflow-hidden bg-white rounded-[22px]">

            {/* ── Image Section ── */}
            <style>{`
              @media (min-width: 768px) {
                .modal-img-outer { max-height: none !important; height: 100% !important; min-height: 0 !important; }
                .modal-img-outer img { max-height: none !important; height: 100% !important; }
              }
            `}</style>
            <div
              className="modal-img-outer relative shrink-0 overflow-hidden md:w-[44%]"
              style={{ minHeight: "220px", maxHeight: "280px" }}
            >
              <div className="w-full h-full">
                <img
                  src={activeProduct.image}
                  className="w-full h-full object-cover block"
                  alt={activeProduct.name}
                  style={{ minHeight: "220px", display: "block" }}
                />
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2d0c04]/70 via-transparent to-transparent" />

              {/* Badge */}
              {activeProduct.badge && (
                <div className={`absolute top-3.5 right-3.5 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg z-20 flex items-center gap-1 ${
                  activeProduct.badge === 'وفر المال'
                    ? 'bg-orange-500'
                    : 'bg-gradient-to-r from-[#7c2d12] to-[#c2410c]'
                }`}>
                  {activeProduct.badge === 'طازج' && <Flame className="w-3 h-3" />}
                  {activeProduct.badge}
                </div>
              )}

              {/* Product name over image on mobile */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 md:hidden">
                <h2 className="text-xl font-black text-white drop-shadow-lg leading-tight">{activeProduct.name}</h2>
                {/* Price chip on mobile image */}
                <div className="mt-1.5 inline-flex items-baseline gap-1 bg-black/30 backdrop-blur-sm rounded-xl px-3 py-1">
                  <span className="text-xl font-black text-white">{activeProduct.price.toFixed(0)}</span>
                  <span className="text-[11px] font-bold text-white/80">ج.م/{activeProduct.unit}</span>
                </div>
              </div>

              {/* Zoom Button */}
              <button
                className="absolute bottom-3.5 left-3.5 z-30 rounded-full bg-black/30 hover:bg-black/50 text-white h-9 w-9 flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110"
                onClick={() => setIsZoomed(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            {/* ── Content Section ── */}
            <div className="md:w-[56%] flex flex-col min-h-0 overflow-hidden bg-white">
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

                {/* Header — desktop only */}
                <div className="hidden md:block px-5 pt-5 pb-3 border-b border-gray-50">
                  <h2 className="text-[22px] font-black text-gray-900 leading-tight">{activeProduct.name}</h2>
                </div>

                <div className="p-4 md:p-5 space-y-3">

                  {/* Price Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#2d0c04] to-[#7c2d12] p-4 text-white">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-4" />
                    <div className="relative flex items-center justify-between">
                      {/* Price */}
                      <div>
                        <p className="text-white/55 text-[11px] font-semibold mb-0.5">السعر الحالي</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[34px] font-black leading-none">{activeProduct.price.toFixed(0)}</span>
                          <span className="text-[14px] font-black text-white/75">ج.م</span>
                        </div>
                      </div>
                      {/* Unit */}
                      <div className="text-right">
                        <p className="text-white/55 text-[11px] font-semibold mb-0.5">الوحدة</p>
                        <span className="bg-white/20 px-3 py-1.5 rounded-xl text-[13px] font-black backdrop-blur-sm block">
                          {activeProduct.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {activeProduct.description && (
                    <div className="bg-orange-50 rounded-2xl p-3.5 border border-orange-100">
                      <p className="text-gray-700 text-sm leading-relaxed text-right">
                        {activeProduct.description}
                      </p>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2">

                    {/* Cutting Options */}
                    {activeProduct.hasCutting && cuttingMethods.length > 0 && (
                      <div className="rounded-2xl border border-gray-100 overflow-hidden">
                        <button
                          onClick={() => toggleSection("cutting")}
                          className="w-full bg-gray-50 px-4 py-3 flex justify-between items-center hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-bold text-gray-800 text-sm flex items-center gap-2">🔪 أنواع التقطيع</span>
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${openSections.includes("cutting") ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {openSections.includes("cutting") && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-white">
                                <RadioGroup value={selectedCutting} onValueChange={setSelectedCutting} className="grid grid-cols-3 gap-2">
                                  {cuttingMethods.map((method) => (
                                    <div key={method.id}>
                                      <RadioGroupItem value={method.name} id={`cut-${method.id}`} className="peer sr-only" />
                                      <Label htmlFor={`cut-${method.id}`} className="flex items-center justify-center p-2 rounded-xl border-2 border-transparent bg-gray-50 cursor-pointer text-xs font-bold text-center peer-data-[state=checked]:border-[#7c2d12] peer-data-[state=checked]:bg-[#7c2d12]/5 peer-data-[state=checked]:text-[#7c2d12] transition-all">
                                        {method.name}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Packaging Options */}
                    {activeProduct.hasPackaging && packagingMethods.length > 0 && (
                      <div className="rounded-2xl border border-gray-100 overflow-hidden">
                        <button
                          onClick={() => toggleSection("packaging")}
                          className="w-full bg-gray-50 px-4 py-3 flex justify-between items-center hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-bold text-gray-800 text-sm flex items-center gap-2">📦 نوع التغليف</span>
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${openSections.includes("packaging") ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {openSections.includes("packaging") && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-white">
                                <RadioGroup value={selectedPackaging} onValueChange={setSelectedPackaging} className="grid grid-cols-3 gap-2">
                                  {packagingMethods.map((method) => (
                                    <div key={method.id}>
                                      <RadioGroupItem value={method.name} id={`pack-${method.id}`} className="peer sr-only" />
                                      <Label htmlFor={`pack-${method.id}`} className="flex items-center justify-center p-2 rounded-xl border-2 border-transparent bg-gray-50 cursor-pointer text-xs font-bold text-center peer-data-[state=checked]:border-[#7c2d12] peer-data-[state=checked]:bg-[#7c2d12]/5 peer-data-[state=checked]:text-[#7c2d12] transition-all">
                                        {method.name}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Extras */}
                    {activeProduct.hasExtras && extraMethods.length > 0 && (
                      <div className="rounded-2xl border border-gray-100 overflow-hidden">
                        <button
                          onClick={() => toggleSection("extras")}
                          className="w-full bg-gray-50 px-4 py-3 flex justify-between items-center hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-bold text-gray-800 text-sm flex items-center gap-2">✨ إضافات خاصة</span>
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${openSections.includes("extras") ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {openSections.includes("extras") && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-white">
                                <RadioGroup value={selectedExtra} onValueChange={setSelectedExtra} className="grid grid-cols-2 gap-2">
                                  {extraMethods.map((method) => (
                                    <div key={method.id}>
                                      <RadioGroupItem value={method.name} id={`extra-${method.id}`} className="peer sr-only" />
                                      <Label htmlFor={`extra-${method.id}`} className="flex items-center justify-center p-2 rounded-xl border-2 border-transparent bg-gray-50 cursor-pointer text-xs font-bold text-center peer-data-[state=checked]:border-[#7c2d12] peer-data-[state=checked]:bg-[#7c2d12]/5 peer-data-[state=checked]:text-[#7c2d12] transition-all">
                                        {method.name}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* ── Sticky Footer ── */}
              <div className="p-3.5 md:p-5 border-t border-gray-100 bg-white">

                {/* Quantity */}
                <div className="flex items-center justify-between mb-3 bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="h-10 w-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#7c2d12] font-black"
                    onClick={increment}
                  >
                    <Plus className="h-5 w-5" />
                  </motion.button>
                  <span className="font-black text-xl text-gray-900 w-12 text-center">{quantity}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="h-10 w-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 font-black"
                    onClick={decrement}
                  >
                    <Minus className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="flex-[2] text-white font-black text-[15px] shadow-lg flex items-center justify-between px-4"
                    style={{
                      height: "50px",
                      borderRadius: "16px",
                      background: "linear-gradient(to left, #7c2d12, #c2410c)",
                      boxShadow: "0 6px 20px rgba(124,45,18,0.3)",
                    }}
                    onClick={handleAddToCart}
                  >
                    <span>أضف للسلة</span>
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-xl text-sm font-black flex items-baseline gap-0.5">
                      {(activeProduct.price * quantity).toFixed(0)}
                      <span className="text-[11px] font-black">ج.م</span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 rounded-2xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-sm bg-white"
                    style={{ height: "50px" }}
                    onClick={() => setIsOptionsOpen(false)}
                  >
                    متابعة
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Zoom */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-[95vw] h-[90vh] p-0 border-none bg-black/95 flex items-center justify-center rounded-2xl">
          <button
            className="absolute top-4 right-4 z-50 rounded-full bg-white/10 hover:bg-white/20 text-white h-10 w-10 flex items-center justify-center backdrop-blur-sm transition-all"
            onClick={() => setIsZoomed(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={activeProduct.image}
            alt={activeProduct.name}
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

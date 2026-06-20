import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import PosAnalyticsDashboard from "./pos-analytics-dashboard";

/* ── helpers ─────────────────────────────────────── */
function fmt(n: number) { return n.toLocaleString("ar-SY"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleString("ar-SY", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const POS_CAT_LABEL: Record<number, string> = {
  1:"شيكولاتة",2:"مكسرات",3:"تمور",4:"غازية",5:"طاقة",6:"جيلي",
  7:"بسكويت",8:"توفي",9:"كاندي",10:"قهوة",11:"شيبس",12:"شرقية",
  13:"مياه",14:"فواكه",15:"ألعاب",16:"متنوعات",17:"شرقية(2)",
};
const PAY_COLORS: Record<string,string> = {
  "نقدي":"bg-green-100 text-green-700",
  "بطاقة":"bg-blue-100 text-blue-700",
  "آجل":"bg-orange-100 text-orange-700",
};

/* ── mini bar-chart ───────────────────────────────── */
function MiniBar({ data }: { data: { label: string; value: number; max: number }[] }) {
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.label}: ${fmt(d.value)}`}>
          <div
            className="w-full rounded-t bg-amber-500 opacity-80 hover:opacity-100 transition-all"
            style={{ height: d.max > 0 ? `${Math.round((d.value / d.max) * 88)}px` : "2px" }}
          />
          <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── stat card ────────────────────────────────────── */
function KPI({ label, value, sub, icon, color }: { label:string; value:string|number; sub?:string; icon:string; color:string }) {
  return (
    <div className={`rounded-2xl p-5 ${color} flex flex-col gap-2 shadow-sm border border-white/20`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs opacity-60 font-medium">{sub}</span>
      </div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}

/* ── invoice modal ────────────────────────────────── */
function InvoiceModal({ sale, onClose }: { sale: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="bg-gradient-to-l from-[#8B5E3C] to-[#5C3D2E] p-6 rounded-t-3xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70 mb-1">رقم الفاتورة</p>
              <p className="text-2xl font-black">{sale.invoiceNumber}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl transition">×</button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div><p className="opacity-60 text-xs">العميل</p><p className="font-semibold">{sale.customerName}</p></div>
            <div><p className="opacity-60 text-xs">الكاشير</p><p className="font-semibold">{sale.cashierName || "—"}</p></div>
            <div><p className="opacity-60 text-xs">نوع الفاتورة</p><p className="font-semibold">{sale.invoiceType || "—"}</p></div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">طريقة الدفع</p>
              <p className="font-bold text-sm mt-1">{sale.paymentMethod}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">الحالة</p>
              <p className="font-bold text-sm mt-1 text-green-600">{sale.status}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">التاريخ</p>
              <p className="font-bold text-xs mt-1">{fmtDate(sale.createdAt)}</p>
            </div>
          </div>

          <div>
            <p className="font-bold text-gray-700 mb-3">المنتجات ({sale.items?.length || 0})</p>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
              {(sale.items || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {item.qty}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">سعر الوحدة: {fmt(item.unitPrice)} ج.م</p>
                  </div>
                  <p className="font-bold text-[#5C3D2E] text-sm flex-shrink-0">{fmt(item.total)} ج.م</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">المجموع الفرعي</span>
              <span className="font-semibold">{fmt(sale.subtotal)} ج.م</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-500">الخصم</span>
                <span className="text-red-500 font-semibold">-{fmt(sale.discountAmount)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between border-t border-amber-200 pt-2">
              <span className="font-bold text-gray-800">الإجمالي</span>
              <span className="font-black text-[#5C3D2E] text-lg">{fmt(sale.total)} ج.م</span>
            </div>
          </div>
          {sale.notes && <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">ملاحظة: {sale.notes}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── main page ───────────────────────────────────── */
export default function PosIntegration({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview"|"products"|"sales"|"analytics">("overview");
  const [productSearch, setProductSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [salesSearch, setSalesSearch] = useState("");
  const [salesPage, setSalesPage] = useState(0);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [importLog, setImportLog] = useState<string | null>(null);
  const PAGE_SIZE = 50;

  /* queries */
  const { data: stats } = useQuery({
    queryKey: ["/api/pos/stats"],
    queryFn: () => apiRequest("GET", "/api/pos/stats").then(r => r.json()),
    refetchInterval: 30000,
  });
  const { data: posCategories = [] } = useQuery({
    queryKey: ["/api/pos/categories"],
    queryFn: () => apiRequest("GET", "/api/pos/categories").then(r => r.json()),
  });
  const { data: allProducts = [], isLoading: prodsLoading } = useQuery({
    queryKey: ["/api/pos/products/all"],
    queryFn: () => apiRequest("GET", "/api/pos/products/all").then(r => r.json()),
    enabled: tab === "products",
    staleTime: 5 * 60 * 1000,
  });
  const { data: allSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["/api/pos/sales", salesPage],
    queryFn: () => apiRequest("GET", `/api/pos/sales?limit=${PAGE_SIZE}&offset=${salesPage * PAGE_SIZE}`).then(r => r.json()),
    enabled: tab === "sales",
  });
  const { data: chart } = useQuery({
    queryKey: ["/api/pos/chart"],
    queryFn: () => apiRequest("GET", "/api/pos/chart").then(r => r.json()),
    enabled: tab === "analytics" || tab === "overview",
  });

  /* filtered products */
  const filteredProds = useMemo(() => {
    let p = allProducts as any[];
    if (catFilter) p = p.filter((x: any) => String(x.categoryId) === catFilter);
    if (productSearch) p = p.filter((x: any) => x.name.toLowerCase().includes(productSearch.toLowerCase()) || x.sku?.includes(productSearch));
    return p;
  }, [allProducts, catFilter, productSearch]);

  /* filtered sales */
  const filteredSales = useMemo(() => {
    if (!salesSearch) return allSales as any[];
    return (allSales as any[]).filter((s: any) =>
      s.customerName?.includes(salesSearch) || s.invoiceNumber?.includes(salesSearch) || s.cashierName?.includes(salesSearch)
    );
  }, [allSales, salesSearch]);

  /* import mutation */
  const importMut = useMutation({
    mutationFn: (ids: number[]) => apiRequest("POST", "/api/pos/import-products", { productIds: ids }).then(r => r.json()),
    onSuccess: (d) => {
      setImportLog(`✅ تم استيراد ${d.imported} منتج بنجاح${d.errors > 0 ? ` (${d.errors} أخطاء)` : ""}`);
      setSelectedProducts(new Set());
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => setImportLog(`❌ فشل الاستيراد: ${e.message}`),
  });

  const toggleProd = (id: number) => {
    const s = new Set(selectedProducts);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedProducts(s);
  };
  const toggleAll = () => {
    if (selectedProducts.size === filteredProds.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(filteredProds.map((p: any) => p.id)));
  };

  const TABS = [
    { id: "overview", label: "نظرة عامة", icon: "📊" },
    { id: "products", label: `المنتجات (${stats?.totalProducts ?? "..."})`, icon: "📦" },
    { id: "sales", label: `الفواتير (${stats?.totalSales ?? "..."})`, icon: "🧾" },
    { id: "analytics", label: "التحليلات", icon: "📈" },
  ];

  return (
    <div className={embedded ? "bg-gray-50" : "min-h-screen bg-gray-50"} dir="rtl">
      {selectedSale && <InvoiceModal sale={selectedSale} onClose={() => setSelectedSale(null)} />}

      {/* header — hidden when embedded inside admin dashboard */}
      {!embedded && (
        <div className="bg-gradient-to-l from-[#8B5E3C] to-[#3D2314] px-6 py-5 flex items-center gap-4">
          <Link href="/admin/dashboard">
            <button className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition">←</button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">سستم الكاشير — تفاصيل كاملة</h1>
            <p className="text-xs text-white/60 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
              متصل مباشرة — للقراءة فقط
            </p>
          </div>
          <Link href="/admin/site-data">
            <button className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl transition border border-white/20">
              📊 بيانات الموقع
            </button>
          </Link>
        </div>
      )}

      {/* tabs */}
      <div className="bg-white border-b border-gray-100 px-4 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-[#5C3D2E] text-[#5C3D2E]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* ── OVERVIEW ──────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <KPI label="إجمالي الفواتير" value={stats?.totalSales ?? "—"} icon="🧾" color="bg-[#5C3D2E] text-white" sub="كل الوقت" />
              <KPI label="مكتملة" value={stats?.completedSales ?? "—"} icon="✅" color="bg-emerald-600 text-white" sub="فاتورة منجزة" />
              <KPI label="الإيرادات الكلية" value={stats ? fmt(stats.totalRevenue) + " ج.م" : "—"} icon="💰" color="bg-amber-600 text-white" sub="إجمالي" />
              <KPI label="مبيعات اليوم" value={stats?.todaySalesCount ?? "—"} icon="📅" color="bg-blue-600 text-white" sub="اليوم" />
              <KPI label="إيرادات اليوم" value={stats ? fmt(stats.todayRevenue) + " ج.م" : "—"} icon="📈" color="bg-purple-600 text-white" sub="اليوم" />
              <KPI label="المنتجات" value={stats?.totalProducts ?? "—"} icon="📦" color="bg-rose-600 text-white" sub="في الكاشير" />
            </div>

            {chart && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <p className="font-bold text-gray-800 mb-4">📊 الإيرادات اليومية</p>
                  <MiniBar data={chart.daily.map((d: any) => ({ label: d.date, value: d.revenue, max: Math.max(...chart.daily.map((x: any) => x.revenue)) }))} />
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <p className="font-bold text-gray-800 mb-4">💳 طرق الدفع</p>
                  <div className="space-y-3">
                    {chart.payment.map((p: any) => {
                      const total = chart.payment.reduce((s: number, x: any) => s + x.count, 0);
                      const pct = Math.round((p.count / total) * 100);
                      return (
                        <div key={p.method}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{p.method}</span>
                            <span className="text-gray-500">{p.count} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* latest sales preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <p className="font-bold text-gray-800">آخر الفواتير</p>
                <button onClick={() => setTab("sales")} className="text-sm text-[#5C3D2E] hover:underline">عرض الكل ←</button>
              </div>
              <LatestSalesTable onSelectSale={setSelectedSale} />
            </div>
          </div>
        )}

        {/* ── PRODUCTS ──────────────────────────────── */}
        {tab === "products" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <input
                  type="text" placeholder="🔍 بحث باسم المنتج أو SKU..."
                  value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  className="flex-1 min-w-48 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3D2E]"
                />
                <select
                  value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3D2E]"
                >
                  <option value="">كل الأقسام</option>
                  {posCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex items-center gap-2 mr-auto">
                  {selectedProducts.size > 0 && (
                    <button
                      onClick={() => importMut.mutate(Array.from(selectedProducts))}
                      disabled={importMut.isPending}
                      className="bg-[#5C3D2E] text-white text-sm px-5 py-2.5 rounded-xl hover:bg-[#4a3124] transition disabled:opacity-60 font-semibold flex items-center gap-2"
                    >
                      {importMut.isPending ? "جاري الاستيراد..." : `⬇️ استيراد ${selectedProducts.size} منتج للموقع`}
                    </button>
                  )}
                  <span className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
                    {filteredProds.length} منتج
                  </span>
                </div>
              </div>
              {importLog && (
                <div className={`mt-3 rounded-xl p-3 text-sm font-medium ${importLog.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {importLog}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-3 text-right">
                        <input type="checkbox" onChange={toggleAll} checked={selectedProducts.size === filteredProds.length && filteredProds.length > 0} className="rounded" />
                      </th>
                      <th className="py-3 px-3 text-right text-gray-500 font-semibold">#</th>
                      <th className="py-3 px-3 text-right text-gray-500 font-semibold">الاسم</th>
                      <th className="py-3 px-3 text-right text-gray-500 font-semibold">SKU / باركود</th>
                      <th className="py-3 px-3 text-right text-gray-500 font-semibold">القسم</th>
                      <th className="py-3 px-3 text-right text-gray-500 font-semibold">سعر البيع</th>
                      <th className="py-3 px-3 text-right text-gray-500 font-semibold">سعر التكلفة</th>
                      <th className="py-3 px-3 text-right text-gray-500 font-semibold">المخزون</th>
                      <th className="py-3 px-3 text-right text-gray-500 font-semibold">الوحدة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {prodsLoading ? (
                      <tr><td colSpan={9} className="text-center py-12 text-gray-400">⏳ جاري تحميل المنتجات...</td></tr>
                    ) : filteredProds.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-12 text-gray-400">لا توجد منتجات</td></tr>
                    ) : filteredProds.map((p: any) => (
                      <tr key={p.id} className={`hover:bg-amber-50/30 transition ${selectedProducts.has(p.id) ? "bg-amber-50" : ""}`}>
                        <td className="py-2.5 px-3">
                          <input type="checkbox" checked={selectedProducts.has(p.id)} onChange={() => toggleProd(p.id)} className="rounded" />
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 text-xs">{p.id}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-gray-800">{p.name}</p>
                          {p.nameEn && <p className="text-xs text-gray-400">{p.nameEn}</p>}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-xs font-mono text-gray-600">{p.sku || "—"}</p>
                          {p.barcode && <p className="text-xs text-gray-400 font-mono">{p.barcode}</p>}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs bg-amber-50 text-amber-700 rounded-lg px-2 py-1">{POS_CAT_LABEL[p.categoryId] || `قسم ${p.categoryId}`}</span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#5C3D2E]">{fmt(parseFloat(p.unitPrice))} ج.م</td>
                        <td className="py-2.5 px-3 text-gray-500">{p.costPrice ? fmt(parseFloat(p.costPrice)) + " ج.م" : "—"}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${parseInt(p.stock) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 text-xs">{p.unit || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SALES ────────────────────────────────── */}
        {tab === "sales" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex gap-3 items-center">
                <input
                  type="text" placeholder="🔍 بحث باسم العميل أو رقم الفاتورة..."
                  value={salesSearch} onChange={e => setSalesSearch(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5C3D2E]"
                />
                <div className="flex gap-2 mr-auto">
                  <button onClick={() => setSalesPage(p => Math.max(0, p - 1))} disabled={salesPage === 0}
                    className="px-3 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">←</button>
                  <span className="px-3 py-2 text-sm text-gray-500">صفحة {salesPage + 1}</span>
                  <button onClick={() => setSalesPage(p => p + 1)} disabled={allSales.length < PAGE_SIZE}
                    className="px-3 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">→</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["رقم الفاتورة","العميل","الكاشير","نوع","المنتجات","المجموع","الخصم","الإجمالي","الدفع","الحالة","التاريخ",""].map((h,i) => (
                        <th key={i} className="py-3 px-3 text-right text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {salesLoading ? (
                      <tr><td colSpan={12} className="text-center py-12 text-gray-400">⏳ جاري التحميل...</td></tr>
                    ) : filteredSales.length === 0 ? (
                      <tr><td colSpan={12} className="text-center py-12 text-gray-400">لا توجد فواتير</td></tr>
                    ) : filteredSales.map((s: any) => (
                      <tr key={s.id} className="hover:bg-amber-50/30 transition cursor-pointer" onClick={() => setSelectedSale(s)}>
                        <td className="py-3 px-3 font-mono text-xs font-bold text-[#5C3D2E]">{s.invoiceNumber}</td>
                        <td className="py-3 px-3 font-medium">{s.customerName}</td>
                        <td className="py-3 px-3 text-gray-500 text-xs">{s.cashierName || "—"}</td>
                        <td className="py-3 px-3 text-xs text-gray-500">{s.invoiceType || "—"}</td>
                        <td className="py-3 px-3">
                          <span className="bg-blue-50 text-blue-600 text-xs rounded-lg px-2 py-1">{s.items?.length || 0} منتج</span>
                        </td>
                        <td className="py-3 px-3 text-gray-500">{fmt(s.subtotal)}</td>
                        <td className="py-3 px-3">{s.discountAmount > 0 ? <span className="text-red-500">-{fmt(s.discountAmount)}</span> : "—"}</td>
                        <td className="py-3 px-3 font-black text-[#5C3D2E]">{fmt(s.total)} ج.م</td>
                        <td className="py-3 px-3">
                          <span className={`text-xs rounded-lg px-2 py-1 font-medium ${PAY_COLORS[s.paymentMethod] || "bg-gray-100 text-gray-600"}`}>{s.paymentMethod}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs rounded-lg px-2 py-1 font-medium ${s.status === "مكتمل" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{s.status}</span>
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(s.createdAt)}</td>
                        <td className="py-3 px-3">
                          <button className="text-xs bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1 transition">تفاصيل</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ──────────────────────────────── */}
        {tab === "analytics" && (
          <PosAnalyticsDashboard />
        )}
      </div>
    </div>
  );
}

/* ── latest sales sub-component ─────────────────── */
function LatestSalesTable({ onSelectSale }: { onSelectSale: (s: any) => void }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/pos/sales/latest"],
    queryFn: () => apiRequest("GET", "/api/pos/sales?limit=10&offset=0").then(r => r.json()),
  });
  if (isLoading) return <div className="p-8 text-center text-gray-400">⏳ جاري التحميل...</div>;
  return (
    <div className="divide-y divide-gray-50">
      {(data as any[]).map((s: any) => (
        <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition" onClick={() => onSelectSale(s)}>
          <div className="w-9 h-9 rounded-xl bg-[#5C3D2E]/10 flex items-center justify-center text-[#5C3D2E] font-bold text-xs flex-shrink-0">
            #{s.id}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">{s.invoiceNumber}</p>
            <p className="text-xs text-gray-400">{s.customerName} · {s.items?.length} منتج</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-black text-[#5C3D2E]">{(s.total).toLocaleString()} ج.م</p>
            <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString("ar-SY")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── top products ────────────────────────────────── */
function TopProductsFromSales() {
  const { data: sales = [] } = useQuery({
    queryKey: ["/api/pos/sales/all-for-analytics"],
    queryFn: () => apiRequest("GET", "/api/pos/sales?limit=106&offset=0").then(r => r.json()),
  });
  const topProds = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const s of sales as any[]) {
      for (const item of s.items || []) {
        if (!map[item.productName]) map[item.productName] = { name: item.productName, qty: 0, revenue: 0 };
        map[item.productName].qty += item.qty || 0;
        map[item.productName].revenue += item.total || 0;
      }
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 15);
  }, [sales]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <p className="font-bold text-gray-800">🏆 أكثر المنتجات مبيعاً</p>
        <p className="text-xs text-gray-400 mt-0.5">بناءً على إجمالي الإيرادات</p>
      </div>
      <div className="divide-y divide-gray-50">
        {topProds.map((p, i) => {
          const maxRev = topProds[0]?.revenue || 1;
          return (
            <div key={p.name} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i < 3 ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-500"}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(p.revenue / maxRev) * 100}%` }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0 min-w-24">
                <p className="font-bold text-[#5C3D2E] text-sm">{p.revenue.toLocaleString()} ج.م</p>
                <p className="text-xs text-gray-400">{p.qty % 1 === 0 ? p.qty : p.qty.toFixed(2)} وحدة</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

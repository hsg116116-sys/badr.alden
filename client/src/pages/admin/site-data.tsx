import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

function fmt(n: number) { return n.toLocaleString("ar-SY"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleString("ar-SY", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function KPI({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: string; color: string }) {
  return (
    <div className={`rounded-2xl p-5 ${color} flex flex-col gap-2 shadow-sm border border-white/10`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {sub && <span className="text-xs opacity-60 font-medium">{sub}</span>}
      </div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`text-xs rounded-lg px-2 py-1 font-medium ${color}`}>{text}</span>;
}

export default function SiteData({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<"overview" | "products" | "users" | "compare">("overview");
  const [prodSearch, setProdSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");

  /* site data from our supabase */
  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ["/api/site/overview"],
    queryFn: () => apiRequest("GET", "/api/site/overview").then(r => r.json()),
  });

  /* pos data for comparison */
  const { data: posProducts = [], isLoading: posProdsLoading } = useQuery({
    queryKey: ["/api/pos/products/all"],
    queryFn: () => apiRequest("GET", "/api/pos/products/all").then(r => r.json()),
    enabled: tab === "compare",
    staleTime: 5 * 60 * 1000,
  });
  const { data: posStats } = useQuery({
    queryKey: ["/api/pos/stats"],
    queryFn: () => apiRequest("GET", "/api/pos/stats").then(r => r.json()),
  });

  const siteProducts: any[] = overview?.products?.data || [];
  const siteUsers: any[] = overview?.users?.data || [];
  const siteOrders: any[] = overview?.orders?.data || [];
  const siteCategories: any[] = overview?.categories || [];

  const filteredProds = useMemo(() => {
    let p = siteProducts;
    if (catFilter) p = p.filter(x => x.category_id === catFilter);
    if (prodSearch) p = p.filter(x => x.name?.toLowerCase().includes(prodSearch.toLowerCase()));
    return p;
  }, [siteProducts, catFilter, prodSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return siteUsers;
    return siteUsers.filter(u => u.email?.toLowerCase().includes(userSearch.toLowerCase()) || u.phone?.includes(userSearch));
  }, [siteUsers, userSearch]);

  /* compare: find site products that match POS products by name similarity */
  const compareData = useMemo(() => {
    if (!posProducts.length || !siteProducts.length) return [];
    return siteProducts.map(sp => {
      const match = (posProducts as any[]).find(pp =>
        pp.name?.toLowerCase().trim() === sp.name?.toLowerCase().trim() ||
        pp.sku === sp.pos_sku
      );
      return { site: sp, pos: match || null };
    });
  }, [siteProducts, posProducts]);

  const TABS = [
    { id: "overview", label: "نظرة عامة", icon: "🏠" },
    { id: "products", label: `المنتجات (${overview?.products?.total ?? "..."})`, icon: "📦" },
    { id: "users", label: `المستخدمون (${overview?.users?.total ?? "..."})`, icon: "👥" },
    { id: "compare", label: "مقارنة مع الكاشير", icon: "🔗" },
  ];

  const activeProducts = siteProducts.filter(p => p.is_active);
  const outOfStock = siteProducts.filter(p => p.is_out_of_stock);
  const totalRevenue = siteOrders.filter(o => o.status === "delivered").reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const adminUsers = siteUsers.filter(u => u.is_admin || u.role === "admin");
  const staffUsers = siteUsers.filter(u => u.role && u.role !== "customer" && !u.is_admin);

  return (
    <div className={embedded ? "bg-gray-50" : "min-h-screen bg-gray-50"} dir="rtl">
      {/* header — hidden when embedded inside admin dashboard */}
      {!embedded && (
        <div className="bg-gradient-to-l from-blue-700 to-blue-900 px-6 py-5 flex items-center gap-4">
          <Link href="/admin/dashboard">
            <button className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition">←</button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">بيانات الموقع — عرض شامل</h1>
            <p className="text-xs text-white/60 mt-0.5">{siteProducts.length} منتج · {siteUsers.length} مستخدم · {siteOrders.length} طلب</p>
          </div>
          <Link href="/admin/pos">
            <button className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl transition border border-white/20">
              🏪 سستم الكاشير
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
            className={`px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* double comparison: site vs POS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-sm">
                <p className="text-sm opacity-70 mb-3 font-semibold">📱 بيانات الموقع</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{overview?.products?.total ?? "—"}</p>
                    <p className="text-xs opacity-70">منتج</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{overview?.users?.total ?? "—"}</p>
                    <p className="text-xs opacity-70">مستخدم</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{overview?.orders?.total ?? "—"}</p>
                    <p className="text-xs opacity-70">طلب</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{siteCategories.length}</p>
                    <p className="text-xs opacity-70">قسم</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#5C3D2E] text-white rounded-2xl p-5 shadow-sm">
                <p className="text-sm opacity-70 mb-3 font-semibold">🏪 سستم الكاشير</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{posStats?.totalProducts ?? "—"}</p>
                    <p className="text-xs opacity-70">منتج</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{posStats?.totalSales ?? "—"}</p>
                    <p className="text-xs opacity-70">فاتورة</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{posStats ? fmt(posStats.totalRevenue) : "—"}</p>
                    <p className="text-xs opacity-70">ج.م إيرادات</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{posStats?.completedSales ?? "—"}</p>
                    <p className="text-xs opacity-70">مكتملة</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPI label="منتجات نشطة" value={activeProducts.length} icon="✅" color="bg-emerald-600 text-white" sub={`من ${siteProducts.length}`} />
              <KPI label="نفد المخزون" value={outOfStock.length} icon="❌" color="bg-red-500 text-white" sub="منتج" />
              <KPI label="موظفون" value={staffUsers.length} icon="👔" color="bg-purple-600 text-white" sub="في الموقع" />
              <KPI label="مدراء" value={adminUsers.length} icon="🔑" color="bg-amber-600 text-white" sub="صلاحية كاملة" />
            </div>

            {/* categories grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="font-bold text-gray-800 mb-4">🗂️ أقسام الموقع</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {siteCategories.map((c: any) => {
                  const count = siteProducts.filter(p => p.category_id === c.id).length;
                  return (
                    <div key={c.id} className="rounded-xl border border-gray-100 p-3 text-center hover:bg-gray-50 transition cursor-pointer" onClick={() => { setTab("products"); setCatFilter(c.id); }}>
                      <p className="text-2xl mb-1">{c.icon || "📦"}</p>
                      <p className="text-xs font-semibold text-gray-700 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{count} منتج</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* orders summary */}
            {siteOrders.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <p className="font-bold text-gray-800">📋 آخر الطلبات</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {siteOrders.slice(0, 10).map((o: any) => (
                    <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs"># {o.id}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{o.status}</p>
                        <p className="text-xs text-gray-400">{fmtDate(o.created_at)}</p>
                      </div>
                      <p className="font-bold text-blue-600">{fmt(parseFloat(o.total || 0))} ج.م</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
                <p className="text-4xl mb-2">📭</p>
                <p className="font-medium">لا توجد طلبات بعد</p>
                <p className="text-sm mt-1">ستظهر هنا طلبات الموقع عند وصولها</p>
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <input
                  type="text" placeholder="🔍 بحث باسم المنتج..."
                  value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                  className="flex-1 min-w-48 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">كل الأقسام</option>
                  {siteCategories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                <span className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">{filteredProds.length} منتج</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["#","الاسم","القسم","السعر","المخزون","الحالة","مميز","تاريخ الإضافة"].map((h, i) => (
                        <th key={i} className="py-3 px-3 text-right text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ovLoading ? (
                      <tr><td colSpan={8} className="text-center py-12 text-gray-400">⏳ جاري التحميل...</td></tr>
                    ) : filteredProds.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-12 text-gray-400">لا توجد منتجات</td></tr>
                    ) : filteredProds.map((p: any) => {
                      const cat = siteCategories.find((c: any) => c.id === p.category_id);
                      return (
                        <tr key={p.id} className="hover:bg-blue-50/20 transition">
                          <td className="py-2.5 px-3 text-gray-400 text-xs">{p.id}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              {p.image ? (
                                <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">📦</div>
                              )}
                              <div>
                                <p className="font-medium text-gray-800">{p.name}</p>
                                {p.description && <p className="text-xs text-gray-400 truncate max-w-48">{p.description}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {cat ? (
                              <span className="text-xs bg-blue-50 text-blue-600 rounded-lg px-2 py-1">{cat.icon} {cat.name}</span>
                            ) : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-blue-700">{fmt(parseFloat(p.price || 0))} ج.م</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${(p.stock_quantity || 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                              {p.stock_quantity ?? 0}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge text={p.is_active ? "نشط" : "معطّل"} color={p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} />
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge text={p.is_featured ? "✨ مميز" : "عادي"} color={p.is_featured ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-400"} />
                          </td>
                          <td className="py-2.5 px-3 text-xs text-gray-400">{p.created_at ? fmtDate(p.created_at) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <input
                type="text" placeholder="🔍 بحث بالبريد أو الهاتف..."
                value={userSearch} onChange={e => setUserSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
              {[
                { label: "كل المستخدمين", count: siteUsers.length, color: "bg-blue-50 text-blue-700 border-blue-100" },
                { label: "مدراء", count: adminUsers.length, color: "bg-amber-50 text-amber-700 border-amber-100" },
                { label: "موظفون", count: staffUsers.length, color: "bg-purple-50 text-purple-700 border-purple-100" },
                { label: "عملاء", count: siteUsers.filter(u => !u.is_admin && u.role === "customer").length, color: "bg-green-50 text-green-700 border-green-100" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-4 text-center border ${s.color}`}>
                  <p className="text-2xl font-black">{s.count}</p>
                  <p className="text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["#","المعرّف","البريد","الهاتف","الدور","محفظة","محظور","تاريخ التسجيل"].map((h, i) => (
                        <th key={i} className="py-3 px-3 text-right text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map((u: any, i: number) => (
                      <tr key={u.id} className="hover:bg-blue-50/20 transition">
                        <td className="py-2.5 px-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-500 max-w-24 truncate">{u.id?.slice(0, 8)}…</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800">{u.email || "—"}</td>
                        <td className="py-2.5 px-3 font-mono text-xs">{u.phone || "—"}</td>
                        <td className="py-2.5 px-3">
                          <Badge
                            text={u.is_admin ? "مدير" : u.role === "admin" ? "مدير" : u.role || "عميل"}
                            color={u.is_admin ? "bg-amber-100 text-amber-700" : u.role && u.role !== "customer" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}
                          />
                        </td>
                        <td className="py-2.5 px-3 font-bold text-blue-600">{fmt(parseFloat(u.wallet || 0))} ج.م</td>
                        <td className="py-2.5 px-3">
                          <Badge text={u.is_banned ? "محظور" : "نشط"} color={u.is_banned ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"} />
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-400">{u.created_at ? fmtDate(u.created_at) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPARE ── */}
        {tab === "compare" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-l from-[#5C3D2E]/10 to-blue-600/10 rounded-2xl p-5 border border-gray-200">
              <p className="font-bold text-gray-800 mb-1">🔗 مقارنة بيانات الموقع مع الكاشير</p>
              <p className="text-sm text-gray-500">يتم مطابقة المنتجات بالاسم — المنتجات المتطابقة تعرض أسعار الكاشير للمقارنة</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <p className="text-2xl font-black text-green-600">{compareData.filter(d => d.pos).length}</p>
                  <p className="text-xs text-gray-500">منتج مطابق في الكاشير</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <p className="text-2xl font-black text-red-500">{compareData.filter(d => !d.pos).length}</p>
                  <p className="text-xs text-gray-500">موقع فقط (غير موجود بالكاشير)</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <p className="text-2xl font-black text-[#5C3D2E]">{(posProducts as any[]).length - compareData.filter(d => d.pos).length}</p>
                  <p className="text-xs text-gray-500">كاشير فقط (غير موجود بالموقع)</p>
                </div>
              </div>
            </div>

            {posProdsLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400">⏳ جاري تحميل بيانات الكاشير...</div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="py-3 px-3 text-right text-gray-500 font-semibold">المنتج (الموقع)</th>
                        <th className="py-3 px-3 text-right text-gray-500 font-semibold">سعر الموقع</th>
                        <th className="py-3 px-3 text-right text-gray-500 font-semibold">مخزون الموقع</th>
                        <th className="py-3 px-3 text-right text-gray-500 font-semibold">✓ في الكاشير؟</th>
                        <th className="py-3 px-3 text-right text-gray-500 font-semibold">سعر الكاشير</th>
                        <th className="py-3 px-3 text-right text-gray-500 font-semibold">مخزون الكاشير</th>
                        <th className="py-3 px-3 text-right text-gray-500 font-semibold">فرق السعر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {compareData.map(({ site, pos }) => {
                        const sitePrice = parseFloat(site.price || 0);
                        const posPrice = pos ? parseFloat(pos.unitPrice || 0) : null;
                        const diff = posPrice !== null ? sitePrice - posPrice : null;
                        return (
                          <tr key={site.id} className={`hover:bg-gray-50 transition ${!pos ? "opacity-60" : ""}`}>
                            <td className="py-2.5 px-3 font-medium text-gray-800">{site.name}</td>
                            <td className="py-2.5 px-3 font-bold text-blue-600">{fmt(sitePrice)} ج.م</td>
                            <td className="py-2.5 px-3">
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${(site.stock_quantity || 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                {site.stock_quantity ?? 0}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge text={pos ? "✅ موجود" : "❌ غير موجود"} color={pos ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"} />
                            </td>
                            <td className="py-2.5 px-3 font-bold text-[#5C3D2E]">{posPrice !== null ? fmt(posPrice) + " ج.م" : "—"}</td>
                            <td className="py-2.5 px-3">
                              {pos ? (
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${parseInt(pos.stock) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                  {pos.stock}
                                </span>
                              ) : "—"}
                            </td>
                            <td className="py-2.5 px-3">
                              {diff !== null ? (
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${diff === 0 ? "bg-gray-100 text-gray-500" : diff > 0 ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>
                                  {diff === 0 ? "متطابق" : diff > 0 ? `+${fmt(diff)}` : fmt(diff)} ج.م
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

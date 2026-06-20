import { posClient } from './pos-client';

function n(v: any): number { return parseFloat(v) || 0; }
function toInt(v: any): number { return parseInt(v) || 0; }

function getPeriodDates(period: string) {
  const now = new Date();
  const start = new Date(now);
  if (period === 'day') { start.setHours(0, 0, 0, 0); }
  else if (period === 'week') { start.setDate(start.getDate() - 7); start.setHours(0,0,0,0); }
  else if (period === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0); }
  else if (period === 'year') { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
  const diff = now.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - diff);
  return { start, prevStart, prevEnd: new Date(start) };
}

function filterPeriod(items: any[], dateField: string, start: Date, end?: Date) {
  return items.filter(x => {
    const d = new Date(x[dateField]);
    return d >= start && (!end || d < end);
  });
}

function computeCOGS(sales: any[]): number {
  let cogs = 0;
  for (const s of sales) {
    for (const item of s.items || []) {
      cogs += n(item.costPrice) * n(item.qty);
    }
  }
  return cogs;
}

function computeTopProducts(sales: any[], limit = 5) {
  const map: Record<string, { name: string; qty: number; revenue: number; orders: number }> = {};
  for (const s of sales) {
    for (const item of s.items || []) {
      const key = item.productName || item.productId || 'unknown';
      if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0, orders: 0 };
      map[key].qty += n(item.qty);
      map[key].revenue += n(item.total);
      map[key].orders += 1;
    }
  }
  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((p, i) => ({ rank: i + 1, ...p }));
}

function computeTopCustomers(sales: any[], limit = 5) {
  const map: Record<string, { name: string; orders: number; totalSpent: number }> = {};
  for (const s of sales) {
    const key = s.customerName || 'زبون عام';
    if (!map[key]) map[key] = { name: key, orders: 0, totalSpent: 0 };
    map[key].orders += 1;
    map[key].totalSpent += n(s.total);
  }
  return Object.values(map)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

function computeCategoryBreakdown(sales: any[], products: any[], categories: any[]) {
  const prodCat: Record<string, string> = {};
  for (const p of products) prodCat[p.id] = p.categoryId;
  const catName: Record<string, string> = {};
  for (const c of categories) catName[c.id] = c.name;

  const map: Record<string, number> = {};
  for (const s of sales) {
    for (const item of s.items || []) {
      const catId = item.categoryId || prodCat[item.productId];
      const name = (catId ? catName[catId] : null) || 'أخرى';
      map[name] = (map[name] || 0) + n(item.total);
    }
  }
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, pct: total > 0 ? Math.round((value / total) * 100) : 0 }));
}

function computePaymentMethods(sales: any[]) {
  const map: Record<string, { amount: number; count: number }> = {};
  for (const s of sales) {
    if (Array.isArray(s.payments) && s.payments.length > 0) {
      for (const p of s.payments) {
        const m = p.method || 'أخرى';
        if (!map[m]) map[m] = { amount: 0, count: 0 };
        map[m].amount += n(p.amount);
        map[m].count += 1;
      }
    } else {
      const m = s.paymentMethod || 'أخرى';
      if (!map[m]) map[m] = { amount: 0, count: 0 };
      map[m].amount += n(s.total);
      map[m].count += 1;
    }
  }
  const totalAmt = Object.values(map).reduce((a, b) => a + b.amount, 0);
  return Object.entries(map)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([method, v]) => ({
      method, amount: v.amount, count: v.count,
      pct: totalAmt > 0 ? Math.round((v.amount / totalAmt) * 100) : 0,
    }));
}

function computeHourlyTrend(sales: any[]) {
  const byHour: Record<number, { count: number; revenue: number }> = {};
  for (let h = 0; h < 24; h++) byHour[h] = { count: 0, revenue: 0 };
  for (const s of sales) {
    const h = new Date(s.createdAt).getHours();
    byHour[h].count += 1;
    byHour[h].revenue += n(s.total);
  }
  return Array.from({ length: 24 }, (_, h) => ({ hour: h, ...byHour[h] }));
}

function buildSalesChart(sales: any[], purchases: any[], chartPeriod: 'days' | 'weeks' | 'months') {
  const now = new Date();
  type Point = { label: string; sales: number; purchases: number; count: number };

  if (chartPeriod === 'days') {
    const points: Point[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const label = d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      const s = sales.filter(x => { const t = new Date(x.createdAt); return t >= d && t < next; });
      const p = purchases.filter(x => { const t = new Date(x.createdAt); return t >= d && t < next; });
      points.push({ label, sales: s.reduce((a,x) => a + n(x.total), 0), purchases: p.reduce((a,x) => a + n(x.total||x.amount), 0), count: s.length });
    }
    return points;
  }

  if (chartPeriod === 'weeks') {
    const points: Point[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i * 7 - 6); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate() + 7);
      const label = `أسبوع ${12 - i}`;
      const s = sales.filter(x => { const t = new Date(x.createdAt); return t >= d && t < next; });
      const p = purchases.filter(x => { const t = new Date(x.createdAt); return t >= d && t < next; });
      points.push({ label, sales: s.reduce((a,x) => a + n(x.total), 0), purchases: p.reduce((a,x) => a + n(x.total||x.amount), 0), count: s.length });
    }
    return points;
  }

  // months
  const points: Point[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' });
    const s = sales.filter(x => { const t = new Date(x.createdAt); return t >= d && t < next; });
    const p = purchases.filter(x => { const t = new Date(x.createdAt); return t >= d && t < next; });
    points.push({ label, sales: s.reduce((a,x) => a + n(x.total), 0), purchases: p.reduce((a,x) => a + n(x.total||x.amount), 0), count: s.length });
  }
  return points;
}

function computeProfitLoss(sales: any[], expenses: any[], products: any[]) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    const ms = sales.filter(x => { const t = new Date(x.createdAt); return t >= d && t < next; });
    const me = expenses.filter(x => { const t = new Date(x.createdAt); return t >= d && t < next; });
    const revenue = ms.reduce((a, x) => a + n(x.total), 0);
    const cogs = computeCOGS(ms);
    const grossProfit = revenue - cogs;
    const expenseTotal = me.reduce((a, x) => a + n(x.amount), 0);
    const netProfit = grossProfit - expenseTotal;
    months.push({ label, revenue, cogs, grossProfit, expenses: expenseTotal, netProfit, margin: revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0 });
  }

  const allRevenue = sales.reduce((a, x) => a + n(x.total), 0);
  const allCOGS = computeCOGS(sales);
  const allExpenses = expenses.reduce((a, x) => a + n(x.amount), 0);
  const allGross = allRevenue - allCOGS;
  const allNet = allGross - allExpenses;

  return {
    summary: { revenue: allRevenue, cogs: allCOGS, grossProfit: allGross, expenses: allExpenses, netProfit: allNet, margin: allRevenue > 0 ? Math.round((allNet / allRevenue) * 100) : 0 },
    monthly: months,
  };
}

function computeInventorySummary(products: any[]) {
  const total = products.length;
  const totalUnits = products.reduce((a, p) => a + toInt(p.stock), 0);
  const totalValue = products.reduce((a, p) => a + n(p.costPrice) * toInt(p.stock), 0);
  const good = products.filter(p => toInt(p.stock) > toInt(p.minStock || 5)).length;
  const low = products.filter(p => toInt(p.stock) > 0 && toInt(p.stock) <= toInt(p.minStock || 5)).length;
  const out = products.filter(p => toInt(p.stock) <= 0).length;
  return { total, totalUnits, totalValue, good, low, out };
}

export async function getPosAnalyticsDashboard(period: string = 'month') {
  const [salesRes, productsRes, categoriesRes] = await Promise.all([
    posClient.from('sales').select('*'),
    posClient.from('products').select('id,name,categoryId,unitPrice,costPrice,stock,minStock'),
    posClient.from('categories').select('id,name,nameEn'),
  ]);

  if (salesRes.error) throw salesRes.error;

  const allSales = (salesRes.data || []).filter((s: any) => s.status === 'مكتمل');
  const products = productsRes.data || [];
  const categories = categoriesRes.data || [];

  let purchases: any[] = [];
  let expenses: any[] = [];

  try {
    const r = await posClient.from('purchases').select('total,amount,createdAt,status');
    purchases = (r.data || []).filter((p: any) => p.status !== 'ملغي');
  } catch { /* table may not exist */ }

  try {
    const r = await posClient.from('expenses').select('amount,createdAt,category,description');
    expenses = r.data || [];
  } catch { /* table may not exist */ }

  const { start: periodStart, prevStart, prevEnd } = getPeriodDates(period);
  const periodSales = filterPeriod(allSales, 'createdAt', periodStart);
  const prevSales = filterPeriod(allSales, 'createdAt', prevStart, prevEnd);

  // ── Summary (9 KPIs) ──────────────────────────────────────────────────────
  const totalRevenue = allSales.reduce((a, s) => a + n(s.total), 0);
  const totalCOGS = computeCOGS(allSales);
  const totalExpenses = expenses.reduce((a, e) => a + n(e.amount), 0);
  const netProfit = totalRevenue - totalCOGS - totalExpenses;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todaySales = filterPeriod(allSales, 'createdAt', today);
  const todayRevenue = todaySales.reduce((a, s) => a + n(s.total), 0);
  const lowStockCount = products.filter((p: any) => toInt(p.stock) > 0 && toInt(p.stock) <= toInt(p.minStock || 5)).length;
  const outOfStockCount = products.filter((p: any) => toInt(p.stock) <= 0).length;
  const totalPurchases = purchases.reduce((a, p) => a + n(p.total || p.amount), 0);
  const uniqueCustomers = new Set(allSales.map((s: any) => s.customerName).filter(Boolean)).size;

  const summary = {
    totalRevenue, netProfit, todayRevenue,
    todayCount: todaySales.length,
    invoiceCount: allSales.length,
    customerCount: uniqueCustomers,
    productCount: products.length,
    totalPurchases,
    lowStockCount: lowStockCount + outOfStockCount,
    receivables: netProfit - todayRevenue,
  };

  // ── Period Comparison ─────────────────────────────────────────────────────
  const currRev = periodSales.reduce((a, s) => a + n(s.total), 0);
  const prevRev = prevSales.reduce((a, s) => a + n(s.total), 0);
  const currCOGS = computeCOGS(periodSales);
  const prevCOGS = computeCOGS(prevSales);
  const currProfit = currRev - currCOGS;
  const prevProfit = prevRev - prevCOGS;
  const gr = (cur: number, prev: number) => prev > 0 ? Math.round(((cur - prev) / prev) * 100 * 10) / 10 : (cur > 0 ? 100 : 0);

  const comparison = {
    revenue: { current: currRev, previous: prevRev, growth: gr(currRev, prevRev) },
    profit: { current: currProfit, previous: prevProfit, growth: gr(currProfit, prevProfit) },
    invoices: { current: periodSales.length, previous: prevSales.length, growth: gr(periodSales.length, prevSales.length) },
    avgOrder: {
      current: periodSales.length > 0 ? currRev / periodSales.length : 0,
      previous: prevSales.length > 0 ? prevRev / prevSales.length : 0,
      growth: gr(
        periodSales.length > 0 ? currRev / periodSales.length : 0,
        prevSales.length > 0 ? prevRev / prevSales.length : 0
      ),
    },
  };

  // ── Period Stats ──────────────────────────────────────────────────────────
  const periodPurchases = filterPeriod(purchases, 'createdAt', periodStart);
  const periodStats = {
    totalSales: currRev,
    totalPurchases: periodPurchases.reduce((a, p) => a + n(p.total || p.amount), 0),
    invoiceCount: periodSales.length,
    avgOrderValue: periodSales.length > 0 ? currRev / periodSales.length : 0,
  };

  // ── Charts ────────────────────────────────────────────────────────────────
  const salesChart = {
    days: buildSalesChart(allSales, purchases, 'days'),
    weeks: buildSalesChart(allSales, purchases, 'weeks'),
    months: buildSalesChart(allSales, purchases, 'months'),
  };

  // ── Products ──────────────────────────────────────────────────────────────
  const topProducts = computeTopProducts(allSales, 5);
  const topProductsByPeriod = computeTopProducts(periodSales, 8);

  // ── Customers ─────────────────────────────────────────────────────────────
  const topCustomers = computeTopCustomers(allSales, 5);

  // ── Categories ────────────────────────────────────────────────────────────
  const categoryBreakdown = computeCategoryBreakdown(periodSales, products, categories);

  // ── Payment Methods ───────────────────────────────────────────────────────
  const paymentMethods = computePaymentMethods(periodSales);

  // ── Hourly Trend ──────────────────────────────────────────────────────────
  const hourlyTrend = computeHourlyTrend(periodSales);

  // ── Alerts ────────────────────────────────────────────────────────────────
  const alerts = [
    ...products.filter((p: any) => toInt(p.stock) <= 0).map((p: any) => ({ type: 'error', product: p.name, stock: toInt(p.stock), minStock: toInt(p.minStock || 5) })),
    ...products.filter((p: any) => toInt(p.stock) > 0 && toInt(p.stock) <= toInt(p.minStock || 5)).map((p: any) => ({ type: 'warning', product: p.name, stock: toInt(p.stock), minStock: toInt(p.minStock || 5) })),
  ].slice(0, 25);

  // ── Inventory ─────────────────────────────────────────────────────────────
  const inventorySummary = computeInventorySummary(products);

  // ── P&L ───────────────────────────────────────────────────────────────────
  const profitLoss = computeProfitLoss(allSales, expenses, products);

  return {
    summary, comparison, periodStats, salesChart,
    topProducts, topProductsByPeriod, topCustomers,
    categoryBreakdown, paymentMethods, hourlyTrend,
    alerts, inventorySummary, profitLoss,
  };
}

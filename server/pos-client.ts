import { createClient } from '@supabase/supabase-js';

const POS_URL = 'https://ccvprapyetmkorblrkgw.supabase.co';
const POS_KEY = 'sb_publishable_FYWy-1ZaF3Ad8olmhPKZhg_wvRISriE';

export const posClient = createClient(POS_URL, POS_KEY);

export const POS_CATEGORY_MAP: Record<number, string> = {
  1:  'chocolate',
  2:  'nuts',
  3:  'dates',
  4:  'soda',
  5:  'energy',
  6:  'jelly',
  7:  'biscuits',
  8:  'toffee',
  9:  'candy',
  10: 'coffee',
  11: 'chips',
  12: 'eastern_sweets',
  13: 'water',
  14: 'dried_fruits',
  15: 'toys',
  16: null,
  17: 'eastern_sweets',
} as any;

export async function fetchAllPosProducts() {
  const pageSize = 1000;
  let from = 0;
  const all: any[] = [];
  while (true) {
    const { data, error } = await posClient
      .from('products')
      .select('id,name,sku,barcode,categoryId,unitPrice,costPrice,stock,unit,description,imageUrl')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data || []));
    if ((data?.length ?? 0) < pageSize) break;
    from += pageSize;
  }
  return all;
}

export async function fetchPosStats() {
  const [salesRes, productsRes, todayRes] = await Promise.all([
    posClient.from('sales').select('total,createdAt,status'),
    posClient.from('products').select('id', { count: 'exact', head: true }),
    posClient.from('sales').select('total').gte('createdAt', new Date(new Date().setHours(0,0,0,0)).toISOString()),
  ]);

  const sales = salesRes.data || [];
  const totalRevenue = sales.filter(s => s.status === 'مكتمل').reduce((sum: number, s: any) => sum + (parseFloat(s.total) || 0), 0);
  const todayRevenue = (todayRes.data || []).reduce((sum: number, s: any) => sum + (parseFloat(s.total) || 0), 0);

  return {
    totalSales: sales.length,
    completedSales: sales.filter((s: any) => s.status === 'مكتمل').length,
    totalRevenue: Math.round(totalRevenue),
    todayRevenue: Math.round(todayRevenue),
    todaySalesCount: (todayRes.data || []).length,
    totalProducts: productsRes.count || 0,
  };
}

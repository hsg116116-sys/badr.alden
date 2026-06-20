import { createClient } from '@supabase/supabase-js';

const POS_URL = 'https://ccvprapyetmkorblrkgw.supabase.co';
const POS_KEY = 'sb_publishable_FYWy-1ZaF3Ad8olmhPKZhg_wvRISriE';

export const posClient = createClient(POS_URL, POS_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export type PosOrderStatus = 'pending' | 'accepted' | 'preparation' | 'preparing' | 'out_for_delivery' | 'delivered' | 'rejected';

export interface PosOrderNotification {
  id: number;
  order_id: number;
  status: PosOrderStatus;
  customer_name: string | null;
  customer_phone: string | null;
  address: string | null;
  total: number | null;
  items: string | null;
  payment_method: string | null;
  created_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
}

export async function fetchPosOrderStatus(orderId: number): Promise<PosOrderNotification | null> {
  const { data, error } = await posClient
    .from('online_order_notifications')
    .select('id,order_id,status,customer_name,customer_phone,address,total,items,payment_method,created_at,accepted_at,accepted_by')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as PosOrderNotification;
}

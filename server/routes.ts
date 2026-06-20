import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { type User as SelectUser } from "@shared/schema";
import { sendVerificationEmail, verifyCode, sendOrderConfirmationEmail } from "./email";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { supabase as supabaseAdmin } from "./supabase";
import { posClient, POS_CATEGORY_MAP, fetchAllPosProducts, fetchPosStats } from "./pos-client";
import { getPosAnalyticsDashboard } from "./pos-analytics";
import { pool } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Cashier Widget JS (embed in any site with one <script> tag) ──
  app.get("/cashier-widget.js", (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(`
(function(){
  var SUPA_URL = 'https://ccvprapyetmkorblrkgw.supabase.co/rest/v1';
  var SUPA_KEY = 'sb_publishable_FYWy-1ZaF3Ad8olmhPKZhg_wvRISriE';
  var LOGO = 'https://fe196c63-8176-46a9-a4ac-bc2ae737b2c1-00-3dzw1umf0vjgi.riker.replit.dev/logo.png';
  var hdrs = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' };

  function supaFetch(method, path, body) {
    return fetch(SUPA_URL + path, { method: method, headers: hdrs, body: body ? JSON.stringify(body) : undefined });
  }

  /* CSS */
  if (!document.getElementById('_badr_css')) {
    var s = document.createElement('style');
    s.id = '_badr_css';
    s.textContent =
      '#_badr_ov{position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;justify-content:center;font-family:system-ui,sans-serif;direction:rtl}' +
      '#_badr_card{background:#141414;border-bottom:3px solid #10b981;border-left:1px solid rgba(255,255,255,.08);border-right:1px solid rgba(255,255,255,.08);border-radius:0 0 24px 24px;width:100%;max-width:760px;box-shadow:0 20px 80px rgba(16,185,129,.3);animation:_badrSlide .4s cubic-bezier(.34,1.56,.64,1);max-height:92vh;overflow-y:auto}' +
      '@keyframes _badrSlide{from{transform:translateY(-100%)}to{transform:translateY(0)}}' +
      '._badr_cell{background:#1c1c1c;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 14px}' +
      '._badr_item{background:#1c1c1c;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px 14px;margin-bottom:8px;color:#fff}' +
      '._badr_item_head{display:flex;justify-content:space-between;align-items:center}' +
      '._badr_item_detail{margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06);display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
      '._badr_badge{background:rgba(16,185,129,.12);color:#34d399;border:1px solid rgba(16,185,129,.2);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700}' +
      '._badr_badge_o{background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.2);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700}' +
      '._badr_badge_b{background:rgba(59,130,246,.12);color:#60a5fa;border:1px solid rgba(59,130,246,.2);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700}' +
      '#_badr_acc{flex:1;height:56px;border-radius:16px;border:none;cursor:pointer;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:18px;font-weight:900;box-shadow:0 8px 24px rgba(16,185,129,.4)}' +
      '#_badr_rej{width:120px;height:56px;border-radius:16px;cursor:pointer;background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.25);font-size:15px;font-weight:700}' +
      '#_badr_st{position:fixed;bottom:12px;left:12px;z-index:2147483646;background:#141414;border:1px solid #10b981;border-radius:8px;padding:5px 12px;font-size:11px;color:#10b981;font-family:system-ui,sans-serif;direction:rtl}';
    document.head.appendChild(s);
  }

  /* Status bar */
  var stEl = document.getElementById('_badr_st');
  if (!stEl) { stEl = document.createElement('div'); stEl.id = '_badr_st'; document.body.appendChild(stEl); }
  stEl.textContent = '🟡 جاري الاتصال...';

  function setSt(t, ok) {
    stEl.textContent = t;
    stEl.style.borderColor = ok === false ? '#ef4444' : '#10b981';
    stEl.style.color = ok === false ? '#ef4444' : '#10b981';
  }

  function payLabel(m) {
    if (m === 'cash') return '💵 كاش عند التسليم';
    if (m === 'card') return '💳 بطاقة بنكية';
    if (m === 'online') return '🌐 دفع إلكتروني';
    return m ? '💵 ' + m : '💵 كاش';
  }

  var curId = null, seen = {};

  function showNotif(n) {
    if (seen[n.id]) return;
    seen[n.id] = 1; curId = n.id;
    var items = [];
    try { items = typeof n.items === 'string' ? JSON.parse(n.items) : (n.items || []); } catch(e){}

    /* ── الأرقام المالية: نستخدم القيم المخزونة مباشرة ── */
    var subtotal = n.subtotal != null ? Math.round(n.subtotal) : Math.round(items.reduce(function(s,it){ return s+(it.price||0)*(it.quantity||1); }, 0));
    var deliveryFee = n.delivery_fee != null ? Math.round(n.delivery_fee) : Math.max(0, Math.round((n.total||0) - subtotal));
    var discount = n.discount_amount != null ? Math.round(n.discount_amount) : 0;
    var total = Math.round(n.total||0);
    var totalQty = items.reduce(function(s,it){ return s+(it.quantity||1); }, 0);

    /* ── العنوان ── */
    var addrHtml = (n.address && n.address !== 'غير محدد')
      ? '<div class="_badr_cell" style="grid-column:span 2"><div style="color:#6b7280;font-size:10px;margin-bottom:6px">📍 العنوان الكامل للتوصيل</div><div style="color:#fff;font-size:14px;font-weight:700;line-height:1.7">' + n.address + '</div></div>'
      : '';

    /* ── طريقة الدفع ── */
    var payHtml = '<div class="_badr_cell"><div style="color:#6b7280;font-size:10px;margin-bottom:6px">💳 طريقة الدفع</div><div style="color:#f59e0b;font-size:13px;font-weight:800">' + payLabel(n.payment_method) + '</div></div>';

    /* ── ملاحظات الطلب ── */
    var notesHtml = (n.notes && n.notes.trim())
      ? '<div class="_badr_cell" style="grid-column:span 2;background:rgba(245,158,11,.06);border-color:rgba(245,158,11,.25)"><div style="color:#f59e0b;font-size:10px;margin-bottom:6px">⚠️ ملاحظات خاصة من العميل</div><div style="color:#fcd34d;font-size:13px;font-weight:700;line-height:1.6">' + n.notes + '</div></div>'
      : '';

    /* ── المنتجات بالتفصيل ── */
    var iHtml = items.map(function(it){
      var lineTotal = Math.round((it.price||0) * (it.quantity||1));
      var details = [];
      if (it.cutting)   details.push('<span class="_badr_badge_o">✂️ تقطيع: ' + it.cutting + '</span>');
      if (it.packaging) details.push('<span class="_badr_badge_b">📦 تعبئة: ' + it.packaging + '</span>');
      if (it.notes)     details.push('<span style="color:#9ca3af;font-size:11px;font-weight:600">📝 ' + it.notes + '</span>');
      return '<div class="_badr_item">' +
        '<div class="_badr_item_head">' +
          '<div style="display:flex;align-items:center;gap:10px">' +
            '<span style="background:rgba(16,185,129,.18);color:#10b981;border-radius:8px;padding:3px 11px;font-size:14px;font-weight:900">×' + it.quantity + '</span>' +
            '<div>' +
              '<div style="font-size:14px;font-weight:800">' + (it.name||'منتج') + '</div>' +
              '<div style="color:#6b7280;font-size:11px;margin-top:2px">' + (it.price||0) + ' ج.م للوحدة × ' + (it.quantity||1) + '</div>' +
            '</div>' +
          '</div>' +
          '<span style="color:#34d399;font-weight:900;font-size:16px">' + lineTotal + ' ج.م</span>' +
        '</div>' +
        (details.length ? '<div class="_badr_item_detail">' + details.join('') + '</div>' : '') +
      '</div>';
    }).join('');

    /* ── صفوف الملخص المالي ── */
    var deliveryRow = deliveryFee > 0
      ? '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#9ca3af;font-size:12px">🚚 رسوم التوصيل</span><span style="color:#f59e0b;font-size:13px;font-weight:800">' + deliveryFee + ' ج.م</span></div>' : '';
    var discountRow = discount > 0
      ? '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#9ca3af;font-size:12px">🎟️ خصم' + (n.coupon_code ? ' — كود: ' + n.coupon_code : '') + '</span><span style="color:#f87171;font-size:13px;font-weight:800">- ' + discount + ' ج.م</span></div>' : '';

    var old = document.getElementById('_badr_ov'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = '_badr_ov';
    ov.innerHTML =
      '<div id="_badr_card">' +

      /* ── رأس البطاقة ── */
      '<div style="background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(16,185,129,.04));padding:16px 22px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:10;backdrop-filter:blur(8px)">' +
        '<div style="display:flex;align-items:center;gap:14px">' +
          '<img src="' + LOGO + '" style="width:48px;height:48px;border-radius:12px;border:2px solid #10b981;object-fit:contain;background:#fff" onerror="this.style.display=\'none\'">' +
          '<div>' +
            '<p style="color:#fff;font-size:19px;font-weight:900;margin:0">🛒 طلب جديد من الموقع!</p>' +
            '<p style="color:#34d399;font-size:12px;margin:4px 0 0">رقم الطلب: <b>#' + (n.order_id||n.id) + '</b> &nbsp;|&nbsp; 🟢 يستلمه: اسلام</p>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:center">' +
          '<p style="color:#10b981;font-size:34px;font-weight:900;margin:0;line-height:1">' + total + '</p>' +
          '<p style="color:#6b7280;font-size:11px;margin:2px 0 0">ج.م إجمالي</p>' +
        '</div>' +
      '</div>' +

      /* ── بيانات العميل ── */
      '<div style="padding:14px 20px;display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        '<div class="_badr_cell"><div style="color:#6b7280;font-size:10px;margin-bottom:6px">👤 اسم العميل</div><div style="color:#fff;font-size:14px;font-weight:800">' + (n.customer_name||'زبون') + '</div></div>' +
        '<div class="_badr_cell"><div style="color:#6b7280;font-size:10px;margin-bottom:6px">📞 رقم الهاتف</div><div style="color:#fff;font-size:14px;font-weight:800;direction:ltr;text-align:right">' + (n.customer_phone||'—') + '</div></div>' +
        addrHtml +
        payHtml +
        notesHtml +
      '</div>' +

      /* ── تفاصيل المنتجات ── */
      '<div style="padding:0 20px 12px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
          '<p style="color:#9ca3af;font-size:12px;font-weight:800;margin:0">🥩 تفاصيل الطلب (' + items.length + ' منتج)</p>' +
          '<span class="_badr_badge">' + totalQty + ' قطعة إجمالاً</span>' +
        '</div>' +
        '<div>' + iHtml + '</div>' +

        /* ── الملخص المالي ── */
        '<div style="background:#1c1c1c;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 16px;margin-top:6px">' +
          '<p style="color:#9ca3af;font-size:11px;font-weight:700;margin:0 0 8px">📊 ملخص الفاتورة</p>' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#9ca3af;font-size:12px">المجموع الفرعي (قبل التوصيل)</span><span style="color:#fff;font-size:13px;font-weight:700">' + subtotal + ' ج.م</span></div>' +
          deliveryRow +
          discountRow +
          '<div style="display:flex;justify-content:space-between;padding:10px 0 2px;border-top:2px solid #10b981;margin-top:8px">' +
            '<span style="color:#10b981;font-size:15px;font-weight:900">💰 الإجمالي النهائي للعميل</span>' +
            '<span style="color:#10b981;font-size:19px;font-weight:900">' + total + ' ج.م</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* ── الأزرار ── */
      '<div style="padding:10px 20px 20px;display:flex;gap:12px">' +
        '<button id="_badr_acc" onclick="_badrAcc()">✅ استلام الطلب</button>' +
        '<button id="_badr_rej" onclick="_badrRej()">❌ تجاهل</button>' +
      '</div>' +

    '</div>';
    document.body.appendChild(ov);
    try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}
  }

  function hideNotif() { var e = document.getElementById('_badr_ov'); if(e) e.remove(); curId = null; }

  window._badrAcc = function() {
    if (!curId) return;
    var b = document.getElementById('_badr_acc'); if(b) b.textContent = '⏳ جاري الاستلام...';
    supaFetch('PATCH', '/online_order_notifications?id=eq.' + curId, { status:'accepted', accepted_by:'اسلام', accepted_at: new Date().toISOString() });
    hideNotif();
  };
  window._badrRej = function() {
    if (curId) supaFetch('PATCH', '/online_order_notifications?id=eq.' + curId, { status:'rejected' });
    hideNotif();
  };

  function poll() {
    var since = new Date(Date.now() - 3*60*60*1000).toISOString();
    fetch(SUPA_URL + '/online_order_notifications?status=eq.pending&created_at=gte.' + encodeURIComponent(since) + '&order=created_at.asc&select=*', { headers: hdrs })
      .then(function(r){ return r.json(); })
      .then(function(rows){
        if (!Array.isArray(rows)) { setSt('🔴 خطأ: ' + JSON.stringify(rows).slice(0,60), false); return; }
        setSt('🟢 متصل — طلبات معلقة: ' + rows.length, true);
        rows.forEach(showNotif);
      }).catch(function(e){ setSt('🔴 ' + e.message, false); });
  }

  poll();
  setInterval(poll, 5000);
  console.log('[بدر الدين] نظام الإشعارات جاهز ✅');
})();
`);
  });

  // ── Cashier Notification Page ─────────────────────────
  app.get("/cashier-notify", (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>إشعارات الكاشير — محمصة بدر الدين</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center}
    #status-bar{position:fixed;top:0;left:0;right:0;background:#141414;border-bottom:1px solid #1f2937;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;z-index:100}
    .status-dot{width:8px;height:8px;border-radius:50%;background:#10b981;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    #center-msg{text-align:center;opacity:.4}
    #notif-container{position:fixed;top:60px;left:0;right:0;display:flex;justify-content:center;z-index:999}
    #notif-card{background:#141414;border:1px solid rgba(255,255,255,0.08);border-top:3px solid #10b981;border-radius:0 0 24px 24px;width:100%;max-width:700px;box-shadow:0 20px 80px rgba(16,185,129,0.25);animation:slideDown .4s cubic-bezier(.34,1.56,.64,1);display:none}
    @keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}
    .card-header{background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(16,185,129,.05));padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center}
    .card-grid{padding:14px 24px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .card-cell{background:#1c1c1c;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 14px}
    .cell-label{color:#6b7280;font-size:10px;margin-bottom:4px;text-transform:uppercase}
    .cell-value{color:#fff;font-size:13px;font-weight:600;word-break:break-word;white-space:pre-wrap}
    .items-list{padding:0 24px 14px}
    .item-row{background:#1c1c1c;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;flex-direction:column;gap:8px}
    .item-row-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
    .item-chips{display:flex;flex-wrap:wrap;gap:6px}
    .chip{border-radius:999px;padding:3px 9px;font-size:11px;font-weight:700;border:1px solid}
    .item-desc{color:#9ca3af;font-size:11px;line-height:1.5}
    .item-notes{color:#f59e0b;font-size:11px;background:rgba(245,158,11,0.08);border-radius:8px;padding:5px 10px;border:1px solid rgba(245,158,11,0.2)}
    .actions{padding:12px 24px 24px;display:flex;gap:12px}
    #btn-accept{flex:1;height:56px;border-radius:16px;border:none;cursor:pointer;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:18px;font-weight:900;box-shadow:0 8px 24px rgba(16,185,129,.4)}
    #btn-reject{width:120px;height:56px;border-radius:16px;cursor:pointer;background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.25);font-size:15px;font-weight:700}
    #progress-bar{height:4px;background:#10b981;transition:width 1s linear}
    .badge{background:rgba(16,185,129,.15);color:#10b981;border-radius:8px;padding:2px 8px;font-size:12px;font-weight:800}
    #pending-queue{position:fixed;bottom:16px;right:16px;background:#141414;border:1px solid #1f2937;border-radius:12px;padding:10px 16px;font-size:12px;color:#9ca3af;max-width:260px}
    .queue-item{padding:6px 0;border-bottom:1px solid #1f2937;cursor:pointer;color:#d1fae5}
    .queue-item:last-child{border:none}
  </style>
</head>
<body>
  <div id="status-bar">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="status-dot" id="dot"></div>
      <span style="font-size:13px;color:#9ca3af" id="status-text">جاري الاتصال...</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <img src="/logo.png" alt="بدر الدين" style="height:32px;object-fit:contain" onerror="this.style.display='none'"/>
      <span style="color:#6b7280;font-size:12px">محمصة بدر الدين</span>
    </div>
  </div>

  <div id="center-msg">
    <div style="font-size:48px;margin-bottom:16px">🛒</div>
    <div style="font-size:16px;font-weight:600;color:#6b7280">في انتظار الطلبات الجديدة...</div>
    <div style="font-size:12px;color:#374151;margin-top:8px">سيظهر الإشعار تلقائياً عند ورود طلب</div>
  </div>

  <div id="notif-container">
    <div id="notif-card">
      <div style="background:rgba(255,255,255,.06)">
        <div id="progress-bar" style="width:100%"></div>
      </div>
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:14px">
          <img src="/logo.png" alt="بدر الدين" id="notif-logo"
            style="width:52px;height:52px;border-radius:14px;border:2px solid #10b981;object-fit:contain;background:#fff"
            onerror="this.style.display='none'"/>
          <div>
            <p style="color:#fff;font-size:20px;font-weight:900">طلب جديد من الموقع!</p>
            <p style="color:#34d399;font-size:13px;margin-top:4px">🟢 يُستلم بواسطة: اسلام</p>
          </div>
        </div>
        <div style="text-align:left">
          <p style="color:#10b981;font-size:30px;font-weight:900" id="notif-total">—</p>
          <p style="color:#6b7280;font-size:12px;margin-top:4px" id="notif-countdown">ينتهي خلال 60ث</p>
        </div>
      </div>
      <div class="card-grid" id="notif-grid"></div>
      <div class="items-list" id="notif-items"></div>
      <div class="actions">
        <button id="btn-accept" onclick="acceptOrder()">✅ استلام الطلب</button>
        <button id="btn-reject" onclick="rejectOrder()">❌ تجاهل</button>
      </div>
    </div>
  </div>

  <div id="pending-queue" style="display:none">
    <div style="color:#9ca3af;font-size:11px;font-weight:700;margin-bottom:8px">🕐 طلبات معلقة أخرى</div>
    <div id="queue-list"></div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script>
  (function(){
    var sb = window.supabase.createClient(
      'https://ccvprapyetmkorblrkgw.supabase.co',
      'sb_publishable_FYWy-1ZaF3Ad8olmhPKZhg_wvRISriE'
    );

    var currentOrder = null;
    var pendingQueue = [];
    var seenIds = new Set();
    var countdown = 60;
    var countTimer = null;

    function setStatus(text, ok) {
      var dot = document.getElementById('dot');
      var st = document.getElementById('status-text');
      if (st) st.textContent = text;
      if (dot) dot.style.background = ok === false ? '#ef4444' : '#10b981';
    }

    function showCard(order) {
      currentOrder = order;
      seenIds.add(order.id);
      countdown = 60;

      var items = [];
      try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e){}

      document.getElementById('notif-total').textContent = Math.round(order.total || 0) + ' ج.م';

      var grid = '<div class="card-cell"><div class="cell-label">👤 العميل</div><div class="cell-value">' + (order.customer_name || 'زبون') + '</div></div>';
      grid += '<div class="card-cell"><div class="cell-label">📞 الهاتف</div><div class="cell-value">' + (order.customer_phone || '—') + '</div></div>';
      if (order.address && order.address !== 'غير محدد') {
        grid += '<div class="card-cell" style="grid-column:span 2"><div class="cell-label">📍 العنوان</div><div class="cell-value">' + order.address + '</div></div>';
      }
      document.getElementById('notif-grid').innerHTML = grid;

      var itemsHtml = '<p style="color:#9ca3af;font-size:11px;font-weight:700;margin-bottom:8px">🛒 المنتجات (' + items.length + ' عنصر)</p><div style="max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:8px">';
      items.forEach(function(it){
        var chips = '';
        if (it.unit)      chips += '<span class="chip" style="color:#60a5fa;background:rgba(96,165,250,0.12);border-color:rgba(96,165,250,0.3)">⚖️ ' + it.unit + '</span>';
        if (it.weight)    chips += '<span class="chip" style="color:#a78bfa;background:rgba(167,139,250,0.12);border-color:rgba(167,139,250,0.3)">🏋️ ' + it.weight + '</span>';
        if (it.size)      chips += '<span class="chip" style="color:#f472b6;background:rgba(244,114,182,0.12);border-color:rgba(244,114,182,0.3)">📐 ' + it.size + '</span>';
        if (it.badge)     chips += '<span class="chip" style="color:#f59e0b;background:rgba(245,158,11,0.12);border-color:rgba(245,158,11,0.3)">🏷️ ' + it.badge + '</span>';
        if (it.cutting)   chips += '<span class="chip" style="color:#f59e0b;background:rgba(245,158,11,0.12);border-color:rgba(245,158,11,0.3)">✂️ ' + it.cutting + '</span>';
        if (it.packaging) chips += '<span class="chip" style="color:#34d399;background:rgba(52,211,153,0.12);border-color:rgba(52,211,153,0.3)">📦 ' + it.packaging + '</span>';

        itemsHtml += '<div class="item-row">';
        itemsHtml += '<div class="item-row-top">';
        itemsHtml += '<div style="display:flex;align-items:flex-start;gap:10px;flex:1;min-width:0">';
        itemsHtml += '<span class="badge" style="flex-shrink:0;padding:4px 10px;font-size:14px">×' + it.quantity + '</span>';
        itemsHtml += '<div><p style="color:#fff;font-size:14px;font-weight:700;margin:0;line-height:1.3">' + (it.name || 'منتج') + '</p>';
        if (it.unit) itemsHtml += '<p style="color:#60a5fa;font-size:11px;font-weight:600;margin:2px 0 0">الوحدة: ' + it.unit + '</p>';
        itemsHtml += '</div></div>';
        itemsHtml += '<div style="text-align:left;flex-shrink:0"><p style="color:#34d399;font-weight:900;font-size:14px;margin:0">' + Math.round((it.price||0)*(it.quantity||1)) + ' ج.م</p>';
        itemsHtml += '<p style="color:#6b7280;font-size:10px;margin:2px 0 0;text-align:left">' + Math.round(it.price||0) + ' × ' + it.quantity + '</p></div>';
        itemsHtml += '</div>';
        if (it.description) itemsHtml += '<p class="item-desc">' + it.description + '</p>';
        if (chips) itemsHtml += '<div class="item-chips">' + chips + '</div>';
        if (it.notes) itemsHtml += '<p class="item-notes">📝 ' + it.notes + '</p>';
        itemsHtml += '</div>';
      });
      itemsHtml += '</div>';
      document.getElementById('notif-items').innerHTML = itemsHtml;

      document.getElementById('notif-card').style.display = 'block';
      document.getElementById('center-msg').style.display = 'none';
      document.getElementById('progress-bar').style.width = '100%';

      try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}

      clearInterval(countTimer);
      countTimer = setInterval(function(){
        countdown--;
        var el = document.getElementById('notif-countdown');
        var pr = document.getElementById('progress-bar');
        if (el) el.textContent = 'ينتهي خلال ' + countdown + 'ث';
        if (pr) {
          pr.style.width = ((countdown/60)*100) + '%';
          pr.style.background = countdown > 30 ? '#10b981' : countdown > 15 ? '#f59e0b' : '#ef4444';
        }
        if (countdown <= 0) { clearInterval(countTimer); dismissCard(); }
      }, 1000);
    }

    function dismissCard() {
      document.getElementById('notif-card').style.display = 'none';
      currentOrder = null;
      clearInterval(countTimer);
      // show next in queue
      if (pendingQueue.length > 0) {
        var next = pendingQueue.shift();
        showCard(next);
        updateQueueDisplay();
      } else {
        document.getElementById('center-msg').style.display = 'block';
      }
    }

    function updateQueueDisplay() {
      var queueDiv = document.getElementById('pending-queue');
      var listDiv = document.getElementById('queue-list');
      if (pendingQueue.length === 0) { queueDiv.style.display = 'none'; return; }
      queueDiv.style.display = 'block';
      listDiv.innerHTML = pendingQueue.map(function(o, i){
        return '<div class="queue-item" onclick="showFromQueue(' + i + ')">#' + o.order_id + ' — ' + (o.customer_name || 'زبون') + ' — ' + Math.round(o.total) + ' ج.م</div>';
      }).join('');
    }

    window.showFromQueue = function(idx) {
      var o = pendingQueue.splice(idx, 1)[0];
      if (currentOrder) pendingQueue.unshift(currentOrder);
      showCard(o);
      updateQueueDisplay();
    };

    function enqueue(order) {
      if (seenIds.has(order.id)) return;
      if (!currentOrder) {
        showCard(order);
      } else {
        seenIds.add(order.id);
        pendingQueue.push(order);
        updateQueueDisplay();
      }
    }

    window.acceptOrder = async function() {
      if (!currentOrder) return;
      document.getElementById('btn-accept').textContent = '⏳ جاري الاستلام...';
      await sb.from('online_order_notifications').update({
        status: 'accepted', cashier_id: 1,
        accepted_by: 'اسلام', accepted_at: new Date().toISOString()
      }).eq('id', currentOrder.id);
      dismissCard();
    };

    window.rejectOrder = function() {
      if (currentOrder) sb.from('online_order_notifications').update({ status: 'rejected' }).eq('id', currentOrder.id);
      dismissCard();
    };

    // ── Poll every 5s ────────────────────────────────────
    async function poll() {
      var since = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      var r = await sb.from('online_order_notifications').select('*').eq('status','pending').gte('created_at', since).order('created_at',{ascending:true});
      if (r.error) { setStatus('خطأ: ' + r.error.message, false); return; }
      var rows = r.data || [];
      setStatus('متصل — طلبات معلقة: ' + rows.length, true);
      rows.forEach(function(o){ enqueue(o); });
    }

    // ── Realtime ─────────────────────────────────────────
    sb.channel('cashier-' + Date.now())
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'online_order_notifications'},function(p){
        if (p.new && p.new.status === 'pending') enqueue(p.new);
      })
      .subscribe(function(s){ if (s==='SUBSCRIBED') setStatus('متصل (Realtime نشط)', true); });

    poll();
    setInterval(poll, 5000);
  })();
  </script>
</body>
</html>`);
  });
  // ──────────────────────────────────────────────────────

  app.get("/api/categories", async (_req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // --- Image Upload & Optimization ---
  const upload = multer({ storage: multer.memoryStorage() });
  const UPLOAD_DIR = path.join(process.cwd(), "uploads");

  // Ensure directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  app.post("/api/upload", (req, res, next) => {
    // SECURITY: Only staff and admins can upload files
    const user = req.user as SelectUser;
    const isStaffOrAdmin = user && (user.isAdmin || (user.role && user.role !== 'customer'));

    if (!req.isAuthenticated() || !isStaffOrAdmin) {
      console.warn("🚫 [UPLOAD_DENIED] Unauthorized upload attempt");
      return res.status(403).json({ message: "غير مصرح لك برفع الصور" });
    }

    console.log("🚀 [UPLOAD_DEBUG] Authorized upload request");
    next();
  }, upload.single("image"), async (req, res) => {
    console.log("📁 [UPLOAD_DEBUG] Multer processed. File:", req.file ? req.file.originalname : "NONE");

    if (!req.file) {
      console.warn("⚠️ [UPLOAD_DEBUG] No file in request");
      return res.status(400).json({ message: "لم يتم رفع أي صورة" });
    }

    console.log(`📁 [UPLOAD_DEBUG] Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

    try {
      const timestamp = Date.now();
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
      const fileName = `${timestamp}-${safeName}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      let outputBuffer = req.file.buffer;

      // Try optimization
      try {
        console.log("⚙️ [UPLOAD_DEBUG] Attempting optimization with Sharp...");
        let width = 1200;
        let quality = 80;

        outputBuffer = await sharp(req.file.buffer)
          .resize({ width, withoutEnlargement: true })
          .jpeg({ quality, progressive: true })
          .toBuffer();

        console.log(`✅ [UPLOAD_DEBUG] Sharp optimization successful. New size: ${outputBuffer.length} bytes`);
      } catch (sharpError: any) {
        console.error("⚠️ [UPLOAD_DEBUG] Sharp optimization failed:", sharpError.message);
        // Fallback to original buffer
      }

      await fs.promises.writeFile(filePath, outputBuffer);
      const publicUrl = `/uploads/${fileName}`;
      console.log("💾 [UPLOAD_DEBUG] File saved successfully to:", publicUrl);

      res.json({ url: publicUrl });
    } catch (error: any) {
      console.error("❌ [UPLOAD_DEBUG] Full upload failure:", error);
      res.status(500).json({ message: "فشل رفع الصورة على الخادم", error: error.message });
    }
  });

  // Telegram Verification Logic
  // --- Telegram Deep Linking Auth ---

  // 1. Init: Generate Token & Link
  app.post("/api/auth/telegram/init", async (req, res) => {
    const { phone } = req.body;
    console.log(`🚀 [TELEGRAM_AUTH] Received init request for phone: ${phone}`);

    if (!phone) {
      console.error("❌ [TELEGRAM_AUTH] Phone missing in request body");
      return res.status(400).json({ message: "Phone is required" });
    }

    const verifyToken = Math.random().toString(36).substring(2, 16);
    const { verificationSession } = await import("./telegram");

    // Normalize phone
    const cleanPhone = phone.replace('+', '').replace(/\D/g, '');
    console.log(`📡 [TELEGRAM_AUTH] Creating session for token: ${verifyToken}, cleanPhone: ${cleanPhone}`);

    verificationSession[verifyToken] = {
      phone: cleanPhone,
      status: 'PENDING'
    };

    const botLink = `https://t.me/Badr_Alden_bot?start=${verifyToken}`;
    console.log(`🔗 [TELEGRAM_AUTH] Bot link generated: ${botLink}`);
    res.json({ token: verifyToken, link: botLink });
  });

  // 2. Status: Check if verified
  app.get("/api/auth/telegram/status", async (req, res) => {
    const verifyToken = req.query.token as string;
    if (!verifyToken) return res.status(400).json({ message: "Token required" });

    const { verificationSession } = await import("./telegram");
    const session = verificationSession[verifyToken];

    if (!session) {
      return res.status(404).json({ message: "Session expired" });
    }

    res.json({ status: session.status });
  });

  // Sync user profile from Supabase Auth → public.users using service role key
  // Returns the authenticated user's full profile (bypasses RLS via service key)
  // Decodes JWT manually to extract user ID — avoids dependency on getUser() which requires matching service key
  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.slice(7);
    try {
      // Decode JWT payload (middle segment) without signature verification
      const parts = token.split(".");
      if (parts.length !== 3) return res.status(401).json({ message: "Invalid token format" });

      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      const userId = payload.sub as string;
      if (!userId) return res.status(401).json({ message: "No user ID in token" });

      // Check token expiry
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        return res.status(401).json({ message: "Token expired" });
      }

      const { data: profile, error: dbError } = await supabaseAdmin.from("users").select("*").eq("id", userId).single();
      if (dbError) {
        console.error("❌ [AUTH/ME] DB error for userId", userId, ":", dbError.message, dbError.code);
        return res.status(500).json({ message: dbError.message });
      }
      if (!profile) {
        console.warn("⚠️ [AUTH/ME] No profile found for userId:", userId);
        return res.status(404).json({ message: "Profile not found" });
      }

      console.log("✅ [AUTH/ME] Profile fetched:", profile.username, "| isAdmin:", profile.is_admin, "| role:", profile.role);
      return res.json({ success: true, user: profile });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/lookup-email", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "Username is required" });

    try {
      const user = await storage.getUserByUsername(username);
      if (user && user.email) {
        return res.json({ email: user.email });
      }
      return res.status(404).json({ message: "User not found or has no email" });
    } catch (e) {
      console.error("Lookup error:", e);
      return res.status(500).json({ message: "Internal server error during lookup" });
    }
  });

  app.post("/api/auth/sync-profile", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.slice(7);

    try {
      // Decode JWT manually to extract user ID and metadata
      const parts = token.split(".");
      if (parts.length !== 3) return res.status(401).json({ message: "Invalid token format" });
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      const userId = payload.sub as string;
      if (!userId) return res.status(401).json({ message: "No user ID in token" });
      if (payload.exp && Date.now() / 1000 > payload.exp) return res.status(401).json({ message: "Token expired" });

      const userMeta = payload.user_metadata || {};
      const { customUsername, customPhone } = req.body || {};

      const rawUsername =
        customUsername ||
        userMeta.username ||
        userMeta.full_name ||
        userMeta.name ||
        payload.email?.split("@")[0] ||
        "user";

      const sanitized = rawUsername.replace(/[^a-zA-Z0-9_\s\u0600-\u06FF]/g, "").slice(0, 30);
      const baseUsername = sanitized.length >= 2 ? sanitized : "user_" + userId.slice(0, 6);

      let finalUsername = baseUsername;
      let success = false;

      for (let attempt = 0; attempt <= 5; attempt++) {
        if (attempt > 0) finalUsername = baseUsername + attempt;

        // Only INSERT — never overwrite existing data (preserves is_admin, role, etc.)
        const { error: upsertErr } = await supabaseAdmin.from("users").upsert(
          {
            id: userId,
            email: payload.email || "",
            username: finalUsername,
            password: "",
            phone: customPhone || userMeta.phone || "",
            is_admin: false,
            role: "customer",
            is_banned: false,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );

        if (!upsertErr) {
          success = true;
          break;
        }
        if (upsertErr.code === "23505" && upsertErr.message.includes("username")) continue;
        console.error("❌ [SYNC_PROFILE] Upsert failed:", upsertErr.message);
        return res.status(500).json({ message: upsertErr.message });
      }

      if (!success) {
        return res.status(500).json({ message: "Could not generate unique username" });
      }

      const { data: profile } = await supabaseAdmin.from("users").select("*").eq("id", userId).single();
      return res.json({ success: true, user: profile });
    } catch (err: any) {
      console.error("❌ [SYNC_PROFILE] Error:", err.message);
      return res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/update-profile", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.slice(7);
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return res.status(401).json({ message: "Invalid token format" });
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      const userId = payload.sub as string;
      if (!userId) return res.status(401).json({ message: "No user ID in token" });
      if (payload.exp && Date.now() / 1000 > payload.exp) return res.status(401).json({ message: "Token expired" });

      const { username, phone, avatarUrl } = req.body;
      if (!phone) return res.status(400).json({ message: "Phone is required" });

      const updateData: Record<string, any> = { phone };
      if (username) updateData.username = username;
      if (avatarUrl) updateData.avatar_url = avatarUrl;

      const { error: updateErr } = await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (updateErr) {
        console.error("❌ [UPDATE_PROFILE] DB error:", updateErr.message);
        return res.status(500).json({ message: updateErr.message });
      }

      const { data: profile } = await supabaseAdmin.from("users").select("*").eq("id", userId).single();
      console.log("✅ [UPDATE_PROFILE] Profile updated for:", userId);
      return res.json({ success: true, user: profile });
    } catch (err: any) {
      console.error("❌ [UPDATE_PROFILE] Error:", err.message);
      return res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/products", async (req, res) => {
    const categoryId = req.query.category as string;
    if (categoryId && categoryId !== 'all') {
      const products = await storage.getProductsByCategory(categoryId);
      res.json(products);
    } else {
      const products = await storage.getProducts();
      res.json(products);
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const product = await storage.getProduct(id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(product);
  });

  app.post("/api/orders", async (req, res) => {
    let resolvedUserId: string | null = null;

    // 1. Passport session auth
    if (req.isAuthenticated() && req.user) {
      resolvedUserId = (req.user as SelectUser).id;
    }

    // 2. Supabase Bearer token auth
    if (!resolvedUserId) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user: supaUser }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && supaUser) {
          resolvedUserId = supaUser.id;
        }
      }
    }

    // 3. Fall back to user_id from body (already authenticated on client via Supabase)
    if (!resolvedUserId && req.body.user_id) {
      resolvedUserId = req.body.user_id;
    }

    if (!resolvedUserId) {
      return res.status(401).send("Unauthorized");
    }

    const {
      items, address, total,
      customerName, customerPhone,
      customer_name, customer_phone,
      notes,
      subtotal, delivery_fee, discount_amount, coupon_code,
      gps_lat, gps_lng, payment_method, zone_id
    } = req.body;
    const resolvedCustomerName = customerName || customer_name || null;
    const resolvedCustomerPhone = customerPhone || customer_phone || null;
    if (!items || !items.length) {
      return res.status(400).send("No items in order");
    }

    const user = { id: resolvedUserId } as SelectUser;

    console.log('📦 Creating order for user:', user.id);
    console.log('📦 Order details:', { total, address, customerName, customerPhone, itemCount: items.length });

    const order = await storage.createOrder(
      {
        userId: user.id,
        total: total,
        subtotal: subtotal ?? null,
        deliveryFee: delivery_fee ?? null,
        discountAmount: discount_amount ?? null,
        couponCode: coupon_code ?? null,
        address: address,
        status: "pending",
        customerName: resolvedCustomerName,
        customerPhone: resolvedCustomerPhone,
        notes: notes,
        paymentMethod: payment_method || 'cash',
        zoneId: zone_id ?? null,
        gpsLat: gps_lat ?? null,
        gpsLng: gps_lng ?? null,
      },
      items.map((item: any) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        cutting: item.selectedCutting || null,
        packaging: item.selectedPackaging || null,
        notes: item.note || null,
      }))
    );

    console.log('✅ Order created successfully:', order.id);

    // ── Increment coupon usage count ──────────────────────
    if (coupon_code) {
      try {
        const { data: couponRow } = await supabaseAdmin
          .from('coupons')
          .select('id, used_count')
          .eq('code', coupon_code)
          .single();
        if (couponRow) {
          await supabaseAdmin
            .from('coupons')
            .update({ used_count: (couponRow.used_count || 0) + 1 })
            .eq('id', couponRow.id);
        }
      } catch (e) {
        console.warn('⚠️ Could not increment coupon usage:', e);
      }
    }

    // ── Send notification to Cashier POS system ──────────
    try {
      const notifPayload = {
        order_id:        order.id,
        customer_name:   resolvedCustomerName || 'زبون',
        customer_phone:  resolvedCustomerPhone || null,
        address:         address || null,
        notes:           notes || null,
        total:           total,
        subtotal:        subtotal ?? null,
        delivery_fee:    delivery_fee ?? null,
        discount_amount: discount_amount ?? null,
        coupon_code:     coupon_code ?? null,
        payment_method:  payment_method || 'cash',
        items:           JSON.stringify(items.map((item: any) => ({
          name:        item.name || item.productName || `منتج #${item.id}`,
          quantity:    item.quantity,
          price:       item.price,
          unit:        item.unit || null,
          description: item.description || null,
          weight:      item.weight || null,
          size:        item.size || null,
          badge:       item.badge || null,
          cutting:     item.selectedCutting || item.cutting || null,
          packaging:   item.selectedPackaging || item.packaging || null,
          notes:       item.note || item.notes || null,
        }))),
        status: 'pending',
      };
      console.log('📡 Sending POS notification:', JSON.stringify(notifPayload));
      const { data: notifData, error: notifError } = await posClient
        .from('online_order_notifications')
        .insert(notifPayload)
        .select();
      if (notifError) {
        console.error('❌ POS notification insert error:', JSON.stringify(notifError));
      } else {
        console.log('✅ POS notification inserted:', JSON.stringify(notifData));
      }
    } catch (notifErr: any) {
      console.error('❌ POS notification exception:', notifErr.message);
    }
    // ─────────────────────────────────────────────────────

    // ── Send order confirmation email to customer ────────
    try {
      console.log('✉️ Attempting to send email. resolvedUserId:', resolvedUserId);
      if (resolvedUserId) {
        const fullUser = await storage.getUser(resolvedUserId);
        
        // Try to get email from DB, fallback to Supabase Auth
        let customerEmail = fullUser?.email;
        if (!customerEmail) {
          try {
            const { data: { user: supaUser } } = await supabaseAdmin.auth.admin.getUserById(resolvedUserId);
            customerEmail = supaUser?.email;
          } catch (e) {
            console.warn("Could not fetch Supabase email fallback", e);
          }
        }
        
        console.log('✉️ Fetched email for receipt:', customerEmail);
        
        if (customerEmail) {
          const orderDetails = {
            orderId: order.id,
            customerName: resolvedCustomerName || fullUser?.username || 'زبون',
            items: items.map((item: any) => ({
              name: item.name || item.productName || `منتج #${item.id}`,
              quantity: item.quantity,
              price: item.price,
              cutting: item.selectedCutting || item.cutting || null,
              packaging: item.selectedPackaging || item.packaging || null,
            })),
            subtotal: subtotal || total,
            deliveryFee: delivery_fee || 0,
            discountAmount: discount_amount || 0,
            total: total,
            address: address || null,
            paymentMethod: payment_method || 'cash',
            baseUrl: `${req.protocol}://${req.get('host')}`
          };
          
          console.log('✉️ calling sendOrderConfirmationEmail...');
          await sendOrderConfirmationEmail(customerEmail, orderDetails);
          console.log(`✉️ Order confirmation email sent to ${customerEmail}`);
        } else {
           console.log('✉️ User has no email in DB or Supabase. Not sending.');
        }
      }
    } catch (emailErr: any) {
      console.error('❌ Failed to send order confirmation email:', emailErr.message);
    }
    // ─────────────────────────────────────────────────────

    res.status(201).json(order);
  });

  // --- Order Status (from POS online_order_notifications) ---
  app.get("/api/order-status/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) return res.status(400).json({ message: "رقم الطلب غير صحيح" });

      const COLS = 'id, order_id, status, customer_name, customer_phone, address, total, items, payment_method, created_at, accepted_at, accepted_by';

      // Try by order_id first (most common for orders from main website)
      const { data: byOrderId } = await posClient
        .from('online_order_notifications')
        .select(COLS)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (byOrderId) return res.json(byOrderId);

      // Fallback: try by POS notification PK (for orders where order_id is null)
      const { data: byId, error: errById } = await posClient
        .from('online_order_notifications')
        .select(COLS)
        .eq('id', orderId)
        .maybeSingle();

      if (errById || !byId) return res.status(404).json({ message: "لم يتم العثور على الطلب" });
      res.json(byId);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Order Rating System ---
  app.get("/api/orders/:orderId/rating", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) return res.status(400).json({ message: "رقم الطلب غير صحيح" });
      const { data, error } = await supabaseAdmin
        .from('order_ratings')
        .select('*')
        .or(`order_id.eq.${orderId},pos_notif_id.eq.${orderId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return res.status(500).json({ message: error.message });
      res.json({ rated: !!data, rating: data || null });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/orders/:orderId/rate", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) return res.status(400).json({ message: "رقم الطلب غير صحيح" });
      const { rating, tags, note, customer_phone, driver_name, pos_notif_id } = req.body;
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "تقييم غير صحيح" });
      const { data: existing } = await supabaseAdmin
        .from('order_ratings')
        .select('id')
        .or(`order_id.eq.${orderId},pos_notif_id.eq.${orderId}`)
        .limit(1)
        .maybeSingle();
      if (existing) return res.status(409).json({ message: "تم تقييم هذا الطلب مسبقاً" });
      const { data, error } = await supabaseAdmin
        .from('order_ratings')
        .insert({
          order_id: orderId,
          pos_notif_id: pos_notif_id || null,
          rating,
          tags: tags || [],
          note: note || null,
          customer_phone: customer_phone || null,
          driver_name: driver_name || null,
        })
        .select()
        .single();
      if (error) return res.status(500).json({ message: error.message });
      res.status(201).json({ success: true, rating: data });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Admin Image Upload (bypasses Storage RLS using service key) ---
  app.post("/api/admin/upload-image", upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "لم يتم رفع أي صورة" });
    }
    try {
      const BUCKET = 'badr alden';
      const folder = (req.body.folder as string) || 'products';
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_') + `_${Date.now()}.jpg`;
      const filePath = `${folder}/${safeName}`;

      let buffer = req.file.buffer;
      try {
        buffer = await sharp(req.file.buffer)
          .resize({ width: 1400, withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      } catch { /* use original if sharp fails */ }

      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          cacheControl: '31536000',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
      res.json({ url: urlData.publicUrl });
    } catch (err: any) {
      console.error("❌ [ADMIN_UPLOAD]", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  // --- Product Management Routes (Server-side to bypass RLS) ---
  app.post("/api/admin/products", async (req, res) => {
    try {
      const { error, data } = await supabaseAdmin
        .from('products')
        .insert([req.body])
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err: any) {
      console.error("❌ [POST /api/admin/products]", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error, data } = await supabaseAdmin
        .from('products')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      console.error("❌ [PATCH /api/admin/products/:id]", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ [DELETE /api/admin/products/:id]", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/products/bulk-delete", async (req, res) => {
    try {
      const { ids } = req.body as { ids: number[] };
      if (!ids || !ids.length) return res.status(400).json({ message: "لم يتم تحديد أي منتجات" });
      const { error } = await supabaseAdmin.from('products').delete().in('id', ids);
      if (error) throw error;
      res.json({ success: true, deleted: ids.length });
    } catch (err: any) {
      console.error("❌ [BULK_DELETE]", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/products/bulk-update", async (req, res) => {
    try {
      const { ids, data } = req.body as { ids: number[], data: Record<string, any> };
      if (!ids || !ids.length) return res.status(400).json({ message: "لم يتم تحديد أي منتجات" });
      const { error } = await supabaseAdmin.from('products').update(data).in('id', ids);
      if (error) throw error;
      res.json({ success: true, updated: ids.length });
    } catch (err: any) {
      console.error("❌ [BULK_UPDATE]", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/categories", async (req, res) => {
    try {
      const { error, data } = await supabaseAdmin
        .from('categories')
        .upsert([req.body])
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err: any) {
      console.error("❌ [POST /api/admin/categories]", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error, data } = await supabaseAdmin
        .from('categories')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      console.error("❌ [PATCH /api/admin/categories/:id]", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("❌ [DELETE /api/admin/categories/:id]", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const orders = await storage.getUserOrders((req.user as SelectUser).id);
    res.json(orders);
  });

  // ============================================================
  // POS Integration Routes (Read-Only from Cashier System)
  // ============================================================

  app.get("/api/pos/stats", async (_req, res) => {
    try {
      const stats = await fetchPosStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/pos/products", async (req, res) => {
    try {
      const { category, search, limit = '50', offset = '0' } = req.query as Record<string, string>;
      let query = posClient
        .from('products')
        .select('id,name,sku,barcode,categoryId,unitPrice,stock,unit,description,imageUrl')
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      if (category) query = query.eq('categoryId', category);
      if (search) query = query.ilike('name', `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/pos/categories", async (_req, res) => {
    try {
      const { data, error } = await posClient.from('categories').select('id,name,nameEn').order('id');
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/pos/products/all", async (_req, res) => {
    try {
      const products = await fetchAllPosProducts();
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/pos/sales", async (req, res) => {
    try {
      const { limit = '50', offset = '0', search = '' } = req.query as Record<string, string>;
      let query = posClient
        .from('sales')
        .select('*')
        .order('id', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      if (search) query = query.ilike('customerName', `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/pos/sales/:id", async (req, res) => {
    try {
      const { data, error } = await posClient.from('sales').select('*').eq('id', req.params.id).single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/pos/analytics/dashboard", async (req, res) => {
    try {
      const period = (req.query.period as string) || 'month';
      const data = await getPosAnalyticsDashboard(period);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/pos/chart", async (_req, res) => {
    try {
      const { data, error } = await posClient.from('sales').select('total,createdAt,status,paymentMethod');
      if (error) throw error;
      const sales = data || [];
      // Group by date (last 14 days)
      const byDate: Record<string, { revenue: number; count: number }> = {};
      const byPayment: Record<string, number> = {};
      const byHour: Record<number, number> = {};
      for (const s of sales) {
        if (s.status !== 'مكتمل') continue;
        const date = new Date(s.createdAt).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' });
        byDate[date] = byDate[date] || { revenue: 0, count: 0 };
        byDate[date].revenue += parseFloat(s.total) || 0;
        byDate[date].count += 1;
        byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] || 0) + 1;
        const hr = new Date(s.createdAt).getHours();
        byHour[hr] = (byHour[hr] || 0) + 1;
      }
      const dailyArr = Object.entries(byDate).map(([date, v]) => ({ date, ...v })).slice(-14);
      const paymentArr = Object.entries(byPayment).map(([method, count]) => ({ method, count }));
      const hourlyArr = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: byHour[h] || 0 }));
      res.json({ daily: dailyArr, payment: paymentArr, hourly: hourlyArr });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/pos/import-products", async (req, res) => {
    const user = req.user as SelectUser;
    if (!req.isAuthenticated() || !(user?.isAdmin || user?.role === 'admin' || user?.role === 'manager')) {
      return res.status(403).json({ message: "غير مصرح — الإداريون فقط" });
    }
    try {
      const { productIds } = req.body as { productIds: number[] };
      if (!productIds?.length) return res.status(400).json({ message: "لا يوجد منتجات محددة" });
      const { data: posProds, error } = await posClient
        .from('products')
        .select('*')
        .in('id', productIds);
      if (error) throw error;
      let imported = 0, errors = 0;
      for (const p of posProds || []) {
        const categoryId = POS_CATEGORY_MAP[p.categoryId] || null;
        const price = parseFloat(p.unitPrice) || 0;
        if (!p.name || price <= 0) { errors++; continue; }
        const { error: e } = await supabaseAdmin.from('products').insert({
          name: p.name,
          category_id: categoryId,
          price: price.toString(),
          unit: p.unit || 'قطعة',
          description: p.description || null,
          image: p.imageUrl || null,
          is_active: true,
          stock_quantity: parseInt(p.stock) || 0,
          is_out_of_stock: parseInt(p.stock) <= 0,
        });
        if (e) errors++; else imported++;
      }
      res.json({ success: true, imported, errors });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/site/overview", async (_req, res) => {
    try {
      const [prodRes, catRes, userRes, orderRes] = await Promise.all([
        supabaseAdmin.from('products').select('id,name,category_id,price,stock_quantity,is_active,is_out_of_stock,created_at', { count: 'exact' }),
        supabaseAdmin.from('categories').select('*'),
        supabaseAdmin.from('users').select('id,email,phone,role,is_admin,created_at', { count: 'exact' }),
        supabaseAdmin.from('orders').select('id,total,status,created_at', { count: 'exact' }),
      ]);
      res.json({
        products: { total: prodRes.count || 0, data: prodRes.data || [] },
        categories: catRes.data || [],
        users: { total: userRes.count || 0, data: userRes.data || [] },
        orders: { total: orderRes.count || 0, data: orderRes.data || [] },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/pos/sync", async (req, res) => {
    const user = req.user as SelectUser;
    if (!req.isAuthenticated() || !(user?.isAdmin || user?.role === 'admin' || user?.role === 'manager')) {
      return res.status(403).json({ message: "غير مصرح — الإداريون فقط" });
    }
    try {
      const posProducts = await fetchAllPosProducts();
      let synced = 0, skipped = 0, errors = 0;

      for (const p of posProducts) {
        const categoryId = POS_CATEGORY_MAP[p.categoryId] || null;
        const price = parseFloat(p.unitPrice) || 0;
        if (!p.name || price <= 0) { skipped++; continue; }

        const record = {
          name: p.name,
          category_id: categoryId,
          price: price.toString(),
          unit: p.unit || 'قطعة',
          description: p.description || null,
          image: p.imageUrl || null,
          is_active: true,
          stock_quantity: parseInt(p.stock) || 0,
          is_out_of_stock: parseInt(p.stock) <= 0,
          pos_sku: p.sku || null,
        };

        const { error } = await supabaseAdmin
          .from('products')
          .upsert(record, { onConflict: 'pos_sku', ignoreDuplicates: false });

        if (error) {
          if (error.code === '42703') {
            const { error: e2 } = await supabaseAdmin.from('products').insert({
              name: record.name,
              category_id: record.category_id,
              price: record.price,
              unit: record.unit,
              description: record.description,
              image: record.image,
              is_active: record.is_active,
              stock_quantity: record.stock_quantity,
              is_out_of_stock: record.is_out_of_stock,
            });
            if (e2) { errors++; } else { synced++; }
          } else { errors++; }
        } else { synced++; }
      }

      res.json({ success: true, total: posProducts.length, synced, skipped, errors });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Delivery Zones CRUD (server-side to avoid Supabase RLS/schema issues) ---

  // Supports both passport sessions (local login) AND Supabase OAuth sessions
  async function resolveZoneAdmin(req: any): Promise<boolean> {
    // 1. Passport session (local login)
    const passportUser = req.user as SelectUser | undefined;
    if (passportUser && (passportUser.isAdmin || (passportUser as any).is_admin || passportUser.role === 'admin' || passportUser.role === 'manager')) {
      return true;
    }

    // 2. Supabase Bearer token (Google OAuth / Supabase auth)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user: supaUser }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && supaUser) {
        const { data: dbUser } = await supabaseAdmin.from('users').select('is_admin,role').eq('id', supaUser.id).single();
        if (dbUser && (dbUser.is_admin || dbUser.role === 'admin' || dbUser.role === 'manager')) return true;
      }
    }

    // 3. Supabase session cookie fallback — look up user by session
    if (req.isAuthenticated && req.isAuthenticated()) return true;

    // 4. Check if there's a supabase-auth-token cookie and resolve it
    try {
      const cookieHeader = req.headers.cookie || '';
      const tokenMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
      if (tokenMatch) {
        const rawToken = decodeURIComponent(tokenMatch[1]);
        const parsed = JSON.parse(rawToken);
        const accessToken = parsed?.access_token || (Array.isArray(parsed) ? parsed[0] : null);
        if (accessToken) {
          const { data: { user: supaUser } } = await supabaseAdmin.auth.getUser(accessToken);
          if (supaUser) {
            const { data: dbUser } = await supabaseAdmin.from('users').select('is_admin,role').eq('id', supaUser.id).single();
            if (dbUser && (dbUser.is_admin || dbUser.role === 'admin' || dbUser.role === 'manager')) return true;
          }
        }
      }
    } catch {}

    return false;
  }

  app.get("/api/admin/delivery-zones", async (req, res) => {
    if (!await resolveZoneAdmin(req)) {
      return res.status(403).json({ message: "غير مصرح" });
    }
    try {
      const { data, error } = await supabaseAdmin
        .from('delivery_zones')
        .select('id, name, fee, min_order, is_active, coordinates')
        .order('id', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/delivery-zones", async (req, res) => {
    if (!await resolveZoneAdmin(req)) {
      return res.status(403).json({ message: "غير مصرح" });
    }
    try {
      const { name, fee, driver_commission, min_order, coordinates, is_active } = req.body;
      const { data, error } = await supabaseAdmin
        .from('delivery_zones')
        .insert([{ name, fee: fee ?? 0, min_order: min_order ?? 0, coordinates: coordinates ?? null, is_active: is_active ?? true }])
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/admin/delivery-zones/:id", async (req, res) => {
    if (!await resolveZoneAdmin(req)) {
      return res.status(403).json({ message: "غير مصرح" });
    }
    try {
      const { name, fee, min_order, coordinates, is_active } = req.body;
      const { data, error } = await supabaseAdmin
        .from('delivery_zones')
        .update({ name, fee: fee ?? 0, min_order: min_order ?? 0, coordinates: coordinates ?? null, is_active: is_active ?? true })
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;
      if (!data) return res.status(404).json({ message: "المنطقة غير موجودة" });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/delivery-zones/:id", async (req, res) => {
    if (!await resolveZoneAdmin(req)) {
      return res.status(403).json({ message: "غير مصرح" });
    }
    try {
      const fields = req.body;
      if (Object.keys(fields).length === 0) return res.status(400).json({ message: "لا توجد حقول للتحديث" });
      const { data, error } = await supabaseAdmin
        .from('delivery_zones')
        .update(fields)
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;
      if (!data) return res.status(404).json({ message: "المنطقة غير موجودة" });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/delivery-zones/:id", async (req, res) => {
    if (!await resolveZoneAdmin(req)) {
      return res.status(403).json({ message: "غير مصرح" });
    }
    try {
      const { error } = await supabaseAdmin
        .from('delivery_zones')
        .delete()
        .eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ============================================================
  // Order Reviews
  // ============================================================

  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "يجب تسجيل الدخول" });
    const { order_id, rating, tags, notes } = req.body;
    if (!order_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "بيانات التقييم غير صحيحة" });
    }
    try {
      const user = req.user as SelectUser;
      const { error } = await supabaseAdmin
        .from('order_reviews')
        .upsert({ order_id, user_id: user.id, rating, tags: tags || [], notes: notes || null }, { onConflict: 'order_id', ignoreDuplicates: true });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/reviews/check/:orderId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ reviewed: false });
    try {
      const { data } = await supabaseAdmin
        .from('order_reviews')
        .select('id')
        .eq('order_id', parseInt(req.params.orderId))
        .maybeSingle();
      res.json({ reviewed: !!data });
    } catch {
      res.json({ reviewed: false });
    }
  });

  return httpServer;
}

import nodemailer from "nodemailer";

const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Configure this in Vercel / environment
  },
});

const fullLogoUrl = "https://raw.githubusercontent.com/HSG116/url/refs/heads/main/A_logo_with_the_store's_name_below_it_1779558557783.png";

export const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationEmail = async (email: string) => {
  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  verificationCodes.set(email, { code, expiresAt });

  const mailOptions = {
    from: '"محمصة بدر الدين" <badr.alden010@gmail.com>',
    to: email,
    subject: "🔐 سرّ الجودة في رمزك - محمصة بدر الدين",
    html: `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700;900&display=swap');
        
        body { margin: 0; padding: 0; background-color: #1a0b05; font-family: 'Cairo', sans-serif; }
        .wrapper { 
          background: linear-gradient(180deg, #2d1606 0%, #1a0b05 100%);
          padding: 60px 20px;
          min-height: 100%;
        }
        .main-card {
          max-width: 550px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 40px;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .header {
          background: #3d1408;
          padding: 50px 20px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(234,134,64,0.1) 0%, transparent 70%);
        }
        .logo {
          width: 220px;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
          transition: transform 0.5s ease;
        }
        .content {
          padding: 50px 40px;
          text-align: center;
          background: linear-gradient(180deg, #ffffff 0%, #fffbf8 100%);
        }
        .title {
          font-size: 34px;
          font-weight: 900;
          color: #3d1408;
          margin: 0 0 15px 0;
          letter-spacing: -1px;
        }
        .subtitle {
          font-size: 17px;
          color: #6d5a52;
          line-height: 1.8;
          margin-bottom: 40px;
          font-weight: 400;
        }
        .otp-container {
          background: #3d1408;
          border-radius: 30px;
          padding: 45px 20px;
          margin: 30px 0;
          position: relative;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.5), 0 15px 30px rgba(234,134,64,0.2);
          border: 2px solid #ea8640;
        }
        .otp-label {
          color: #ea8640;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-bottom: 15px;
          display: block;
        }
        .otp-code {
          font-size: 64px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 15px;
          margin: 0;
          text-shadow: 0 0 20px rgba(234,134,64,0.6);
        }
        .timer-bar {
          height: 4px;
          width: 80%;
          background: rgba(234,134,64,0.2);
          margin: 25px auto 0;
          border-radius: 10px;
          overflow: hidden;
        }
        .timer-progress {
          height: 100%;
          width: 60%; /* Animation simulation */
          background: #ea8640;
          border-radius: 10px;
        }
        .cta-button {
          display: inline-block;
          padding: 18px 50px;
          background: linear-gradient(135deg, #ea8640 0%, #c2410c 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 20px;
          font-weight: 700;
          font-size: 18px;
          margin-top: 20px;
          box-shadow: 0 15px 30px rgba(194,65,12,0.3);
          border-bottom: 4px solid #9a3412;
        }
        .footer {
          padding: 40px;
          text-align: center;
          background: #fdfaf8;
          border-top: 1px solid #f1ece9;
        }
        .footer-logo { width: 40px; opacity: 0.5; margin-bottom: 20px; }
        .rights { color: #a18e86; font-size: 13px; font-weight: 600; }
        
        /* Animations for supported clients */
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .logo { animation: float 4s ease-in-out infinite; }
        .otp-container { animation: pulse 2s infinite; }
        @keyframes pulse {
          0% { box-shadow: 0 15px 30px rgba(234,134,64,0.2); }
          50% { box-shadow: 0 15px 50px rgba(234,134,64,0.4); }
          100% { box-shadow: 0 15px 30px rgba(234,134,64,0.2); }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="main-card">
          <!-- Header Section with Floating Logo -->
          <div class="header">
            <img src="${fullLogoUrl}" alt="محمصة بدر الدين" class="logo">
          </div>

          <!-- Body Content -->
          <div class="content">
            <h1 class="title">رحلة الجودة تبدأ من هنا</h1>
            <p class="subtitle">
              أهلاً بك في عالم <b>محمصة بدر الدين</b>. نحن متحمسون لانضمامك إلينا، يرجى استخدام الرمز السري أدناه لتأكيد هويتك والدخول لمجتمعنا الفاخر.
            </p>

            <!-- Interactive-looking OTP Box -->
            <div class="otp-container">
              <span class="otp-label">كود التحقق الآمن</span>
              <div class="otp-code">${code}</div>
              <div class="timer-bar">
                <div class="timer-progress"></div>
              </div>
            </div>

            <p style="color: #9a3412; font-weight: 700; font-size: 14px;">
              ⏱ ينتهي الرمز خلال 10 دقائق
            </p>

            <a href="#" class="cta-button">تأكيد الحساب الآن</a>

            <p style="margin-top: 40px; color: #cbd5e1; font-size: 12px;">
              إذا لم تكن أنت من قام بهذا الطلب، يرجى تجاهل الرسالة.
            </p>
          </div>

          <!-- Luxury Footer -->
          <div class="footer">
            <div class="rights">
              © ${new Date().getFullYear()} محمصة بدر الدين<br>
              <span style="color: #ea8640;">تحميص يدوي بلمسة فنية</span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const verifyCode = (email: string, code: string): boolean => {
  const record = verificationCodes.get(email);
  if (!record) return false;

  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(email);
    return false;
  }

  if (record.code === code) {
    verificationCodes.delete(email);
    return true;
  }

  return false;
};

export const sendOrderConfirmationEmail = async (
  email: string,
  orderDetails: {
    orderId: number | string;
    customerName: string;
    items: any[];
    subtotal: number;
    deliveryFee: number;
    discountAmount: number;
    total: number;
    address?: string;
    paymentMethod?: string;
    baseUrl?: string;
  }
) => {
  const itemsHtml = orderDetails.items.map(item => `
    <tr>
      <td style="padding: 20px 15px; border-bottom: 2px dashed #f4ece6; text-align: right;">
        <span class="item-name">${item.name || item.productName || 'منتج'}</span>
        ${item.cutting || item.packaging ? `<div class="item-options">${item.cutting ? '🔪 ' + item.cutting : ''} ${item.packaging ? ' | 🎁 ' + item.packaging : ''}</div>` : ''}
      </td>
      <td style="padding: 20px 15px; border-bottom: 2px dashed #f4ece6; text-align: center;">
        <span class="item-qty">${item.quantity}x</span>
      </td>
      <td style="padding: 20px 15px; border-bottom: 2px dashed #f4ece6; text-align: left;">
        <span class="item-price">${(Number(item.price) * Number(item.quantity)).toFixed(2)} د.أ</span>
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: '"محمصة بدر الدين" <badr.alden010@gmail.com>',
    to: email,
    subject: `✅ تأكيد طلبك #${orderDetails.orderId} - محمصة بدر الدين`,
    html: `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800;900&display=swap');
        
        body { margin: 0; padding: 0; background-color: #120804; font-family: 'Cairo', sans-serif; }
        .wrapper { 
          background: linear-gradient(to bottom, #2d1606 0%, #120804 100%);
          padding: 60px 15px; 
          min-height: 100%;
        }
        
        .receipt-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 40px; 
          box-shadow: 0 40px 100px rgba(0,0,0,0.8); 
          overflow: hidden; 
          position: relative;
        }
        
        /* Dynamic Header */
        .header { 
          background: linear-gradient(135deg, #1a0b05 0%, #3d1408 100%); 
          padding: 60px 30px; 
          text-align: center; 
          position: relative; 
          border-bottom: 5px solid #ea8640;
        }
        .header::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at center, rgba(234,134,64,0.15) 0%, transparent 70%);
          animation: pulse-glow 4s infinite alternate;
        }
        .logo-img { 
          width: 180px; 
          position: relative; 
          z-index: 2; 
          filter: drop-shadow(0 15px 25px rgba(0,0,0,0.5));
          animation: float 6s ease-in-out infinite;
        }
        
        /* Status Badge */
        .status-badge {
          background: linear-gradient(90deg, #ea8640, #c2410c);
          color: #fff;
          display: inline-block;
          padding: 10px 30px;
          border-radius: 30px;
          font-weight: 900;
          font-size: 18px;
          margin-top: 25px;
          box-shadow: 0 10px 20px rgba(234,134,64,0.3);
          position: relative;
          z-index: 2;
          letter-spacing: 1px;
        }

        /* Body */
        .body-content { padding: 50px 40px; background: #fffcf9; }
        .welcome { font-size: 24px; color: #3d1408; font-weight: 900; margin-bottom: 15px; }
        .message { color: #8a7b74; font-size: 16px; line-height: 1.8; margin-bottom: 40px; font-weight: 600; }
        
        /* Order Meta */
        .meta-grid { 
          display: table; width: 100%; margin-bottom: 40px;
        }
        .meta-col {
          display: table-cell; width: 50%;
          background: #f4ece6; padding: 20px; border-radius: 20px;
          border: 1px solid #eaddd3; text-align: center;
        }
        .meta-space { display: table-cell; width: 15px; }
        .meta-label { color: #ea8640; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .meta-val { color: #3d1408; font-size: 16px; font-weight: 800; }

        /* Items Table */
        .items-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px; }
        .items-table th { background: #3d1408; color: #fff; padding: 15px; font-size: 14px; font-weight: 800; text-align: right; }
        .items-table th:first-child { border-radius: 0 15px 15px 0; }
        .items-table th:last-child { border-radius: 15px 0 0 15px; text-align: left; }
        
        .items-table td { padding: 20px 15px; border-bottom: 2px dashed #f4ece6; }
        .item-name { color: #3d1408; font-size: 18px; font-weight: 800; display: block; margin-bottom: 5px; }
        .item-options { color: #ea8640; font-size: 13px; font-weight: 700; background: #fff5eb; padding: 4px 10px; border-radius: 10px; display: inline-block; }
        .item-qty { background: #f4ece6; color: #3d1408; font-weight: 900; padding: 5px 15px; border-radius: 12px; }
        .item-price { color: #3d1408; font-size: 18px; font-weight: 900; }

        /* Totals */
        .totals-box { 
          background: #ffffff; border: 2px solid #f4ece6; border-radius: 25px; padding: 30px;
          box-shadow: 0 15px 35px rgba(61,20,8,0.05); position: relative;
        }
        .totals-box::before {
          content: ''; position: absolute; left: 20px; right: 20px; top: -2px; height: 2px; background: #ea8640;
        }
        .tot-row { display: table; width: 100%; margin-bottom: 15px; }
        .tot-label { display: table-cell; text-align: right; color: #8a7b74; font-weight: 700; font-size: 16px; }
        .tot-val { display: table-cell; text-align: left; color: #3d1408; font-weight: 800; font-size: 16px; }
        
        .tot-row.discount .tot-label, .tot-row.discount .tot-val { color: #10b981; }
        
        .tot-row.final { margin-top: 20px; margin-bottom: 0; }
        .tot-row.final .tot-label { color: #3d1408; font-size: 22px; font-weight: 900; padding-top: 20px; border-top: 2px dashed #f4ece6; }
        .tot-row.final .tot-val { color: #ea8640; font-size: 28px; font-weight: 900; padding-top: 20px; border-top: 2px dashed #f4ece6; }

        /* Footer */
        .footer { background: #1a0b05; padding: 40px; text-align: center; }
        .footer-text { color: #8a7b74; font-size: 15px; line-height: 1.6; font-weight: 600; margin-bottom: 20px; }
        .btn-track { background: #ea8640; color: #ffffff !important; text-decoration: none; padding: 15px 40px; border-radius: 15px; font-weight: 800; font-size: 16px; display: inline-block; margin-bottom: 30px; box-shadow: 0 10px 20px rgba(234,134,64,0.3); }
        .copyright { color: #4a362f; font-size: 13px; font-weight: 700; }

        /* Animations */
        @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0); } }
        @keyframes pulse-glow { 0% { opacity: 0.1; transform: scale(1); } 100% { opacity: 0.3; transform: scale(1.1); } }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="receipt-container">
          <!-- Dynamic Header -->
          <div class="header">
            <img src="${fullLogoUrl}" alt="محمصة بدر الدين" class="logo-img">
            <br>
            <div class="status-badge">جاري تجهيز طلبك ☕</div>
          </div>

          <div class="body-content">
            <div class="welcome">أهلاً ${orderDetails.customerName || 'بك'}،</div>
            <p class="message">
              شغفنا بالقهوة والمكسرات يصلك قريباً! تم استلام طلبك بنجاح ونقوم الآن بتحضيره بأعلى معايير الجودة لتستمتع بمذاق لا يُنسى.
            </p>

            <!-- Metadata -->
            <div class="meta-grid">
              <div class="meta-col">
                <div class="meta-label">رقم الطلب</div>
                <div class="meta-val">#${orderDetails.orderId}</div>
              </div>
              <div class="meta-space"></div>
              <div class="meta-col">
                <div class="meta-label">طريقة الدفع</div>
                <div class="meta-val">${orderDetails.paymentMethod === 'card' ? '💳 دفع إلكتروني' : '💵 الدفع عند الاستلام'}</div>
              </div>
            </div>

            <!-- Items -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th style="text-align: center;">الكمية</th>
                  <th>السعر</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-box">
              <div class="tot-row">
                <div class="tot-label">المجموع الفرعي</div>
                <div class="tot-val">${Number(orderDetails.subtotal).toFixed(2)} د.أ</div>
              </div>
              
              ${Number(orderDetails.deliveryFee) > 0 ? `
              <div class="tot-row">
                <div class="tot-label">رسوم التوصيل</div>
                <div class="tot-val">${Number(orderDetails.deliveryFee).toFixed(2)} د.أ</div>
              </div>` : ''}
              
              ${Number(orderDetails.discountAmount) > 0 ? `
              <div class="tot-row discount">
                <div class="tot-label">الخصم (توفيرك)</div>
                <div class="tot-val">- ${Number(orderDetails.discountAmount).toFixed(2)} د.أ</div>
              </div>` : ''}
              
              <div class="tot-row final">
                <div class="tot-label">الإجمالي النهائي</div>
                <div class="tot-val">${Number(orderDetails.total).toFixed(2)} د.أ</div>
              </div>
            </div>
            
            ${orderDetails.address ? `
            <div style="margin-top: 30px; background: #fdf6f0; border-right: 4px solid #ea8640; padding: 15px 20px; border-radius: 15px;">
              <div style="color: #ea8640; font-size: 13px; font-weight: 900; margin-bottom: 5px;">📍 عنوان التوصيل المعتمد</div>
              <div style="color: #3d1408; font-weight: 700; font-size: 15px;">${orderDetails.address}</div>
            </div>` : ''}

          </div>

          <!-- Luxury Footer -->
          <div class="footer">
            <div class="footer-text">
              نحن هنا دائماً لخدمتك. إذا كان لديك أي استفسار،<br>لا تتردد في التواصل معنا.
            </div>
            <a href="${orderDetails.baseUrl || ''}/profile" class="btn-track">تتبع حالة طلبي</a>
            <div class="copyright">
              © ${new Date().getFullYear()} محمصة بدر الدين. كل حبة تروي قصة.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `
  };

  await transporter.sendMail(mailOptions);
};


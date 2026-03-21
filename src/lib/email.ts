import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = import.meta.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not configured');
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = 'IGET Vapes <info@igetvapeshub.com>';
const REPLY_TO = 'info@igetvapeshub.com';
const ADMIN_EMAIL = 'info@igetvapeshub.com';

// ─── Shared design tokens ───
const BRAND_BLACK = '#111111';
const BRAND_ACCENT = '#e94560';
const BRAND_BG = '#f7f7f7';
const BRAND_WHITE = '#ffffff';
const BRAND_BORDER = '#e5e5e5';
const BRAND_MUTED = '#888888';
const FONT = "'Montserrat', 'Helvetica Neue', Arial, sans-serif";

export interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
  orderNumber?: string;
}

export interface OrderEmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  payment: string;
  notes: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
}

// ─── Reusable layout shell ───
function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:${FONT};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Logo header -->
        <tr><td style="background:${BRAND_BLACK};padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:2px;color:${BRAND_WHITE};">IGET-VAPES</h1>
          <p style="margin:4px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${BRAND_MUTED};">Australia</p>
        </td></tr>
        <!-- Content -->
        <tr><td style="background:${BRAND_WHITE};padding:36px 32px;border-left:1px solid ${BRAND_BORDER};border-right:1px solid ${BRAND_BORDER};">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:${BRAND_WHITE};padding:24px 32px;border-top:1px solid ${BRAND_BORDER};border-radius:0 0 12px 12px;border-left:1px solid ${BRAND_BORDER};border-right:1px solid ${BRAND_BORDER};border-bottom:1px solid ${BRAND_BORDER};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${BRAND_BLACK};">Need help?</p>
              <p style="margin:0 0 4px;font-size:12px;color:${BRAND_MUTED};">Reply to this email or contact us at</p>
              <a href="mailto:info@igetvapeshub.com" style="color:${BRAND_ACCENT};font-size:13px;font-weight:600;text-decoration:none;">info@igetvapeshub.com</a>
              <p style="margin:16px 0 0;font-size:11px;color:#bbb;">&copy; ${new Date().getFullYear()} IGET Vapes Original &mdash; Australia's #1 Trusted Online Vape Store</p>
              <p style="margin:4px 0 0;font-size:11px;color:#bbb;">igetvapesoriginal.com</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Design helpers ───
function heading(text: string): string {
  return `<h2 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${BRAND_BLACK};line-height:1.3;">${text}</h2>`;
}

function subheading(text: string): string {
  return `<h3 style="margin:28px 0 12px;font-size:15px;font-weight:700;color:${BRAND_BLACK};text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${BRAND_BLACK};padding-bottom:8px;">${text}</h3>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333;">${text}</p>`;
}

function badge(text: string, color: string = BRAND_ACCENT): string {
  return `<span style="display:inline-block;background:${color};color:${BRAND_WHITE};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${text}</span>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 12px;font-size:13px;font-weight:600;color:${BRAND_MUTED};width:120px;vertical-align:top;">${label}</td>
    <td style="padding:10px 12px;font-size:14px;color:${BRAND_BLACK};vertical-align:top;">${value}</td>
  </tr>`;
}

function divider(): string {
  return `<hr style="border:0;border-top:1px solid ${BRAND_BORDER};margin:24px 0;">`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:${BRAND_BLACK};border-radius:8px;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:${BRAND_WHITE};text-decoration:none;letter-spacing:0.5px;">${text}</a>
    </td></tr>
  </table>`;
}

// ═══════════════════════════════════════════════════════
// CONTACT EMAILS
// ═══════════════════════════════════════════════════════

const subjectMap: Record<string, string> = {
  order: 'Order Inquiry',
  product: 'Product Question',
  flavours: 'Flavour Availability',
  shipping: 'Shipping & Delivery',
  returns: 'Returns & Refunds',
  other: 'General Inquiry',
};

export async function sendContactEmail(data: ContactEmailData) {
  const subjectLabel = subjectMap[data.subject] || data.subject;

  // ── Admin notification ──
  const adminHtml = emailShell(`
    ${heading('New Contact Message')}
    <div style="margin-bottom:20px;">${badge(subjectLabel)}</div>
    ${paragraph(`You have a new message from <strong>${escapeHtml(data.name)}</strong>.`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};border-radius:8px;margin-bottom:20px;">
      ${infoRow('From', escapeHtml(data.name))}
      ${infoRow('Email', `<a href="mailto:${escapeHtml(data.email)}" style="color:${BRAND_ACCENT};text-decoration:none;">${escapeHtml(data.email)}</a>`)}
      ${infoRow('Subject', escapeHtml(subjectLabel))}
      ${data.orderNumber ? infoRow('Order #', escapeHtml(data.orderNumber)) : ''}
    </table>
    ${subheading('Message')}
    <div style="background:${BRAND_BG};border-left:4px solid ${BRAND_ACCENT};padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:16px;">
      <p style="margin:0;font-size:14px;line-height:1.7;color:#333;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
    </div>
    ${ctaButton('Reply to Customer', `mailto:${escapeHtml(data.email)}`)}
  `);

  const adminResult = await getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    replyTo: data.email,
    subject: `New Contact: ${subjectLabel} — from ${data.name}`,
    html: adminHtml,
  });

  if (adminResult.error) {
    throw new Error(`Resend admin email failed: ${adminResult.error.message}`);
  }

  // ── Customer confirmation ──
  const customerHtml = emailShell(`
    ${heading(`Thanks for reaching out, ${escapeHtml(data.name)}!`)}
    ${paragraph(`We've received your message about <strong>${escapeHtml(subjectLabel)}</strong> and our team will get back to you within <strong>24 hours</strong>.`)}
    ${divider()}
    ${subheading('Your Message')}
    <div style="background:${BRAND_BG};border-radius:8px;padding:16px 20px;margin-bottom:16px;">
      <p style="margin:0;font-size:14px;line-height:1.7;color:#555;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
    </div>
    ${paragraph(`In the meantime, feel free to browse our latest products.`)}
    ${ctaButton('Browse Products', 'https://igetvapesoriginal.com')}
  `);

  const customerResult = await getResend().emails.send({
    from: FROM_EMAIL,
    to: data.email,
    replyTo: REPLY_TO,
    subject: `We received your message — IGET Vapes Australia`,
    html: customerHtml,
  });

  if (customerResult.error) {
    console.error('Customer confirmation email failed:', customerResult.error.message);
  }
}

// ═══════════════════════════════════════════════════════
// ORDER EMAILS
// ═══════════════════════════════════════════════════════

const paymentLabels: Record<string, string> = {
  'bank-transfer': 'Bank Transfer (EFT)',
  'payid': 'PayID',
  'bitcoin': 'Bitcoin (BTC)',
};

function getPaymentInstructions(method: string): string {
  switch (method) {
    case 'bank-transfer':
      return `We will send you our <strong>Australian bank account details</strong> shortly. Please complete the EFT transfer and reply to this email with your payment receipt.`;
    case 'payid':
      return `We will send you our <strong>PayID details</strong> shortly. Simply transfer the exact amount via your banking app using PayID and reply with confirmation.`;
    case 'bitcoin':
      return `We will send you a <strong>Bitcoin (BTC) wallet address</strong> and the exact amount shortly. Please complete the transfer and reply with the transaction hash.`;
    default:
      return `We will send you payment details shortly. Please follow the instructions and reply with your payment confirmation.`;
  }
}

function buildOrderTable(data: OrderEmailData): string {
  const rows = data.items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? BRAND_WHITE : BRAND_BG};">
      <td style="padding:12px 14px;font-size:14px;color:${BRAND_BLACK};border-bottom:1px solid ${BRAND_BORDER};">${escapeHtml(item.name)}</td>
      <td style="padding:12px 14px;font-size:14px;color:${BRAND_BLACK};text-align:center;border-bottom:1px solid ${BRAND_BORDER};">${item.quantity}</td>
      <td style="padding:12px 14px;font-size:14px;color:${BRAND_BLACK};text-align:right;border-bottom:1px solid ${BRAND_BORDER};">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND_BORDER};border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:${BRAND_BLACK};">
          <th style="padding:12px 14px;text-align:left;font-size:12px;font-weight:700;color:${BRAND_WHITE};text-transform:uppercase;letter-spacing:1px;">Product</th>
          <th style="padding:12px 14px;text-align:center;font-size:12px;font-weight:700;color:${BRAND_WHITE};text-transform:uppercase;letter-spacing:1px;">Qty</th>
          <th style="padding:12px 14px;text-align:right;font-size:12px;font-weight:700;color:${BRAND_WHITE};text-transform:uppercase;letter-spacing:1px;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:10px 14px;text-align:right;font-size:13px;color:${BRAND_MUTED};">Subtotal</td>
          <td style="padding:10px 14px;text-align:right;font-size:14px;color:${BRAND_BLACK};">$${data.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px 14px;text-align:right;font-size:13px;color:${BRAND_MUTED};">Shipping</td>
          <td style="padding:10px 14px;text-align:right;font-size:14px;color:${BRAND_BLACK};">$${data.shipping.toFixed(2)}</td>
        </tr>
        <tr style="background:${BRAND_BG};">
          <td colspan="2" style="padding:14px;text-align:right;font-size:16px;font-weight:800;color:${BRAND_BLACK};border-top:2px solid ${BRAND_BLACK};">TOTAL</td>
          <td style="padding:14px;text-align:right;font-size:18px;font-weight:800;color:${BRAND_ACCENT};border-top:2px solid ${BRAND_BLACK};">$${data.total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>`;
}

function buildShippingCard(data: OrderEmailData): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};border-radius:8px;margin-bottom:16px;">
      ${infoRow('Name', `${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`)}
      ${infoRow('Address', escapeHtml(data.address))}
      ${infoRow('City', `${escapeHtml(data.city)}, ${escapeHtml(data.state)} ${escapeHtml(data.postcode)}`)}
      ${infoRow('Phone', escapeHtml(data.phone))}
      ${infoRow('Email', `<a href="mailto:${escapeHtml(data.email)}" style="color:${BRAND_ACCENT};text-decoration:none;">${escapeHtml(data.email)}</a>`)}
    </table>`;
}

export async function sendOrderEmails(data: OrderEmailData) {
  const orderRef = `IG-${Date.now().toString(36).toUpperCase()}`;
  const paymentMethod = paymentLabels[data.payment] || data.payment;

  // ── Customer order confirmation ──
  const customerHtml = emailShell(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:64px;height:64px;background:#e8f5e9;border-radius:50%;line-height:64px;text-align:center;margin-bottom:12px;">
        <span style="font-size:28px;">&#10003;</span>
      </div>
      ${heading('Order Confirmed!')}
      ${paragraph(`Thank you for your order, <strong>${escapeHtml(data.firstName)}</strong>. We're getting it ready for you.`)}
    </div>

    <!-- Order ref badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};border-radius:8px;margin-bottom:28px;">
      <tr><td style="padding:16px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_MUTED};font-weight:600;">Order Reference</p>
        <p style="margin:0;font-size:22px;font-weight:800;color:${BRAND_BLACK};letter-spacing:1px;">${orderRef}</p>
      </td></tr>
    </table>

    ${subheading('Items Ordered')}
    ${buildOrderTable(data)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:12px;">
          ${subheading('Shipping To')}
          ${buildShippingCard(data)}
        </td>
        <td style="width:50%;vertical-align:top;padding-left:12px;">
          ${subheading('Payment')}
          <div style="background:${BRAND_BG};border-radius:8px;padding:16px 20px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:${BRAND_BLACK};">${escapeHtml(paymentMethod)}</p>
          </div>
          ${data.notes ? `
          ${subheading('Order Notes')}
          <div style="background:${BRAND_BG};border-radius:8px;padding:16px 20px;">
            <p style="margin:0;font-size:13px;color:#555;">${escapeHtml(data.notes)}</p>
          </div>` : ''}
        </td>
      </tr>
    </table>

    ${divider()}

    <!-- Payment instructions -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin:20px 0;">
      <tr><td style="padding:24px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;padding-right:12px;">
              <span style="font-size:24px;">&#9993;</span>
            </td>
            <td>
              <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1e3a5f;">Payment Instructions</p>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#1e40af;">${getPaymentInstructions(data.payment)}</p>
              <p style="margin:0;font-size:13px;color:#3b82f6;">Your order will be processed once payment is confirmed.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- What's next -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, ${BRAND_BLACK} 0%, #222 100%);border-radius:10px;margin:20px 0;">
      <tr><td style="padding:24px 28px;">
        <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${BRAND_WHITE};">What happens next?</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.8);"><span style="color:${BRAND_ACCENT};font-weight:700;margin-right:8px;">1.</span> Check this email for payment instructions above</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.8);"><span style="color:${BRAND_ACCENT};font-weight:700;margin-right:8px;">2.</span> Complete payment via ${escapeHtml(paymentMethod)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.8);"><span style="color:${BRAND_ACCENT};font-weight:700;margin-right:8px;">3.</span> We confirm payment &amp; pack your order</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.8);"><span style="color:${BRAND_ACCENT};font-weight:700;margin-right:8px;">4.</span> Tracking details sent to your email</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.8);"><span style="color:${BRAND_ACCENT};font-weight:700;margin-right:8px;">5.</span> Delivered in 2&ndash;5 business days Australia-wide</td>
          </tr>
        </table>
      </td></tr>
    </table>
  `);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: data.email,
    replyTo: REPLY_TO,
    subject: `Order Confirmed — ${orderRef} — IGET Vapes Australia`,
    html: customerHtml,
  });

  // ── Admin order notification ──
  const adminHtml = emailShell(`
    <div style="margin-bottom:20px;">${badge('NEW ORDER', '#28a745')}</div>
    ${heading(`Order ${orderRef}`)}
    ${paragraph(`<strong>$${data.total.toFixed(2)} AUD</strong> via <strong>${escapeHtml(paymentMethod)}</strong> from <strong>${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</strong>`)}

    ${subheading('Items')}
    ${buildOrderTable(data)}

    ${subheading('Customer & Shipping')}
    ${buildShippingCard(data)}

    ${data.notes ? `${subheading('Order Notes')}<div style="background:${BRAND_BG};border-left:4px solid ${BRAND_ACCENT};padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:16px;"><p style="margin:0;font-size:13px;color:#333;">${escapeHtml(data.notes)}</p></div>` : ''}

    ${ctaButton(`Reply to ${escapeHtml(data.firstName)}`, `mailto:${escapeHtml(data.email)}`)}
  `);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    replyTo: data.email,
    subject: `New Order ${orderRef} — $${data.total.toFixed(2)} — ${data.firstName} ${data.lastName}`,
    html: adminHtml,
  });

  return orderRef;
}

// ─── Security: HTML escape ───
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

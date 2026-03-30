import { Resend } from 'resend';

const DEFAULT_STORE_NAME = 'IGET Vapes Hub';
const DEFAULT_SUPPORT_EMAIL = 'info@igetvapeshub.com';
const DEFAULT_SITE_URL = 'https://igetvapeshub.com';

const COLORS = {
  background: '#f4eee6',
  surface: '#fffaf4',
  card: '#ffffff',
  ink: '#111c24',
  muted: '#5f6a72',
  border: '#ddd2c4',
  accent: '#0f7c72',
  accentDark: '#0a5d55',
  accentSoft: '#e3f3f0',
  highlight: '#f1a45b',
  success: '#257a56',
  successSoft: '#e6f4eb',
  warning: '#8d632e',
  warningSoft: '#fff2df',
  panel: '#10171d',
};

const FONT_STACK = "'Manrope', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  replyTo: string;
  adminEmail: string;
  supportEmail: string;
  siteUrl: string;
  storeName: string;
  storeDomain: string;
}

interface EmailSettings {
  fromEmail: string;
  replyTo: string;
  adminEmail: string;
  supportEmail: string;
  siteUrl: string;
  storeName: string;
  storeDomain: string;
}

let resendClient: Resend | null = null;
let emailConfig: EmailConfig | null = null;
let emailSettings: EmailSettings | null = null;

export interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
  orderNumber?: string;
}

export interface OrderLineItem {
  name: string;
  quantity: number;
  price: number;
  categorySlug?: string;
  flavourSlug?: string;
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
  items: OrderLineItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

function getEnvValue(name: string): string | undefined {
  const value = import.meta.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeSiteUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function getEmailSettings(): EmailSettings {
  if (!emailSettings) {
    const supportEmail = getEnvValue('SUPPORT_EMAIL')
      ?? getEnvValue('RESEND_ADMIN_EMAIL')
      ?? DEFAULT_SUPPORT_EMAIL;

    const siteUrl = normalizeSiteUrl(
      getEnvValue('SITE_URL')
        ?? getEnvValue('PUBLIC_SITE_URL')
        ?? DEFAULT_SITE_URL,
    );

    const storeName = getEnvValue('STORE_NAME') ?? DEFAULT_STORE_NAME;

    emailSettings = {
      fromEmail: getEnvValue('RESEND_FROM_EMAIL') ?? `${storeName} <${supportEmail}>`,
      replyTo: getEnvValue('RESEND_REPLY_TO') ?? supportEmail,
      adminEmail: getEnvValue('RESEND_ADMIN_EMAIL') ?? supportEmail,
      supportEmail,
      siteUrl,
      storeName,
      storeDomain: new URL(siteUrl).hostname,
    };
  }

  return emailSettings;
}

export function isEmailConfigured(): boolean {
  return Boolean(getEnvValue('RESEND_API_KEY'));
}

function getEmailConfig(): EmailConfig {
  if (!emailConfig) {
    const apiKey = getEnvValue('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    emailConfig = {
      apiKey,
      ...getEmailSettings(),
    };
  }

  return emailConfig;
}

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(getEmailConfig().apiKey);
  }

  return resendClient;
}

export function getSupportEmailAddress(): string {
  return getEmailSettings().supportEmail;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMultilineText(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

function joinAddress(parts: string[]): string {
  return parts.filter(Boolean).join(', ');
}

function buildButton(label: string, href: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const isPrimary = variant === 'primary';
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 22px;border-radius:999px;font-family:${FONT_STACK};font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;text-decoration:none;${isPrimary ? `background:${COLORS.accent};color:#ffffff;` : `background:${COLORS.surface};color:${COLORS.ink};border:1px solid ${COLORS.border};`} ">${escapeHtml(label)}</a>`;
}

function buildSection(title: string, body: string, intro?: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:22px;overflow:hidden;">
      <tr>
        <td style="padding:22px 24px;">
          <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.accent};">${escapeHtml(title)}</p>
          ${intro ? `<p style="margin:0 0 16px;font-family:${FONT_STACK};font-size:14px;line-height:1.7;color:${COLORS.muted};">${escapeHtml(intro)}</p>` : ''}
          ${body}
        </td>
      </tr>
    </table>`;
}

function buildDetailsTable(rows: Array<[string, string]>): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows.map(([label, value], index) => `
        <tr>
          <td style="padding:${index === 0 ? '0' : '14px'} 0 14px 0;border-bottom:1px solid ${COLORS.border};width:34%;vertical-align:top;font-family:${FONT_STACK};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(label)}</td>
          <td style="padding:${index === 0 ? '0' : '14px'} 0 14px 16px;border-bottom:1px solid ${COLORS.border};vertical-align:top;font-family:${FONT_STACK};font-size:14px;line-height:1.7;color:${COLORS.ink};">${value}</td>
        </tr>`).join('')}
    </table>`;
}

function buildMetricRow(metrics: Array<{ label: string; value: string }>): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:separate;border-spacing:0;">
      <tr>
        ${metrics.map((metric) => `
          <td style="width:${100 / metrics.length}%;padding:0 6px 0 0;vertical-align:top;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.accentSoft};border:1px solid rgba(15,124,114,0.14);border-radius:18px;overflow:hidden;">
              <tr>
                <td style="padding:18px 16px;">
                  <p style="margin:0 0 8px;font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.accentDark};">${escapeHtml(metric.label)}</p>
                  <p style="margin:0;font-family:${FONT_STACK};font-size:18px;font-weight:800;line-height:1.35;color:${COLORS.ink};">${metric.value}</p>
                </td>
              </tr>
            </table>
          </td>`).join('')}
      </tr>
    </table>`;
}

function buildCallout(title: string, copy: string, tone: 'accent' | 'warning' | 'success' = 'accent'): string {
  const tones = {
    accent: { background: COLORS.accentSoft, border: 'rgba(15,124,114,0.14)', title: COLORS.accentDark, copy: COLORS.ink },
    warning: { background: COLORS.warningSoft, border: 'rgba(141,99,46,0.18)', title: COLORS.warning, copy: COLORS.ink },
    success: { background: COLORS.successSoft, border: 'rgba(37,122,86,0.18)', title: COLORS.success, copy: COLORS.ink },
  };
  const theme = tones[tone];

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:${theme.background};border:1px solid ${theme.border};border-radius:22px;overflow:hidden;">
      <tr>
        <td style="padding:20px 22px;">
          <p style="margin:0 0 8px;font-family:${FONT_STACK};font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${theme.title};">${escapeHtml(title)}</p>
          <p style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.75;color:${theme.copy};">${copy}</p>
        </td>
      </tr>
    </table>`;
}

function buildItemTable(items: OrderLineItem[], subtotal: number, shipping: number, total: number): string {
  const rows = items.map((item, index) => {
    const lineTotal = item.quantity * item.price;
    return `
      <tr style="background:${index % 2 === 0 ? COLORS.card : COLORS.surface};">
        <td style="padding:14px 16px;border-bottom:1px solid ${COLORS.border};font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${COLORS.ink};">${escapeHtml(item.name)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid ${COLORS.border};text-align:center;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${COLORS.ink};">${item.quantity}</td>
        <td style="padding:14px 16px;border-bottom:1px solid ${COLORS.border};text-align:right;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${COLORS.ink};">${formatCurrency(lineTotal)}</td>
      </tr>`;
  }).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:18px;overflow:hidden;border-collapse:separate;border-spacing:0;">
      <tr style="background:${COLORS.panel};">
        <th style="padding:14px 16px;text-align:left;font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;">Item</th>
        <th style="padding:14px 16px;text-align:center;font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;">Qty</th>
        <th style="padding:14px 16px;text-align:right;font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;">Line Total</th>
      </tr>
      ${rows}
      <tr>
        <td colspan="2" style="padding:14px 16px 8px;text-align:right;font-family:${FONT_STACK};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.muted};">Subtotal</td>
        <td style="padding:14px 16px 8px;text-align:right;font-family:${FONT_STACK};font-size:14px;color:${COLORS.ink};">${formatCurrency(subtotal)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:8px 16px;text-align:right;font-family:${FONT_STACK};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.muted};">Shipping</td>
        <td style="padding:8px 16px;text-align:right;font-family:${FONT_STACK};font-size:14px;color:${COLORS.ink};">${formatCurrency(shipping)}</td>
      </tr>
      <tr style="background:${COLORS.surface};">
        <td colspan="2" style="padding:16px;text-align:right;border-top:1px solid ${COLORS.border};font-family:${FONT_STACK};font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.ink};">Total Due</td>
        <td style="padding:16px;text-align:right;border-top:1px solid ${COLORS.border};font-family:${FONT_STACK};font-size:18px;font-weight:800;color:${COLORS.accentDark};">${formatCurrency(total)}</td>
      </tr>
    </table>`;
}

function buildChecklist(items: string[]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${items.map((item) => `
        <tr>
          <td style="padding:0 0 10px;vertical-align:top;width:18px;font-family:${FONT_STACK};font-size:15px;line-height:1.7;color:${COLORS.accent};">&#10003;</td>
          <td style="padding:0 0 10px 10px;vertical-align:top;font-family:${FONT_STACK};font-size:14px;line-height:1.7;color:${COLORS.ink};">${item}</td>
        </tr>`).join('')}
    </table>`;
}

function renderShell(options: {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  content: string;
}): string {
  const config = getEmailSettings();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(options.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.background};font-family:${FONT_STACK};-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(options.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.background};">
      <tr>
        <td align="center" style="padding:24px 12px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;">
            <tr>
              <td style="padding:0 8px 12px;">
                <p style="margin:0;font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(config.storeDomain)}</p>
              </td>
            </tr>
            <tr>
              <td style="background:${COLORS.panel};background-image:linear-gradient(135deg, ${COLORS.panel} 0%, #15231f 58%, ${COLORS.accent} 100%);padding:34px 34px 28px;border-radius:28px 28px 0 0;">
                <p style="margin:0 0 12px;font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.72);">${escapeHtml(options.eyebrow)}</p>
                <h1 style="margin:0 0 12px;font-family:${FONT_STACK};font-size:30px;line-height:1.12;font-weight:800;color:#ffffff;letter-spacing:-0.03em;">${escapeHtml(options.title)}</h1>
                <p style="margin:0;font-family:${FONT_STACK};font-size:15px;line-height:1.75;color:rgba(255,255,255,0.78);">${escapeHtml(options.intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="background:${COLORS.surface};border:1px solid ${COLORS.border};border-top:none;border-radius:0 0 28px 28px;padding:30px 24px 24px;">
                ${options.content}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:22px;overflow:hidden;">
                  <tr>
                    <td style="padding:22px 24px;">
                      <p style="margin:0 0 8px;font-family:${FONT_STACK};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.muted};">Support</p>
                      <p style="margin:0 0 12px;font-family:${FONT_STACK};font-size:14px;line-height:1.75;color:${COLORS.ink};">Reply to this email or contact our team directly if you need help with delivery, payment confirmation, or product guidance.</p>
                      <p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:15px;font-weight:800;color:${COLORS.ink};"><a href="mailto:${escapeHtml(config.supportEmail)}" style="color:${COLORS.accentDark};text-decoration:none;">${escapeHtml(config.supportEmail)}</a></p>
                      <div>
                        ${buildButton('Visit Store', config.siteUrl, 'primary')}
                        <span style="display:inline-block;width:8px;"></span>
                        ${buildButton('Contact Support', `${config.siteUrl}/contact`, 'secondary')}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 10px 0;">
                <p style="margin:0 0 4px;font-family:${FONT_STACK};font-size:12px;line-height:1.7;color:${COLORS.muted};text-align:center;">${escapeHtml(config.storeName)} | Adult retail support across Australia</p>
                <p style="margin:0;font-family:${FONT_STACK};font-size:11px;line-height:1.7;color:${COLORS.muted};text-align:center;">${escapeHtml(config.storeDomain)} | ${escapeHtml(config.supportEmail)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendEmail(params: {
  to: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const config = getEmailConfig();
  const result = await getResend().emails.send({
    from: config.fromEmail,
    to: params.to,
    replyTo: params.replyTo ?? config.replyTo,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
}

const subjectMap: Record<string, string> = {
  order: 'Order inquiry',
  product: 'Product question',
  flavours: 'Flavour availability',
  shipping: 'Shipping and delivery',
  returns: 'Returns or refunds',
  other: 'General inquiry',
};

const paymentLabels: Record<string, string> = {
  'bank-transfer': 'Bank transfer (EFT)',
  payid: 'PayID',
  bitcoin: 'Bitcoin (BTC)',
};

function getPaymentFollowUpCopy(method: string): string {
  switch (method) {
    case 'bank-transfer':
      return 'Our team will reply with Australian bank transfer details and the exact amount to pay. Please use your order reference when you make the transfer.';
    case 'payid':
      return 'Our team will reply with PayID instructions and the exact amount to transfer. Use the order reference in your payment description where possible.';
    case 'bitcoin':
      return 'Our team will reply with the wallet address and the exact BTC amount required for this order. Reply with the transaction hash after payment.';
    default:
      return 'Our team will reply with the next payment steps for your selected payment method.';
  }
}

function buildOrderReference(): string {
  const now = new Date();
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `IG-${date}-${suffix}`;
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const config = getEmailSettings();
  const subjectLabel = subjectMap[data.subject] ?? data.subject;
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeSubject = escapeHtml(subjectLabel);
  const safeOrderNumber = data.orderNumber ? escapeHtml(data.orderNumber) : 'Not provided';
  const safeMessage = formatMultilineText(data.message);

  const adminHtml = renderShell({
    preheader: `New contact message from ${data.name}`,
    eyebrow: 'New support message',
    title: 'A customer sent a new enquiry.',
    intro: 'The message has been routed from the contact form and is ready for follow-up.',
    content: [
      buildMetricRow([
        { label: 'Subject', value: safeSubject },
        { label: 'Customer', value: safeName },
        { label: 'Reply to', value: `<a href="mailto:${safeEmail}" style="color:${COLORS.accentDark};text-decoration:none;">${safeEmail}</a>` },
      ]),
      buildSection('Contact details', buildDetailsTable([
        ['Name', safeName],
        ['Email', `<a href="mailto:${safeEmail}" style="color:${COLORS.accentDark};text-decoration:none;">${safeEmail}</a>`],
        ['Subject', safeSubject],
        ['Order reference', safeOrderNumber],
      ])),
      buildSection('Message', `<p style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.8;color:${COLORS.ink};">${safeMessage}</p>`),
      `<div style="margin-top:8px;">${buildButton('Reply to customer', `mailto:${data.email}`, 'primary')}</div>`,
    ].join(''),
  });

  const adminText = [
    'New contact message',
    `Subject: ${subjectLabel}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Order reference: ${data.orderNumber || 'Not provided'}`,
    '',
    'Message:',
    data.message,
  ].join('\n');

  await sendEmail({
    to: config.adminEmail,
    replyTo: data.email,
    subject: `New Contact: ${subjectLabel} | ${data.name}`,
    html: adminHtml,
    text: adminText,
  });

  const customerHtml = renderShell({
    preheader: 'We received your message and our team will reply shortly.',
    eyebrow: 'Contact confirmation',
    title: `Thanks, ${data.name.split(' ')[0] || data.name}. We have your message.`,
    intro: 'Your enquiry is now with the support team. We aim to reply with a useful answer rather than a generic acknowledgement.',
    content: [
      buildMetricRow([
        { label: 'Topic', value: safeSubject },
        { label: 'Order reference', value: safeOrderNumber },
        { label: 'Reply window', value: 'Usually within 1 business day' },
      ]),
      buildCallout('What happens next', 'A team member will review your message, check any relevant order details, and reply from our support inbox. If your question is urgent, reply directly to this confirmation email.', 'accent'),
      buildSection('Your message', `<p style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.8;color:${COLORS.ink};">${safeMessage}</p>`),
      buildSection('Helpful links', buildChecklist([
        `Delivery information: <a href="${config.siteUrl}/delivery" style="color:${COLORS.accentDark};text-decoration:none;">${config.siteUrl}/delivery</a>`,
        `Shipping policy: <a href="${config.siteUrl}/shipping-policy" style="color:${COLORS.accentDark};text-decoration:none;">${config.siteUrl}/shipping-policy</a>`,
        `Contact page: <a href="${config.siteUrl}/contact" style="color:${COLORS.accentDark};text-decoration:none;">${config.siteUrl}/contact</a>`,
      ]), 'While you wait') ,
    ].join(''),
  });

  const customerText = [
    `Thanks, ${data.name}.`,
    `We received your message about: ${subjectLabel}`,
    `Order reference: ${data.orderNumber || 'Not provided'}`,
    '',
    'Your message:',
    data.message,
    '',
    `Reply to this email or contact ${config.supportEmail} if you need anything else.`,
  ].join('\n');

  try {
    await sendEmail({
      to: data.email,
      subject: 'We received your message | IGET Vapes Hub',
      html: customerHtml,
      text: customerText,
    });
  } catch (error) {
    console.error('Customer contact confirmation failed:', error);
  }
}

export async function sendOrderEmails(data: OrderEmailData): Promise<string> {
  const config = getEmailSettings();
  const orderRef = buildOrderReference();
  const paymentMethod = paymentLabels[data.payment] ?? data.payment;
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const deliveryAddress = joinAddress([data.address, `${data.city}, ${data.state} ${data.postcode}`]);

  const adminHtml = renderShell({
    preheader: `New order ${orderRef} from ${fullName}`,
    eyebrow: 'New order received',
    title: `Order ${orderRef} is ready for review.`,
    intro: 'The checkout was submitted successfully and the team should now send payment instructions to the customer.',
    content: [
      buildMetricRow([
        { label: 'Order total', value: formatCurrency(data.total) },
        { label: 'Payment', value: escapeHtml(paymentMethod) },
        { label: 'Customer', value: escapeHtml(fullName) },
      ]),
      buildSection('Order items', buildItemTable(data.items, data.subtotal, data.shipping, data.total)),
      buildSection('Customer and delivery', buildDetailsTable([
        ['Customer', escapeHtml(fullName)],
        ['Email', `<a href="mailto:${escapeHtml(data.email)}" style="color:${COLORS.accentDark};text-decoration:none;">${escapeHtml(data.email)}</a>`],
        ['Phone', escapeHtml(data.phone)],
        ['Address', escapeHtml(deliveryAddress)],
        ['Payment method', escapeHtml(paymentMethod)],
      ])),
      data.notes
        ? buildSection('Order notes', `<p style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.8;color:${COLORS.ink};">${formatMultilineText(data.notes)}</p>`)
        : '',
      buildCallout('Next action', `Send ${escapeHtml(fullName)} the ${escapeHtml(paymentMethod)} instructions and confirm payment against reference <strong>${escapeHtml(orderRef)}</strong>.`, 'success'),
      `<div style="margin-top:8px;">${buildButton('Reply to customer', `mailto:${data.email}`, 'primary')}</div>`,
    ].join(''),
  });

  const adminText = [
    `New order ${orderRef}`,
    `Customer: ${fullName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Payment: ${paymentMethod}`,
    `Subtotal: ${formatCurrency(data.subtotal)}`,
    `Shipping: ${formatCurrency(data.shipping)}`,
    `Total: ${formatCurrency(data.total)}`,
    `Address: ${deliveryAddress}`,
    '',
    'Items:',
    ...data.items.map((item) => `- ${item.name} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}`),
    ...(data.notes ? ['', 'Notes:', data.notes] : []),
  ].join('\n');

  await sendEmail({
    to: config.adminEmail,
    replyTo: data.email,
    subject: `New Order ${orderRef} | ${formatCurrency(data.total)} | ${fullName}`,
    html: adminHtml,
    text: adminText,
  });

  const customerHtml = renderShell({
    preheader: `Order ${orderRef} has been received and is awaiting manual payment follow-up.`,
    eyebrow: 'Order confirmation',
    title: `Your order ${orderRef} has been received.`,
    intro: 'We have your checkout details and the order is now queued for manual payment follow-up from the team.',
    content: [
      buildMetricRow([
        { label: 'Reference', value: escapeHtml(orderRef) },
        { label: 'Total due', value: formatCurrency(data.total) },
        { label: 'Payment', value: escapeHtml(paymentMethod) },
      ]),
      buildCallout('Payment follow-up', escapeHtml(getPaymentFollowUpCopy(data.payment)), 'warning'),
      buildSection('Items in your order', buildItemTable(data.items, data.subtotal, data.shipping, data.total)),
      buildSection('Delivery details', buildDetailsTable([
        ['Name', escapeHtml(fullName)],
        ['Address', escapeHtml(deliveryAddress)],
        ['Email', `<a href="mailto:${escapeHtml(data.email)}" style="color:${COLORS.accentDark};text-decoration:none;">${escapeHtml(data.email)}</a>`],
        ['Phone', escapeHtml(data.phone)],
      ])),
      data.notes
        ? buildSection('Your notes', `<p style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.8;color:${COLORS.ink};">${formatMultilineText(data.notes)}</p>`)
        : '',
      buildSection('What happens next', buildChecklist([
        `Our team reviews the order and sends the ${escapeHtml(paymentMethod)} instructions.`,
        `You complete payment and reply with confirmation if requested.`,
        'We verify payment, pack the order, and send dispatch or tracking updates.',
      ])),
    ].join(''),
  });

  const customerText = [
    `Your order ${orderRef} has been received.`,
    `Total due: ${formatCurrency(data.total)}`,
    `Payment method: ${paymentMethod}`,
    '',
    getPaymentFollowUpCopy(data.payment),
    '',
    'Items:',
    ...data.items.map((item) => `- ${item.name} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}`),
    '',
    `Delivery address: ${deliveryAddress}`,
    ...(data.notes ? ['', `Notes: ${data.notes}`] : []),
    '',
    `Reply to this email or contact ${config.supportEmail} if you need help.`,
  ].join('\n');

  try {
    await sendEmail({
      to: data.email,
      subject: `Order Received ${orderRef} | IGET Vapes Hub`,
      html: customerHtml,
      text: customerText,
    });
  } catch (error) {
    console.error(`Customer order confirmation failed for ${orderRef}:`, error);
  }

  return orderRef;
}
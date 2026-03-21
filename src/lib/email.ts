import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const FROM_EMAIL = 'IGET Vapes <orders@igetvapesoriginal.com>';
const ADMIN_EMAIL = 'info@igetvapeshub.com';

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
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
}

/** Send contact form notification to admin + confirmation to customer */
export async function sendContactEmail(data: ContactEmailData) {
  const subjectMap: Record<string, string> = {
    order: 'Order Inquiry',
    product: 'Product Question',
    flavours: 'Flavour Availability',
    shipping: 'Shipping & Delivery',
    returns: 'Returns & Refunds',
    other: 'General Inquiry',
  };

  const subjectLabel = subjectMap[data.subject] || data.subject;

  // Email to admin
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    replyTo: data.email,
    subject: `New Contact: ${subjectLabel} — from ${data.name}`,
    html: `
      <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Subject</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(subjectLabel)}</td></tr>
          ${data.orderNumber ? `<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Order #</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.orderNumber)}</td></tr>` : ''}
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Message</td><td style="padding: 8px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${escapeHtml(data.message)}</td></tr>
        </table>
      </div>
    `,
  });

  // Confirmation email to customer
  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: `We received your message — IGET Vapes Australia`,
    html: `
      <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111;">Thanks for reaching out, ${escapeHtml(data.name)}!</h2>
        <p>We've received your message regarding <strong>${escapeHtml(subjectLabel)}</strong> and will get back to you within 24 hours.</p>
        <p style="color: #666; font-size: 14px;">If your matter is urgent, you can reach us directly at <a href="mailto:info@igetvapeshub.com">info@igetvapeshub.com</a>.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">IGET Vapes Original — Australia's #1 Trusted Online Vape Store</p>
      </div>
    `,
  });
}

/** Send order confirmation to customer + notification to admin */
export async function sendOrderEmails(data: OrderEmailData) {
  const orderRef = `IG-${Date.now().toString(36).toUpperCase()}`;

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const paymentLabel: Record<string, string> = {
    'bank-transfer': 'Bank Transfer (EFT)',
    'crypto': 'Cryptocurrency',
    'payid': 'PayID',
  };

  const sharedOrderHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background: #f9f9f9;">
          <th style="padding: 8px; text-align: left; border-bottom: 2px solid #eee;">Product</th>
          <th style="padding: 8px; text-align: center; border-bottom: 2px solid #eee;">Qty</th>
          <th style="padding: 8px; text-align: right; border-bottom: 2px solid #eee;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr><td colspan="2" style="padding: 8px; text-align: right;">Subtotal</td><td style="padding: 8px; text-align: right;">$${data.subtotal.toFixed(2)}</td></tr>
        <tr><td colspan="2" style="padding: 8px; text-align: right;">Shipping</td><td style="padding: 8px; text-align: right;">$${data.shipping.toFixed(2)}</td></tr>
        <tr style="font-weight: bold; font-size: 16px;"><td colspan="2" style="padding: 8px; text-align: right; border-top: 2px solid #111;">Total</td><td style="padding: 8px; text-align: right; border-top: 2px solid #111;">$${data.total.toFixed(2)}</td></tr>
      </tfoot>
    </table>
  `;

  const shippingHtml = `
    <p><strong>${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</strong><br>
    ${escapeHtml(data.address)}<br>
    ${escapeHtml(data.city)}, ${escapeHtml(data.state)} ${escapeHtml(data.postcode)}<br>
    Phone: ${escapeHtml(data.phone)}<br>
    Email: ${escapeHtml(data.email)}</p>
  `;

  // Order confirmation to customer
  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: `Order Confirmed — ${orderRef} — IGET Vapes Australia`,
    html: `
      <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111;">Order Confirmation</h2>
        <p>Thanks for your order, <strong>${escapeHtml(data.firstName)}</strong>! Your reference number is <strong>${orderRef}</strong>.</p>
        
        <h3 style="margin-top: 24px;">Order Summary</h3>
        ${sharedOrderHtml}
        
        <h3>Payment Method</h3>
        <p>${escapeHtml(paymentLabel[data.payment] || data.payment)}</p>
        
        <h3>Shipping Address</h3>
        ${shippingHtml}
        
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; font-size: 14px;"><strong>What happens next?</strong></p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">We'll process your order and send tracking details once dispatched. Delivery typically takes 2–5 business days Australia-wide.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">IGET Vapes Original — Australia's #1 Trusted Online Vape Store<br>
        Questions? Contact us at <a href="mailto:info@igetvapeshub.com">info@igetvapeshub.com</a></p>
      </div>
    `,
  });

  // Order notification to admin
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🛒 New Order ${orderRef} — $${data.total.toFixed(2)} — ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`,
    html: `
      <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111;">New Order Received</h2>
        <p><strong>Order Ref:</strong> ${orderRef}<br>
        <strong>Payment:</strong> ${escapeHtml(paymentLabel[data.payment] || data.payment)}</p>
        
        <h3>Items Ordered</h3>
        ${sharedOrderHtml}
        
        <h3>Customer &amp; Shipping</h3>
        ${shippingHtml}
      </div>
    `,
  });

  return orderRef;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

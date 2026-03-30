export const prerender = false;

import type { APIRoute } from 'astro';
import { sendContactEmail, getSupportEmailAddress, isEmailConfigured } from '@lib/email';

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let name = '';
    let email = '';
    let subject = '';
    let message = '';
    let orderNumber = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      name = normalizeString(body.name);
      email = normalizeString(body.email).toLowerCase();
      subject = normalizeString(body.subject);
      message = normalizeString(body.message);
      orderNumber = normalizeString(body.orderNumber);
    } else {
      const formData = await request.formData();
      name = normalizeString(formData.get('name'));
      email = normalizeString(formData.get('email')).toLowerCase();
      subject = normalizeString(formData.get('subject'));
      message = normalizeString(formData.get('message'));
      orderNumber = normalizeString(formData.get('orderNumber'));
    }

    if (!name || !email || !subject || !message) {
      return jsonResponse({ error: 'All required fields must be filled.' }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: 'Invalid email address.' }, 400);
    }

    if (!isEmailConfigured()) {
      return jsonResponse({ error: `Email service is not configured yet. Please contact us directly at ${getSupportEmailAddress()}.` }, 503);
    }

    await sendContactEmail({ name, email, subject, message, orderNumber });

    return jsonResponse({ success: true, message: 'Message sent successfully.' }, 200);
  } catch (err: any) {
    const msg = err?.message || 'Unknown error';
    console.error('Contact form error:', msg, err);
    const supportEmail = getSupportEmailAddress();
    return jsonResponse({
      error: msg.includes('RESEND_API_KEY')
        ? `Email service not configured. Please contact us directly at ${supportEmail}.`
        : `Failed to send message. Please try again or email us at ${supportEmail}.`,
    }, 500);
  }
};

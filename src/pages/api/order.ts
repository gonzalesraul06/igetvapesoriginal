export const prerender = false;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sendOrderEmails, getSupportEmailAddress, isEmailConfigured, type OrderLineItem } from '@lib/email';
import { MINIMUM_ORDER, SHIPPING_RATES } from '@utils/storeConfig';

const VALID_PAYMENTS = ['bank-transfer', 'payid', 'bitcoin'];

interface RawOrderItem {
  categorySlug?: unknown;
  flavourSlug?: unknown;
  quantity?: unknown;
}

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

function isValidPostcode(value: string): boolean {
  return /^[0-9]{4}$/.test(value);
}

function isRawOrderItem(value: unknown): value is RawOrderItem {
  return typeof value === 'object' && value !== null;
}

async function buildVerifiedItems(rawItems: unknown[]): Promise<OrderLineItem[] | null> {
  const products = await getCollection('products');
  const productMap = new Map(products.map((entry) => [entry.data.slug, entry.data]));
  const verifiedItems: OrderLineItem[] = [];

  for (const rawItem of rawItems) {
    if (!isRawOrderItem(rawItem)) {
      return null;
    }

    const categorySlug = normalizeString(rawItem.categorySlug);
    const flavourSlug = normalizeString(rawItem.flavourSlug);
    const quantity = Number(rawItem.quantity);

    if (!categorySlug || !flavourSlug || !Number.isInteger(quantity) || quantity <= 0 || quantity > 99) {
      return null;
    }

    const product = productMap.get(categorySlug);
    const flavour = product?.flavours.find((entry) => entry.slug === flavourSlug);

    if (!product || !flavour || !flavour.inStock) {
      return null;
    }

    verifiedItems.push({
      categorySlug,
      flavourSlug,
      name: flavour.name,
      quantity,
      price: flavour.price,
    });
  }

  return verifiedItems;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const firstName = normalizeString(body.firstName);
    const lastName = normalizeString(body.lastName);
    const email = normalizeString(body.email).toLowerCase();
    const phone = normalizeString(body.phone);
    const address = normalizeString(body.address);
    const address2 = normalizeString(body.address2);
    const city = normalizeString(body.city);
    const state = normalizeString(body.state).toUpperCase();
    const postcode = normalizeString(body.postcode);
    const notes = normalizeString(body.notes);
    const payment = normalizeString(body.payment);
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const submittedSubtotal = typeof body.subtotal === 'number' ? body.subtotal : Number.NaN;

    if (!firstName || !lastName || !email || !phone || !address || !city || !state || !postcode || !payment) {
      return jsonResponse({ error: 'All shipping fields are required.' }, 400);
    }

    if (!rawItems.length) {
      return jsonResponse({ error: 'Cart is empty.' }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: 'Invalid email address.' }, 400);
    }

    if (!isValidPostcode(postcode)) {
      return jsonResponse({ error: 'Invalid Australian postcode.' }, 400);
    }

    if (!SHIPPING_RATES[state]) {
      return jsonResponse({ error: 'Invalid Australian state or territory.' }, 400);
    }

    if (!VALID_PAYMENTS.includes(payment)) {
      return jsonResponse({ error: 'Invalid payment method.' }, 400);
    }

    const items = await buildVerifiedItems(rawItems);
    if (!items) {
      return jsonResponse({ error: 'One or more cart items are invalid or no longer available. Please review your cart and try again.' }, 400);
    }

    const subtotal = Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));

    if (!Number.isFinite(submittedSubtotal) || Math.abs(submittedSubtotal - subtotal) > 0.01) {
      return jsonResponse({ error: 'Cart prices changed before checkout. Review the order summary and submit again.' }, 409);
    }

    if (subtotal < MINIMUM_ORDER) {
      return jsonResponse({ error: `Minimum order is $${MINIMUM_ORDER} AUD.` }, 400);
    }

    if (!isEmailConfigured()) {
      return jsonResponse({ error: `Email service is not configured yet. Please contact us directly at ${getSupportEmailAddress()}.` }, 503);
    }

    const shipping = SHIPPING_RATES[state];
    const total = Number((subtotal + shipping).toFixed(2));

    const orderRef = await sendOrderEmails({
      firstName,
      lastName,
      email,
      phone,
      address: address2 ? `${address}, ${address2}` : address,
      city,
      state,
      postcode,
      payment,
      notes,
      items,
      subtotal,
      shipping,
      total,
    });

    return jsonResponse({ success: true, orderRef, message: 'Order placed successfully.' }, 200);
  } catch (err: any) {
    console.error('Order submission error:', err);
    const supportEmail = getSupportEmailAddress();
    const message = String(err?.message || '');
    if (message.includes('RESEND_API_KEY')) {
      return jsonResponse({ error: `Email service not configured. Contact us directly at ${supportEmail}.` }, 500);
    }

    return jsonResponse({ error: `Failed to place the order. Please try again or email ${supportEmail}.` }, 500);
  }
};

export const prerender = false;

import type { APIRoute } from 'astro';
import { sendOrderEmails } from '@lib/email';

const MINIMUM_ORDER = 250;

const SHIPPING_RATES: Record<string, number> = {
  ACT: 10, NSW: 10, VIC: 10,
  QLD: 15, SA: 15,
  WA: 20, TAS: 20,
  NT: 25,
};

const VALID_PAYMENTS = ['bank-transfer', 'payid', 'bitcoin'];

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const { firstName, lastName, email, phone, address, address2, city, state, postcode, notes, payment, items, subtotal } = body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !address || !city || !state || !postcode || !payment) {
      return new Response(JSON.stringify({ error: 'All shipping fields are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!/^[0-9]{4}$/.test(postcode)) {
      return new Response(JSON.stringify({ error: 'Invalid Australian postcode.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!SHIPPING_RATES[state]) {
      return new Response(JSON.stringify({ error: 'Invalid Australian state/territory.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!VALID_PAYMENTS.includes(payment)) {
      return new Response(JSON.stringify({ error: 'Invalid payment method.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Server-side minimum order check
    if (typeof subtotal !== 'number' || subtotal < MINIMUM_ORDER) {
      return new Response(JSON.stringify({ error: `Minimum order is $${MINIMUM_ORDER} AUD.` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate shipping server-side (don't trust client value)
    const shipping = SHIPPING_RATES[state];
    const total = subtotal + shipping;

    const orderRef = await sendOrderEmails({
      firstName, lastName, email, phone,
      address: address2 ? `${address}, ${address2}` : address,
      city, state, postcode, payment, notes: notes || '',
      items, subtotal, shipping, total,
    });

    return new Response(JSON.stringify({ success: true, orderRef, message: 'Order placed successfully!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Order submission error:', err);
    return new Response(JSON.stringify({ error: 'Failed to place order. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

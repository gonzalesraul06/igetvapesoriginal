export const prerender = false;

import type { APIRoute } from 'astro';
import { sendOrderEmails } from '@lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const { firstName, lastName, email, phone, address, city, state, postcode, payment, items, subtotal, shipping, total } = body;

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
      return new Response(JSON.stringify({ error: 'Invalid postcode.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const orderRef = await sendOrderEmails({
      firstName, lastName, email, phone, address, city, state, postcode, payment,
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

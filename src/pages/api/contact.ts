export const prerender = false;

import type { APIRoute } from 'astro';
import { sendContactEmail } from '@lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let name: string, email: string, subject: string, message: string, orderNumber: string;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      name = body.name;
      email = body.email;
      subject = body.subject;
      message = body.message;
      orderNumber = body.orderNumber || '';
    } else {
      const formData = await request.formData();
      name = formData.get('name')?.toString() || '';
      email = formData.get('email')?.toString() || '';
      subject = formData.get('subject')?.toString() || '';
      message = formData.get('message')?.toString() || '';
      orderNumber = formData.get('orderNumber')?.toString() || '';
    }

    // Validation
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'All required fields must be filled.' }), {
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

    await sendContactEmail({ name, email, subject, message, orderNumber });

    return new Response(JSON.stringify({ success: true, message: 'Message sent successfully!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Contact form error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send message. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

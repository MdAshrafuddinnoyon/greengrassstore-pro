import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderEmailRequest {
  type: 'order_confirmation' | 'status_update';
  order: {
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    customer_address?: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    status: string;
    payment_method?: string;
    created_at: string;
  };
  previous_status?: string;
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Order Placed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return labels[status] || status;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: '#eab308',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#22c55e',
    cancelled: '#ef4444'
  };
  return colors[status] || '#6b7280';
};

const generateInvoiceHTML = (order: OrderEmailRequest['order']): string => {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">AED ${item.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">AED ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #2d5a3d; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">GREEN GRASS STORE</h1>
          <p style="color: #a7f3d0; margin: 10px 0 0;">www.greengrassstore.com</p>
        </div>

        <!-- Order Confirmation Banner -->
        <div style="background-color: #dcfce7; padding: 20px; text-align: center; border-bottom: 2px solid #22c55e;">
          <h2 style="color: #166534; margin: 0;">✓ Order Confirmed!</h2>
          <p style="color: #15803d; margin: 10px 0 0;">Thank you for your order, ${order.customer_name}!</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 30px;">
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <div>
                <p style="color: #6b7280; font-size: 12px; margin: 0;">ORDER NUMBER</p>
                <p style="color: #111827; font-weight: bold; margin: 5px 0 0; font-size: 18px;">${order.order_number}</p>
              </div>
              <div style="text-align: right;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">ORDER DATE</p>
                <p style="color: #111827; margin: 5px 0 0;">${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
              <span style="display: inline-block; padding: 6px 16px; background-color: ${getStatusColor(order.status)}; color: white; border-radius: 20px; font-size: 14px;">
                ${getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #374151; margin: 0 0 10px; font-size: 16px;">Shipping Address</h3>
            <p style="color: #6b7280; margin: 0; line-height: 1.6;">
              ${order.customer_name}<br>
              ${order.customer_email}<br>
              ${order.customer_phone || ''}<br>
              ${order.customer_address || 'Address not provided'}
            </p>
          </div>

          <!-- Order Items -->
          <h3 style="color: #374151; margin: 0 0 15px; font-size: 16px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Item</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Price</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="margin-top: 20px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Subtotal</span>
              <span style="color: #374151;">AED ${order.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Tax</span>
              <span style="color: #374151;">AED ${order.tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <span style="color: #6b7280;">Shipping</span>
              <span style="color: #374151;">AED ${order.shipping.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 2px solid #e5e7eb; padding-top: 15px;">
              <span style="color: #111827; font-weight: bold; font-size: 18px;">Total</span>
              <span style="color: #2d5a3d; font-weight: bold; font-size: 18px;">AED ${order.total.toFixed(2)}</span>
            </div>
          </div>

          ${order.payment_method ? `
          <div style="margin-top: 15px;">
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Payment Method:</strong> ${order.payment_method}
            </p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">
            Questions about your order? Contact us:
          </p>
          <p style="margin: 0;">
            <a href="https://wa.me/971547751901" style="color: #2d5a3d; text-decoration: none; font-weight: 500;">
              WhatsApp: +971 54 775 1901
            </a>
          </p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Green Grass Store. All rights reserved.<br>
              Dubai, UAE
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateStatusUpdateHTML = (order: OrderEmailRequest['order'], previousStatus?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #2d5a3d; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">GREEN GRASS STORE</h1>
          <p style="color: #a7f3d0; margin: 10px 0 0;">Order Update</p>
        </div>

        <!-- Status Update Banner -->
        <div style="background-color: ${getStatusColor(order.status)}15; padding: 30px; text-align: center; border-bottom: 2px solid ${getStatusColor(order.status)};">
          <h2 style="color: ${getStatusColor(order.status)}; margin: 0; font-size: 24px;">
            ${order.status === 'delivered' ? '🎉' : order.status === 'shipped' ? '📦' : order.status === 'cancelled' ? '❌' : '🔄'} 
            Order ${getStatusLabel(order.status)}
          </h2>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            Hi ${order.customer_name},
          </p>
          
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
            ${order.status === 'processing' ? 'Great news! Your order is being processed and will be shipped soon.' :
              order.status === 'shipped' ? 'Your order has been shipped! It\'s on its way to you.' :
              order.status === 'delivered' ? 'Your order has been delivered! We hope you love your purchase.' :
              order.status === 'cancelled' ? 'Your order has been cancelled. If you have any questions, please contact us.' :
              'Your order status has been updated.'}
          </p>

          <!-- Order Info -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <div style="margin-bottom: 15px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">ORDER NUMBER</p>
              <p style="color: #111827; font-weight: bold; margin: 5px 0 0; font-size: 18px;">${order.order_number}</p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px;">
              ${previousStatus ? `
                <span style="padding: 6px 12px; background-color: #e5e7eb; color: #6b7280; border-radius: 15px; font-size: 13px; text-decoration: line-through;">
                  ${getStatusLabel(previousStatus)}
                </span>
                <span style="color: #9ca3af;">→</span>
              ` : ''}
              <span style="padding: 6px 16px; background-color: ${getStatusColor(order.status)}; color: white; border-radius: 20px; font-size: 14px; font-weight: 500;">
                ${getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          <!-- Order Summary -->
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #374151; font-weight: 600; margin: 0 0 10px;">Order Total: <span style="color: #2d5a3d;">AED ${order.total.toFixed(2)}</span></p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">${order.items.length} item(s)</p>
          </div>

          ${order.status === 'delivered' ? `
          <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; text-align: center;">
            <p style="color: #92400e; font-weight: 600; margin: 0 0 10px;">Enjoying your purchase?</p>
            <p style="color: #a16207; font-size: 14px; margin: 0;">We'd love to hear from you! Share your experience with us.</p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">
            Need help? Contact us anytime:
          </p>
          <p style="margin: 0;">
            <a href="https://wa.me/971547751901" style="color: #2d5a3d; text-decoration: none; font-weight: 500;">
              WhatsApp: +971 54 775 1901
            </a>
          </p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Green Grass Store. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Order email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, order, previous_status }: OrderEmailRequest = await req.json();
    
    console.log(`Processing ${type} email for order ${order.order_number}`);

    let subject: string;
    let html: string;

    if (type === 'order_confirmation') {
      subject = `Order Confirmed - ${order.order_number} | Green Grass Store`;
      html = generateInvoiceHTML(order);
    } else {
      subject = `Order ${getStatusLabel(order.status)} - ${order.order_number} | Green Grass Store`;
      html = generateStatusUpdateHTML(order, previous_status);
    }

    const emailResponse = await resend.emails.send({
      from: "Green Grass Store <onboarding@resend.dev>",
      to: [order.customer_email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

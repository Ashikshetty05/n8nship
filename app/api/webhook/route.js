import crypto from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log("Webhook event:", event.event);

    // Handle payment captured event
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const email = payment.notes?.email;
      const currency = payment.currency;

      if (!email) {
        console.error("No email in payment notes");
        return NextResponse.json({ error: "No email found" }, { status: 400 });
      }

      // Initialize clients
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Check if payment already processed
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("razorpay_payment_id", payment.id)
        .single();

      if (existingPayment) {
        console.log("Payment already processed:", payment.id);
        return NextResponse.json({ status: "already processed" });
      }

      // Save payment to Supabase
      const { error: paymentError } = await supabase.from("payments").insert({
        email,
        razorpay_order_id: payment.order_id,
        razorpay_payment_id: payment.id,
        amount: currency === "INR" ? 999 : 11,
        currency,
        status: "success",
      });
      if (paymentError) console.error("Payment save error:", paymentError.message);

      // Save/update customer
      const { error: customerError } = await supabase.from("customers").upsert({
        email,
        is_pro: true,
        currency,
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (customerError) console.error("Customer save error:", customerError.message);

      // Send email if not already sent
      await resend.emails.send({
        from: "n8nShip <onboarding@resend.dev>",
        to: email,
        subject: "🚀 Payment confirmed - Your n8n is ready!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #080808; color: #F0EDE8;">
            <h1 style="color: #FF5C00; font-size: 28px; margin-bottom: 8px;">Payment confirmed! 🎉</h1>
            <p style="color: #888; margin-bottom: 32px;">Your payment of ${currency === "INR" ? "₹999" : "$11"} was successful. Deploy your n8n instance now!</p>
            
            <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="color: #FF5C00; font-size: 14px; font-weight: bold; margin-bottom: 16px;">⚡ Deploy n8n now</p>
              <a href="https://railway.com/new/template/n8n" style="display: inline-block; background: #FF5C00; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Deploy n8n Template →</a>
            </div>

            <p style="color: #555; font-size: 13px;">Need help? Just reply to this email!</p>
            <p style="color: #333; font-size: 12px; margin-top: 40px;">n8nShip — Deploy n8n in 60 seconds</p>
          </div>
        `,
      });

      console.log("Webhook processed successfully for:", email);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
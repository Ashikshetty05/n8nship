import crypto from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import { createClient } from "@supabase/supabase-js";

// Input validation schema
const verifySchema = z.object({
  razorpay_order_id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^order_[a-zA-Z0-9]+$/, "Invalid order ID"),
  razorpay_payment_id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^pay_[a-zA-Z0-9]+$/, "Invalid payment ID"),
  razorpay_signature: z
    .string()
    .min(1)
    .max(256)
    .regex(/^[a-f0-9]+$/, "Invalid signature"),
  email: z
    .string()
    .email("Invalid email")
    .max(254)
    .toLowerCase()
    .trim(),
  currency: z.enum(["INR", "USD"]).default("INR"),
});

export async function POST(request) {
  try {
    // 1. Validate content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // 2. Parse and validate input
    const requestBody = await request.json();
    const result = verifySchema.safeParse(requestBody);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues?.[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, currency } = result.data;

    // 3. Check API keys exist
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay secret key");
      return NextResponse.json(
        { error: "Payment verification unavailable" },
        { status: 503 }
      );
    }

    // 4. Verify payment signature (OWASP: use timing-safe comparison)
    const body_str = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body_str)
      .digest("hex");

    const sigBuffer = Buffer.from(razorpay_signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // 5. Initialize clients
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // 6. Deploy n8n instance on Railway
    const deployResult = await deployN8n(email);

    // 7. Save customer to Supabase
    const { error: customerError } = await supabase.from("customers").upsert({
      email,
      is_pro: true,
      currency,
      railway_project_url: deployResult.url,
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (customerError) console.error("Supabase customer error:", customerError.message);

    // 8. Save payment to Supabase
const { error: paymentError } = await supabase.from("payments").insert({
  email,
  razorpay_order_id,
  razorpay_payment_id,
  amount: currency === "INR" ? 999 : 11,
  currency,
  status: "success",
});
if (paymentError) console.error("Supabase payment error:", paymentError.message);

    // 9. Store trial start date in Redis
    const trialKey = `trial:${email}`;
    const trialExists = await redis.get(trialKey);
    if (!trialExists) {
      await redis.set(trialKey, Date.now(), { ex: 60 * 60 * 24 * 3 });
    }

    // 10. Send credentials email
    await resend.emails.send({
      from: "n8nShip <onboarding@resend.dev>",
      to: email,
      subject: "🚀 Your n8n instance is ready!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #080808; color: #F0EDE8;">
          <h1 style="color: #FF5C00; font-size: 28px; margin-bottom: 8px;">Your n8n is ready to deploy! 🚀</h1>
          <p style="color: #888; margin-bottom: 32px;">Thanks for subscribing to n8nShip Pro. Follow these simple steps to get your n8n instance running!</p>
          
          <div style="background: #111; border: 1px solid #FF5C00; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #FF5C00; font-size: 14px; font-weight: bold; margin-bottom: 16px;">⚡ Step 1: Open your Railway project</p>
            <a href="${deployResult.url}" style="display: inline-block; background: #FF5C00; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open My Project →</a>
          </div>

          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #FF5C00; font-size: 14px; font-weight: bold; margin-bottom: 16px;">⚡ Step 2: Deploy n8n template</p>
            <p style="color: #888; font-size: 13px; margin-bottom: 16px;">Click the button below to deploy n8n directly into your project:</p>
            <a href="${deployResult.templateUrl}" style="display: inline-block; background: #222; color: #F0EDE8; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; border: 1px solid #444;">Deploy n8n Template →</a>
          </div>

          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #FF5C00; font-size: 14px; font-weight: bold; margin-bottom: 16px;">⚡ Step 3: Login credentials</p>
            <p style="margin: 0; font-size: 14px;"><span style="color: #888;">Email:</span> <strong>${email}</strong></p>
            <p style="margin: 8px 0 0; font-size: 14px;"><span style="color: #888;">Password:</span> <strong>Set during first login</strong></p>
          </div>

          <p style="color: #555; font-size: 13px;">Need help? Just reply to this email and we'll get you sorted!</p>
          <p style="color: #333; font-size: 12px; margin-top: 40px;">n8nShip — Deploy n8n in 60 seconds</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and n8n deployment started!",
      deploymentUrl: deployResult.url,
    });
  } catch (error) {
    console.error("Verify error:", error.message);
    return NextResponse.json(
      { error: "Verification failed. Please contact support." },
      { status: 500 }
    );
  }
}

async function deployN8n(email) {
  const projectName = `n8n-${email.split("@")[0]}-${Date.now()}`;

  const projectRes = await fetch("https://backboard.railway.app/graphql/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
    },
    body: JSON.stringify({
      query: `
        mutation projectCreate($input: ProjectCreateInput!) {
          projectCreate(input: $input) {
            id
            name
          }
        }
      `,
      variables: {
        input: { name: projectName },
      },
    }),
  });

  const projectData = await projectRes.json();
  console.log("Full Railway response:", JSON.stringify(projectData));
  const projectId = projectData?.data?.projectCreate?.id;

  return {
    url: projectId
      ? `https://railway.com/project/${projectId}`
      : `https://railway.com/new`,
    templateUrl: `https://railway.com/new/template/n8n`,
  };
}
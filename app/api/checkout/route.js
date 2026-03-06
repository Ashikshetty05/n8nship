import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";

// Input validation schema
const checkoutSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(254, "Email too long")
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
    const body = await request.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues?.[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // 3. Check API keys exist
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay API keys");
      return NextResponse.json(
        { error: "Payment service unavailable" },
        { status: 503 }
      );
    }

    // 4. Create Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: body.currency === "INR" ? 999 * 100 : 11 * 100,
      currency: body.currency || "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { email, product: "n8nShip Pro" },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Checkout error:", error.message);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
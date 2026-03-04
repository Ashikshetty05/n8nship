import crypto from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } =
      await request.json();

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Deploy n8n instance on Railway
    const deployResult = await deployN8n(email);

    // Send credentials email
    await resend.emails.send({
      from: "n8nShip <onboarding@resend.dev>",
      to: email,
      subject: "🚀 Your n8n instance is ready!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #080808; color: #F0EDE8;">
          <h1 style="color: #FF5C00; font-size: 28px; margin-bottom: 8px;">Your n8n is live! 🚀</h1>
          <p style="color: #888; margin-bottom: 32px;">Thanks for subscribing to n8nShip Pro. Your instance is being set up right now.</p>
          
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your n8n URL</p>
            <a href="${deployResult.url}" style="color: #FF5C00; font-size: 16px; text-decoration: none;">${deployResult.url}</a>
          </div>

          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Login Credentials</p>
            <p style="margin: 0; font-size: 14px;"><span style="color: #888;">Email:</span> <strong>${email}</strong></p>
            <p style="margin: 8px 0 0; font-size: 14px;"><span style="color: #888;">Password:</span> <strong>Change this after first login!</strong></p>
          </div>

          <p style="color: #555; font-size: 13px;">Your instance may take up to 2 minutes to be fully ready. If you have any issues, reply to this email.</p>
          
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
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

async function deployN8n(email) {
  const response = await fetch("https://backboard.railway.app/graphql/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
    },
    body: JSON.stringify({
      query: `
        mutation deployTemplate($input: TemplateDeployInput!) {
          templateDeploy(input: $input) {
            projectId
            workflowId
          }
        }
      `,
      variables: {
        input: {
          templateCode: "n8n",
          teamId: null,
          projectName: `n8n-${email.split("@")[0]}-${Date.now()}`,
        },
      },
    }),
  });

  const data = await response.json();
  console.log("Railway deploy response:", data);

  return {
    url: `https://railway.app/project/${data?.data?.templateDeploy?.projectId}`,
  };
}
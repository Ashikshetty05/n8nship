import crypto from "crypto";
import { NextResponse } from "next/server";

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
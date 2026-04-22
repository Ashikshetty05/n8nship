import crypto from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import { createClient } from "@supabase/supabase-js";

console.log("MODULE LOADED: trial/route.js");

const trialSchema = z.object({
  email: z.string().email("Invalid email").max(254).toLowerCase().trim(),
  instance: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Invalid instance name"),
});

export async function POST(request) {
  try {
    console.log("Step 1: Handler reached");

    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 });
    }
    console.log("Step 2: Content-Type OK");

    const body = await request.json();
    const result = trialSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues?.[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.log("Step 3: Input validated", result.data.email);

    const { email, instance } = result.data;

    console.log("Step 4: Initializing Redis...");
    console.log("UPSTASH_REDIS_REST_URL present:", !!process.env.UPSTASH_REDIS_REST_URL);
    console.log("UPSTASH_REDIS_REST_TOKEN present:", !!process.env.UPSTASH_REDIS_REST_TOKEN);
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("Step 5: Redis initialized");

    console.log("Step 6: Initializing Supabase...");
    console.log("SUPABASE_URL present:", !!process.env.SUPABASE_URL);
    console.log("SUPABASE_SERVICE_ROLE_KEY present:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log("Step 7: Supabase initialized");

    console.log("Step 8: Initializing Resend...");
    console.log("RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log("Step 9: Resend initialized");

    console.log("Step 10: Checking email rate limit...");
    const emailKey = `trial:email:${email}`;
    const emailExists = await redis.get(emailKey);
    if (emailExists) {
      return NextResponse.json({ error: "Trial already used for this email." }, { status: 429 });
    }
    console.log("Step 11: Email rate limit passed");

    console.log("Step 12: Checking IP rate limit...");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipKey = `trial:ip:${ip}`;
    const ipCount = await redis.get(ipKey);
    if (ipCount && parseInt(ipCount) >= 2) {
      return NextResponse.json({ error: "Too many trials from this IP." }, { status: 429 });
    }
    console.log("Step 13: IP rate limit passed");

    console.log("Step 14: Starting Railway deploy...");
    console.log("RAILWAY_API_TOKEN present:", !!process.env.RAILWAY_API_TOKEN);
    const deployResult = await deployN8n(email, instance);
    console.log("Step 15: Railway deploy complete", deployResult.url);

    await redis.set(emailKey, Date.now(), { ex: 60 * 60 * 24 * 3 });
    if (ipCount) {
      await redis.incr(ipKey);
    } else {
      await redis.set(ipKey, 1, { ex: 60 * 60 * 24 });
    }
    console.log("Step 16: Redis trial marked");

    console.log("Step 17: Saving to Supabase...");
    const { error: customerError } = await supabase.from("customers").upsert({
      email,
      is_pro: false,
      currency: "INR",
      railway_project_url: deployResult.url,
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "email" });
    if (customerError) console.error("Supabase error:", customerError.message);
    console.log("Step 18: Supabase save done");

    console.log("Step 19: Sending email...");
    await resend.emails.send({
      from: "n8nShip <onboarding@resend.dev>",
      to: "ashikshetty102@gmail.com",
      subject: "🚀 Your n8n free trial is live!",
      html: `<p>Your instance: <a href="${deployResult.url}">${deployResult.url}</a></p>`,
    });
    console.log("Step 20: Email sent");

    return NextResponse.json({ success: true, deploymentUrl: deployResult.url });

  } catch (error) {
    console.error("FATAL ERROR:", error.message);
    console.error("Full error:", error);
    return NextResponse.json({ error: "Trial setup failed. Please contact support." }, { status: 500 });
  }
}

async function deployN8n(email, instance, retries = 3) {
  const projectName = `n8n-${instance}-${Date.now()}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempting Railway API call... (attempt ${attempt})`);
      const projectRes = await fetch("https://backboard.railway.app/graphql/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
        },
        body: JSON.stringify({
          query: `mutation projectCreate($input: ProjectCreateInput!) {
            projectCreate(input: $input) {
              id
              environments { edges { node { id name } } }
            }
          }`,
          variables: { input: { name: projectName } },
        }),
      });

      const projectData = await projectRes.json();
      const projectId = projectData?.data?.projectCreate?.id;
      const environmentId = projectData?.data?.projectCreate?.environments?.edges?.[0]?.node?.id;
      if (!projectId || !environmentId) throw new Error("Failed to create project");
      console.log("Railway project created:", projectId);

      const serviceRes = await fetch("https://backboard.railway.app/graphql/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
        },
        body: JSON.stringify({
          query: `mutation serviceCreate($input: ServiceCreateInput!) {
            serviceCreate(input: $input) { id }
          }`,
          variables: { input: { projectId, name: "n8n", source: { image: "n8nio/n8n" } } },
        }),
      });

      const serviceData = await serviceRes.json();
      const serviceId = serviceData?.data?.serviceCreate?.id;
      if (!serviceId) throw new Error("Failed to create service");
      console.log("Railway service created:", serviceId);

      const variables = [
        { name: "N8N_ENCRYPTION_KEY", value: crypto.randomBytes(24).toString("hex") },
        { name: "N8N_USER_MANAGEMENT_DISABLED", value: "false" },
        { name: "WEBHOOK_URL", value: `https://${projectName}.up.railway.app` },
        { name: "GENERIC_TIMEZONE", value: "Asia/Kolkata" },
      ];

      for (const variable of variables) {
        await fetch("https://backboard.railway.app/graphql/v2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
          },
          body: JSON.stringify({
            query: `mutation variableUpsert($input: VariableUpsertInput!) {
              variableUpsert(input: $input)
            }`,
            variables: { input: { projectId, environmentId, serviceId, name: variable.name, value: variable.value } },
          }),
        });
      }

      return { url: `https://railway.com/project/${projectId}` };

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt < retries) await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }

  return { url: `https://railway.com/new` };
}
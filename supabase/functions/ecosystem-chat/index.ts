import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGES = 20;
const MAX_CONTEXT_BYTES = 2000;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const context = body?.context;

    const messages = rawMessages.slice(0, MAX_MESSAGES).map((m) => ({
      role: typeof m?.role === "string" && m.role !== "system" ? m.role : "user",
      content: typeof m?.content === "string" ? m.content.slice(0, 4000) : "",
    })).filter((m) => m.content.length > 0);

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const systemPrompt = `You are SparkX AI — the intelligent assistant for Africa's Startup Ecosystem platform (SparkX Index). You help founders, investors, mentors, and ecosystem partners navigate the platform and Africa's startup landscape.

Your capabilities:
- Answer questions about Africa's startup ecosystem, funding opportunities, accelerators, and policy
- Help users find investors, mentors, startups, and ecosystem partners
- Provide insights on industries (FinTech, AgriTech, HealthTech, EdTech, etc.)
- Guide users through platform features (posting, connecting, onboarding)
- Share knowledge about funding stages (Pre-seed, Seed, Series A, etc.)
- Help with business strategy, pitch deck tips, and startup best practices

Platform context:
${context ? `User profile: ${JSON.stringify(context).slice(0, MAX_CONTEXT_BYTES)}` : "No user context provided."}

Key African ecosystem facts:
- Major hubs: Lagos, Nairobi, Accra, Cape Town, Cairo, Kigali
- Key accelerators: MEST, Y Combinator Africa, Techstars Africa, Flat6Labs, CcHub
- Active VCs: Ventures Platform, Ingressive Capital, Launch Africa, Partech Africa, TLcom Capital
- Growing sectors: FinTech, AgriTech, HealthTech, E-commerce, Logistics, CleanTech
- Notable ecosystems: Nigeria, Kenya, South Africa, Egypt, Ghana, Rwanda

Guidelines:
- Be concise but helpful
- If asked about specific people/companies on the platform, say you can help them search or connect
- Always be encouraging and supportive of entrepreneurs
- Use relevant Africa-wide context when helpful
- Format responses with markdown for readability`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ecosystem-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
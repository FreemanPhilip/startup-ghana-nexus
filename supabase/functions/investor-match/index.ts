import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
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
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Fetch user's startups
    const { data: memberRows } = await supabase
      .from("startup_members")
      .select("startup_id, role")
      .eq("user_id", userId);

    let startups: any[] = [];
    if (memberRows && memberRows.length > 0) {
      const startupIds = memberRows.map((m: any) => m.startup_id);
      const { data: startupData } = await supabase
        .from("startups")
        .select("*")
        .in("id", startupIds);
      startups = startupData ?? [];
    }

    // Build context about the user
    const userContext = {
      name: profile?.full_name || "Unknown",
      industry: profile?.industry || "Not specified",
      companyStage: profile?.company_stage || "Not specified",
      expertise: profile?.expertise || [],
      fundingRequired: profile?.funding_required || null,
      location: profile?.location || "Not specified",
      startups: startups.map((s: any) => ({
        name: s.name,
        industry: s.industry,
        stage: s.stage,
        location: s.location,
        description: s.short_description,
      })),
    };

    // Define the investor pool (these match the demo data in the frontend)
    const investorPool = [
      {
        id: "1",
        name: "Accra Venture Partners",
        focus: "FinTech, e-commerce, B2B",
        stage: "Seed",
        avgTicket: "$150k",
        region: "West Africa",
        description: "Early-stage VC focusing on FinTech and e-commerce startups across West Africa.",
      },
      {
        id: "2",
        name: "GCF Impact Fund",
        focus: "CleanTech, Impact, Sustainability",
        stage: "Series A",
        avgTicket: "$750k",
        region: "Ghana",
        description: "Driving sustainable growth through Series A investments in climate-positive ventures.",
      },
      {
        id: "3",
        name: "Pan-African Angels",
        focus: "Any Sector, Diaspora Capital",
        stage: "Pre-Seed",
        avgTicket: "$25k",
        region: "Pan-African",
        description: "Strategic angel network connecting diaspora capital to high-potential African startups.",
      },
      {
        id: "4",
        name: "Kumasi Tech Capital",
        focus: "Hardware, SaaS, Tech",
        stage: "Seed",
        avgTicket: "$100k",
        region: "Ashanti Region",
        description: "Dedicated to fostering the tech ecosystem in the Ashanti region with seed-stage investments.",
      },
      {
        id: "5",
        name: "Osei-Danquah Family Office",
        focus: "PropTech, Real Estate, Growth",
        stage: "Growth",
        avgTicket: "$500k",
        region: "Ghana",
        description: "Private capital group looking for sustainable real estate and property technology investments.",
      },
      {
        id: "6",
        name: "Retail West Africa Fund",
        focus: "Logistics, Supply Chain, SME",
        stage: "Seed",
        avgTicket: "$125k",
        region: "West Africa",
        description: "Specialized fund for retail supply chain optimization and last-mile logistics solutions.",
      },
    ];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an AI investor matching engine for the Ghana Startup Ecosystem platform. 
Your job is to analyze a founder's profile and their startup(s), then recommend the best matching investors from the available pool.

For each recommended investor, provide:
1. A match percentage (0-100) based on industry fit, stage alignment, ticket size relevance, and geographic focus
2. A brief 1-2 sentence reasoning explaining WHY this investor is a good match
3. Key strengths of the match

Return your response as a valid JSON array with this structure:
[
  {
    "investor_id": "string",
    "investor_name": "string", 
    "match_percent": number,
    "reasoning": "string",
    "strengths": ["string", "string"]
  }
]

Sort by match_percent descending. Include ALL investors but rank them. Be specific about why each matches or doesn't match well.`;

    const userPrompt = `Analyze this founder and their startup(s), then match them with investors:

**Founder Profile:**
- Name: ${userContext.name}
- Industry: ${userContext.industry}
- Company Stage: ${userContext.companyStage}
- Expertise: ${userContext.expertise.join(", ") || "Not specified"}
- Funding Required: ${userContext.fundingRequired ? `$${userContext.fundingRequired}` : "Not specified"}
- Location: ${userContext.location}

**Startup(s):**
${userContext.startups.length > 0
        ? userContext.startups.map((s: any) => `- ${s.name}: ${s.industry || "N/A"} industry, ${s.stage || "N/A"} stage, ${s.location || "N/A"}. ${s.description || ""}`).join("\n")
        : "No startups registered yet."}

**Available Investors:**
${investorPool.map((inv) => `- ${inv.name} (ID: ${inv.id}): Focus: ${inv.focus}, Stage: ${inv.stage}, Avg Ticket: ${inv.avgTicket}, Region: ${inv.region}`).join("\n")}

Return the JSON array of matches.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_investor_matches",
              description: "Return the ranked investor matches",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        investor_id: { type: "string" },
                        investor_name: { type: "string" },
                        match_percent: { type: "number" },
                        reasoning: { type: "string" },
                        strengths: { type: "array", items: { type: "string" } },
                      },
                      required: ["investor_id", "investor_name", "match_percent", "reasoning", "strengths"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["matches"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_investor_matches" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI matching failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();

    // Extract tool call result
    let matches: any[] = [];
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        matches = parsed.matches || [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    return new Response(
      JSON.stringify({
        matches,
        userContext: {
          name: userContext.name,
          startupCount: userContext.startups.length,
          industry: userContext.industry,
          stage: userContext.companyStage,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("investor-match error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

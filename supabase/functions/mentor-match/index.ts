import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { challenge } = await req.json();
    if (!challenge || typeof challenge !== "string") {
      return new Response(JSON.stringify({ error: "Please describe your challenge" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    // Fetch mentors from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: mentors } = await sb
      .from("profiles")
      .select("user_id, full_name, avatar_url, headline, industry, expertise, years_experience, availability, bio")
      .not("availability", "is", null);

    const mentorList = (mentors ?? [])
      .filter((m: any) => m.full_name)
      .map((m: any) => ({
        id: m.user_id,
        name: m.full_name,
        headline: m.headline,
        industry: m.industry,
        expertise: m.expertise,
        years: m.years_experience,
        availability: m.availability,
        bio: m.bio?.slice(0, 200),
      }));

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an AI mentor matching assistant for a startup ecosystem platform.
Given a user's challenge and a list of available mentors, recommend the top 3 best matching mentors.

Available mentors:
${JSON.stringify(mentorList, null, 2)}

Respond with a JSON object with this structure:
{
  "matches": [
    { "id": "<user_id>", "name": "<name>", "reason": "<1-2 sentence explanation of why this mentor is a great fit>" }
  ],
  "advice": "<A brief 1-2 sentence piece of advice for the user>"
}

If no mentors are available or none match, return empty matches array with helpful advice.
ONLY return valid JSON, no markdown.`,
            },
            {
              role: "user",
              content: `My startup challenge: ${challenge}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    // Parse JSON from the response (strip potential markdown)
    let parsed;
    try {
      const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { matches: [], advice: content };
    }

    // Enrich matches with avatar/headline
    const mentorMap = new Map((mentors ?? []).map((m: any) => [m.user_id, m]));
    const enrichedMatches = (parsed.matches || []).map((m: any) => {
      const profile = mentorMap.get(m.id);
      return {
        ...m,
        avatar_url: profile?.avatar_url,
        headline: profile?.headline,
        expertise: profile?.expertise,
      };
    });

    return new Response(
      JSON.stringify({ matches: enrichedMatches, advice: parsed.advice }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("mentor-match error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

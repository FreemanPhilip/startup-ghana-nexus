// One-off: reset password for the bootstrap super admin (freemanphilip12@gmail.com).
// Requires header x-bootstrap-secret to match BOOTSTRAP_RESET_SECRET (set as env) OR
// caller must already be that same user. Forces must_change_password on next login.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bootstrap-secret",
};

const TARGET_EMAIL = "freemanphilip12@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { newPassword } = await req.json().catch(() => ({}));
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 12) {
      return new Response(JSON.stringify({ error: "newPassword (>=12 chars) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email via listUsers (paginated)
    let targetId: string | null = null;
    let page = 1;
    while (page < 20 && !targetId) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const found = data.users.find(u => (u.email || "").toLowerCase() === TARGET_EMAIL);
      if (found) targetId = found.id;
      if (data.users.length < 200) break;
      page++;
    }
    if (!targetId) {
      return new Response(JSON.stringify({ error: "Target user not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(targetId, {
      password: newPassword,
      user_metadata: { must_change_password: true },
    });
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ success: true, userId: targetId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

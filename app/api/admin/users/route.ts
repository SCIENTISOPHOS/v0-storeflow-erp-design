import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Helper: ensure the requester is an authenticated admin
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) }
  }

  return { user, supabase }
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("Configuration Supabase manquante (SERVICE_ROLE_KEY)")
  }
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET: list all users (admin only)
export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const { data, error } = await auth.supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at, updated_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data })
}

// POST: create a new user (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  let body: { email?: string; password?: string; full_name?: string; role?: "admin" | "vendeur" }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  const { email, password, full_name, role } = body

  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 6 caractères" },
      { status: 400 },
    )
  }

  if (role !== "admin" && role !== "vendeur") {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
  }

  try {
    const admin = getAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Ensure profile has correct role (trigger creates with vendeur default)
    if (data.user) {
      await admin
        .from("profiles")
        .update({ role, full_name })
        .eq("id", data.user.id)
    }

    return NextResponse.json({ user: data.user })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

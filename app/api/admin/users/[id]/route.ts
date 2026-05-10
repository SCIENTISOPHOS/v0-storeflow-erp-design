import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

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
    throw new Error("Configuration Supabase manquante")
  }
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// PATCH: update a user (role / full_name / password)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const { id } = await params
  let body: { full_name?: string; role?: "admin" | "vendeur"; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  try {
    const admin = getAdminClient()

    // Update password / metadata if provided
    if (body.password || body.full_name || body.role) {
      const updates: Record<string, unknown> = {}
      if (body.password) {
        if (body.password.length < 6) {
          return NextResponse.json(
            { error: "Le mot de passe doit contenir au moins 6 caractères" },
            { status: 400 },
          )
        }
        updates.password = body.password
      }
      if (body.full_name || body.role) {
        updates.user_metadata = { full_name: body.full_name, role: body.role }
      }

      const { error: authErr } = await admin.auth.admin.updateUserById(id, updates)
      if (authErr) {
        return NextResponse.json({ error: authErr.message }, { status: 400 })
      }
    }

    // Update profile
    if (body.full_name || body.role) {
      const profileUpdate: Record<string, unknown> = {}
      if (body.full_name) profileUpdate.full_name = body.full_name
      if (body.role) profileUpdate.role = body.role

      const { error: profileErr } = await admin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", id)

      if (profileErr) {
        return NextResponse.json({ error: profileErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: remove a user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const { id } = await params

  // Prevent self-deletion
  if (id === auth.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte" },
      { status: 400 },
    )
  }

  try {
    const admin = getAdminClient()
    const { error } = await admin.auth.admin.deleteUser(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

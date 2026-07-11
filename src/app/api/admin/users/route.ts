import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const cellLimitedRoles = [
  "cellule",
  "pasteur_cellule",
  "tresorier_cellule",
  "secretaire_cellule",
];

export async function POST(request: Request) {
  const body = await request.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Configuration Supabase serveur manquante. Vérifie SUPABASE_SERVICE_ROLE_KEY dans .env.local.",
      },
      { status: 500 }
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { email, password, full_name, role, assigned_cell_id } = body;

  if (!email || !password || !full_name || !role) {
    return NextResponse.json(
      { error: "Nom, email, mot de passe et rôle sont obligatoires." },
      { status: 400 }
    );
  }

  if (cellLimitedRoles.includes(role) && !assigned_cell_id) {
    return NextResponse.json(
      { error: "Ce rôle doit être rattaché à une cellule." },
      { status: 400 }
    );
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
      },
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: authData.user.id,
    email,
    full_name,
    role,
    access_level: role,
    assigned_cell_id: assigned_cell_id || null,
    status: "active",
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    user_id: authData.user.id,
  });
}
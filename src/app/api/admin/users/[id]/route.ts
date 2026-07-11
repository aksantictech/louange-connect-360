import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type ActorProfile = {
  id: string;
  role: string | null;
  status: string | null;
};

type TargetProfile = {
  id: string;
  role: string | null;
};

const allowedManagerRoles = ["super_admin", "admin_central"];

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Configuration Supabase serveur manquante. Vérifie NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getActorProfile(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace("Bearer ", "").trim();

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  const admin = getAdminClient();

  const { data: userData, error: userError } = await admin.auth.getUser(token);

  if (userError || !userData.user) {
    return null;
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, status")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return profile as ActorProfile;
}

async function getTargetProfile(targetUserId: string) {
  const admin = getAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", targetUserId)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile as TargetProfile;
}

function checkPermission(actor: ActorProfile, target: TargetProfile) {
  if (actor.status !== "active") {
    return {
      allowed: false,
      error: "Ton compte n’est pas actif.",
    };
  }

  if (!actor.role || !allowedManagerRoles.includes(actor.role)) {
    return {
      allowed: false,
      error: "Tu n’as pas les droits pour gérer les utilisateurs.",
    };
  }

  if (target.role === "super_admin" && actor.role !== "super_admin") {
    return {
      allowed: false,
      error:
        "Seul un super administrateur peut modifier, archiver, désactiver ou supprimer un compte super admin.",
    };
  }

  return {
    allowed: true,
    error: null,
  };
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID utilisateur manquant." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = body.status;

    if (!["active", "inactive", "archived"].includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide. Utilise active, inactive ou archived." },
        { status: 400 }
      );
    }

    const actorProfile = await getActorProfile(request);

    if (!actorProfile) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié." },
        { status: 401 }
      );
    }

    const targetProfile = await getTargetProfile(id);

    if (!targetProfile) {
      return NextResponse.json(
        { error: "Utilisateur cible introuvable." },
        { status: 404 }
      );
    }

    const permission = checkPermission(actorProfile, targetProfile);

    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: 403 }
      );
    }

    const admin = getAdminClient();

    const { error } = await admin
      .from("profiles")
      .update({ status })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur serveur inconnue.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID utilisateur manquant." },
        { status: 400 }
      );
    }

    const actorProfile = await getActorProfile(request);

    if (!actorProfile) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié." },
        { status: 401 }
      );
    }

    if (actorProfile.id === id) {
      return NextResponse.json(
        { error: "Tu ne peux pas supprimer ton propre compte." },
        { status: 403 }
      );
    }

    const targetProfile = await getTargetProfile(id);

    if (!targetProfile) {
      return NextResponse.json(
        { error: "Utilisateur cible introuvable." },
        { status: 404 }
      );
    }

    const permission = checkPermission(actorProfile, targetProfile);

    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error },
        { status: 403 }
      );
    }

    const admin = getAdminClient();

    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    const { error: authError } = await admin.auth.admin.deleteUser(id);

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur serveur inconnue.",
      },
      { status: 500 }
    );
  }
}
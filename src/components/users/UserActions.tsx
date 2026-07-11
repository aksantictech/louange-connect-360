"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, Eye, Power, Trash2 } from "lucide-react";
import ActionDropdown from "@/components/ui/ActionDropdown";
import { supabase } from "@/lib/supabase/client";

type UserActionsProps = {
  userId: string;
  userName: string;
  userRole: string | null;
  userStatus?: string | null;
};

type ActorProfile = {
  id: string;
  role: string | null;
};

const managerRoles = ["super_admin", "admin_central"];

export default function UserActions({
  userId,
  userName,
  userRole,
  userStatus,
}: UserActionsProps) {
  const router = useRouter();

  const [actor, setActor] = useState<ActorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadActor() {
      const { data: authData } = await supabase.auth.getUser();

      const user = authData.user;

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setActor({
          id: profile.id,
          role: profile.role,
        });
      }
    }

    loadActor();
  }, []);

  const actorRole = actor?.role || null;
  const isSelf = actor?.id === userId;

  const canManageUsers = actorRole ? managerRoles.includes(actorRole) : false;

  const isProtectedSuperAdmin =
    userRole === "super_admin" && actorRole !== "super_admin";

  const canShowActions = canManageUsers && !isProtectedSuperAdmin;

  async function getAccessToken() {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token || null;
  }

  async function readJsonSafely(response: Response) {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  async function updateStatus(status: "active" | "inactive" | "archived") {
    if (!canShowActions) {
      alert("Tu n’as pas les droits pour modifier ce compte.");
      return;
    }

    if (isSelf && status !== "active") {
      alert("Tu ne peux pas désactiver ou archiver ton propre compte.");
      return;
    }

    const message =
      status === "active"
        ? `Confirmer la réactivation du compte "${userName}" ?`
        : status === "inactive"
          ? `Confirmer la désactivation du compte "${userName}" ?`
          : `Confirmer l’archivage du compte "${userName}" ?`;

    const confirmed = window.confirm(message);

    if (!confirmed) return;

    setIsLoading(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        alert("Session expirée. Reconnecte-toi.");
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await readJsonSafely(response);

      if (!response.ok) {
        alert(result.error || "Erreur pendant la mise à jour.");
        return;
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erreur inconnue pendant la mise à jour."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteUser() {
    if (!canShowActions) {
      alert("Tu n’as pas les droits pour supprimer ce compte.");
      return;
    }

    if (isSelf) {
      alert("Tu ne peux pas supprimer ton propre compte.");
      return;
    }

    const confirmed = window.confirm(
      `Confirmer la suppression définitive du compte "${userName}" ? Cette action est irréversible.`
    );

    if (!confirmed) return;

    setIsLoading(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        alert("Session expirée. Reconnecte-toi.");
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await readJsonSafely(response);

      if (!response.ok) {
        alert(result.error || "Erreur pendant la suppression.");
        return;
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erreur inconnue pendant la suppression."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const dropdownActions = [
    ...(userStatus && userStatus !== "active"
      ? [
          {
            label: "Réactiver",
            icon: <CheckCircle2 size={16} />,
            onClick: () => updateStatus("active"),
          },
        ]
      : []),
    {
      label: "Désactiver",
      icon: <Power size={16} />,
      onClick: () => updateStatus("inactive"),
    },
    {
      label: "Archiver",
      icon: <Archive size={16} />,
      onClick: () => updateStatus("archived"),
    },
    {
      label: "Supprimer",
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: deleteUser,
    },
  ];

  return (
    <div className="flex min-w-max items-center gap-2">
      <Link
        href={`/central/users/${userId}`}
        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        <Eye size={16} />
        Voir
      </Link>

      {canShowActions ? (
        <div className={isLoading ? "pointer-events-none opacity-60" : ""}>
          <ActionDropdown actions={dropdownActions} />
        </div>
      ) : null}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const CELL_ROLES = [
  "cellule",
  "pasteur_cellule",
  "secretaire_cellule",
  "tresorier_cellule",
];

export default function CellAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [isAllowed, setIsAllowed] = useState(false);
  const [message, setMessage] = useState("Vérification de l’accès...");

  useEffect(() => {
    async function checkAccess() {
      const { data: authData } = await supabase.auth.getUser();

      const user = authData.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, role, access_level, status, assigned_cell_id")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        setMessage("Profil utilisateur introuvable.");
        return;
      }

      if (profile.status !== "active") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const role = profile.role || profile.access_level;

      if (!CELL_ROLES.includes(role)) {
        router.replace("/central/dashboard");
        return;
      }

      if (!profile.assigned_cell_id) {
        setMessage("Ce compte cellule n’est rattaché à aucune cellule.");
        return;
      }

      setIsAllowed(true);
    }

    checkAccess();
  }, [router]);

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--louange-bg)] p-6">
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-bold text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
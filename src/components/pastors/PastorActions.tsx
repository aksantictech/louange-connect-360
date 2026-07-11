"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Eye,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import ActionDropdown from "@/components/ui/ActionDropdown";

type PastorActionsProps = {
  pastorId: string;
  pastorName: string;
};

export default function PastorActions({
  pastorId,
  pastorName,
}: PastorActionsProps) {
  const router = useRouter();

  async function updateStatus(status: "inactive" | "archived") {
    const confirmed = window.confirm(
      status === "inactive"
        ? `Confirmer la désactivation de "${pastorName}" ?`
        : `Confirmer l’archivage de "${pastorName}" ?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("pastors")
      .update({ status })
      .eq("id", pastorId);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  async function deletePastor() {
    const confirmed = window.confirm(
      `Confirmer la suppression définitive de "${pastorName}" ?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("pastors")
      .delete()
      .eq("id", pastorId);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-w-max items-center gap-2">
      <Link
        href={`/central/pastors/${pastorId}`}
        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm"
      >
        <Eye size={16} />
        Voir
      </Link>

      <ActionDropdown
        actions={[
          {
            label: "Modifier",
            icon: <Pencil size={16} />,
            onClick: () => router.push(`/central/pastors/${pastorId}/edit`),
          },
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
            onClick: deletePastor,
          },
        ]}
      />
    </div>
  );
}
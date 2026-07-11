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

type CellActionsProps = {
  cellId: string;
  cellName: string;
};

export default function CellActions({ cellId, cellName }: CellActionsProps) {
  const router = useRouter();

  async function updateStatus(status: "inactive" | "archived") {
    const message =
      status === "inactive"
        ? `Confirmer la désactivation de la cellule "${cellName}" ?`
        : `Confirmer l’archivage de la cellule "${cellName}" ?`;

    const confirmed = window.confirm(message);
    if (!confirmed) return;

    const { error } = await supabase
      .from("cells")
      .update({ status })
      .eq("id", cellId);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  async function deleteCell() {
    const confirmed = window.confirm(
      `Confirmer la suppression définitive de la cellule "${cellName}" ?`
    );

    if (!confirmed) return;

    const { error } = await supabase.from("cells").delete().eq("id", cellId);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-w-max items-center gap-2">
      <Link
        href={`/central/cells/${cellId}`}
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
            onClick: () => router.push(`/central/cells/${cellId}/edit`),
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
            onClick: deleteCell,
          },
        ]}
      />
    </div>
  );
}
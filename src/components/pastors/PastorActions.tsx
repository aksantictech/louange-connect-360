"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Eye, Pencil, Power, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

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
    const message =
      status === "inactive"
        ? `Confirmer la désactivation de "${pastorName}" ?`
        : `Confirmer l’archivage de "${pastorName}" ?`;

    const confirmed = window.confirm(message);

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
      `Confirmer la suppression définitive de "${pastorName}" ? Cette action est irréversible.`
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
      <ActionLink
        href={`/central/pastors/${pastorId}`}
        label="Voir"
        icon={Eye}
      />

      <ActionLink
        href={`/central/pastors/${pastorId}/edit`}
        label="Modifier"
        icon={Pencil}
      />

      <ActionButton
        label="Désactiver"
        icon={Power}
        onClick={() => updateStatus("inactive")}
      />

      <ActionButton
        label="Archiver"
        icon={Archive}
        onClick={() => updateStatus("archived")}
      />

      <ActionButton
        label="Supprimer"
        icon={Trash2}
        danger
        onClick={deletePastor}
      />
    </div>
  );
}

function ActionLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: any;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:border-[var(--louange-purple)] hover:text-[var(--louange-purple)]"
    >
      <Icon size={14} />
      <span>{label}</span>
    </Link>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        danger
          ? "inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-100"
          : "inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:border-[var(--louange-purple)] hover:text-[var(--louange-purple)]"
      }
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}
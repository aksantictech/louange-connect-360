"use client";

import Link from "next/link";
import { Archive, Eye, Pencil, Power, Trash2 } from "lucide-react";

type CrudActionsProps = {
  viewHref?: string;
  editHref?: string;
  onDisable?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  disableLabel?: string;
};

export default function CrudActions({
  viewHref,
  editHref,
  onDisable,
  onArchive,
  onDelete,
  disableLabel = "Désactiver",
}: CrudActionsProps) {
  function confirmAndRun(message: string, action?: () => void) {
    if (!action) return;

    const confirmed = window.confirm(message);

    if (confirmed) {
      action();
    }
  }

  return (
    <div className="flex items-center gap-2">
      {viewHref ? (
        <ActionLink href={viewHref} label="Voir" icon={Eye} />
      ) : null}

      {editHref ? (
        <ActionLink href={editHref} label="Modifier" icon={Pencil} />
      ) : null}

      {onDisable ? (
        <ActionButton
          label={disableLabel}
          icon={Power}
          onClick={() =>
            confirmAndRun("Confirmer la désactivation ?", onDisable)
          }
        />
      ) : null}

      {onArchive ? (
        <ActionButton
          label="Archiver"
          icon={Archive}
          onClick={() =>
            confirmAndRun("Confirmer l’archivage ?", onArchive)
          }
        />
      ) : null}

      {onDelete ? (
        <ActionButton
          label="Supprimer"
          icon={Trash2}
          danger
          onClick={() =>
            confirmAndRun(
              "Confirmer la suppression définitive ? Cette action est irréversible.",
              onDelete
            )
          }
        />
      ) : null}
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
      <span className="hidden xl:inline">{label}</span>
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
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}
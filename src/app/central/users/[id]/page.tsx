import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type LinkedCell = {
  name: string | null;
  code: string | null;
  country: string | null;
  city: string | null;
};

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  access_level: string | null;
  status: string | null;
  assigned_cell_id: string | null;
  cells: LinkedCell | LinkedCell[] | null;
};

function normalizeLinkedCell(
  cells: LinkedCell | LinkedCell[] | null | undefined
): LinkedCell | null {
  if (!cells) return null;
  if (Array.isArray(cells)) return cells[0] || null;
  return cells;
}

function formatRole(role: string | null) {
  if (!role) return "-";

  const labels: Record<string, string> = {
    super_admin: "Super administrateur",
    admin_central: "Administrateur central",
    pasteur_visionnaire: "Pasteur visionnaire",
    pasteur_principal: "Pasteur principal",
    pasteur_titulaire: "Pasteur titulaire",
    coordonnateur_finances: "Coordonnateur finances",
    logisticien: "Logisticien",
    cellule: "Utilisateur cellule",
    pasteur_cellule: "Pasteur cellule",
    tresorier_cellule: "Trésorier cellule",
    secretaire_cellule: "Secrétaire cellule",
    serviteur: "Serviteur",
  };

  return labels[role] || role;
}

function formatStatus(status: string | null) {
  if (!status) return "-";

  const labels: Record<string, string> = {
    active: "Actif",
    inactive: "Inactif",
    archived: "Archivé",
  };

  return labels[status] || status;
}

export default async function UserDetailsPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, access_level, status, assigned_cell_id, cells:assigned_cell_id(name, code, country, city)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div>
        <PageHeader
          title="Détail utilisateur"
          description="Informations du compte et rattachement éventuel à une cellule."
          action={
            <Link
              href="/central/users"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm"
            >
              <ArrowLeft size={18} />
              Retour
            </Link>
          }
        />

        <div className="rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700">
          {error?.message || "Utilisateur introuvable."}
        </div>
      </div>
    );
  }

  const user = data as UserProfile;
  const linkedCell = normalizeLinkedCell(user.cells);

  return (
    <div>
      <PageHeader
        title="Détail utilisateur"
        description="Informations du compte et rattachement éventuel à une cellule."
        action={
          <Link
            href="/central/users"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm"
          >
            <ArrowLeft size={18} />
            Retour
          </Link>
        }
      />

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--louange-purple)] text-white">
            <UserRound size={34} />
          </div>

          <div>
            <h3 className="text-2xl font-black text-gray-950">
              {user.full_name || "-"}
            </h3>

            <p className="text-sm font-semibold text-gray-500">
              {user.email || "-"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--louange-gold-soft)] px-3 py-1 text-xs font-black text-[var(--louange-purple)]">
                {formatRole(user.role)}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  user.status === "active"
                    ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                    : user.status === "archived"
                      ? "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
                      : "bg-red-50 text-red-700 ring-1 ring-red-200"
                }`}
              >
                {formatStatus(user.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Info label="Nom complet" value={user.full_name || "-"} />
          <Info label="Email" value={user.email || "-"} />
          <Info label="Rôle" value={formatRole(user.role)} />
          <Info label="Niveau d’accès" value={user.access_level || "-"} />
          <Info label="Statut" value={formatStatus(user.status)} />

          <Info
            label="Cellule rattachée"
            value={
              linkedCell
                ? `${linkedCell.name || "-"} (${linkedCell.code || "-"})`
                : "Non rattaché"
            }
          />

          <Info
            label="Pays"
            value={linkedCell?.country || "-"}
          />

          <Info
            label="Ville"
            value={linkedCell?.city || "-"}
          />
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-sm font-bold text-gray-500">{label}</p>
      <p className="mt-1 break-words font-black text-gray-950">{value}</p>
    </div>
  );
}
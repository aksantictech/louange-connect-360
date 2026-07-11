import Link from "next/link";
import { Plus, UserRound, Users } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase/client";
import UserActions from "@/components/users/UserActions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { data: users, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, status, assigned_cell_id, cells:assigned_cell_id(name, code, country, city)"
    )
    .order("full_name", { ascending: true });

  const list = users || [];

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description="Gestion des accès : central, finances, logistique et utilisateurs rattachés aux cellules."
        action={
          <Link
            href="/central/users/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--louange-gold)] px-5 py-3 text-sm font-black text-black shadow-sm transition hover:scale-[1.02]"
          >
            <Plus size={18} />
            Créer un utilisateur
          </Link>
        }
      />

      {error ? (
        <div className="mb-6 rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700">
          Erreur Supabase : {error.message}
        </div>
      ) : null}

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-black text-gray-950">
              Liste des utilisateurs
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {list.length} utilisateur(s) enregistré(s).
            </p>
          </div>

          <Link
            href="/central/users/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white shadow-sm"
          >
            <Plus size={18} />
            Nouvel utilisateur
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-[var(--louange-bg)] p-10 text-center">
            <Users size={44} className="mx-auto text-[var(--louange-purple)]" />

            <h3 className="mt-4 text-xl font-black text-gray-950">
              Aucun utilisateur
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Créez le premier utilisateur central ou utilisateur rattaché à une cellule.
            </p>

            <Link
              href="/central/users/new"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--louange-gold)] px-5 py-3 text-sm font-black text-black shadow-sm"
            >
              <Plus size={18} />
              Créer un utilisateur
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-gray-100 lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-[var(--louange-purple-dark)] text-white">
                    <tr>
                      <Th>Utilisateur</Th>
                      <Th>Email</Th>
                      <Th>Rôle</Th>
                      <Th>Cellule rattachée</Th>
                      <Th>Localisation</Th>
                      <Th>Statut</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {list.map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <Td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--louange-purple)] text-sm font-black text-white">
                              {(user.full_name || user.email || "LC")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-black text-gray-950">
                                {user.full_name || "-"}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID profil actif
                              </p>
                            </div>
                          </div>
                        </Td>

                        <Td>{user.email || "-"}</Td>

                        <Td>
                          <RoleBadge role={user.role} />
                        </Td>

                        <Td>
                          {user.cells
                            ? `${user.cells.name} (${user.cells.code})`
                            : "Non rattaché"}
                        </Td>

                        <Td>
                          {user.cells
                            ? `${user.cells.country || "-"} / ${user.cells.city || "-"}`
                            : "-"}
                        </Td>

                        <Td>
                          <StatusBadge status={user.status} />
                        </Td>
                        <Td>
  <UserActions
    userId={user.id}
    userName={user.full_name || user.email || "Utilisateur"}
    userRole={user.role}
  />
</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {list.map((user: any) => (
                <div
                  key={user.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--louange-purple)] text-sm font-black text-white">
                      {(user.full_name || user.email || "LC")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-gray-950">
                        {user.full_name || "-"}
                      </p>
                      <p className="break-all text-sm text-gray-500">
                        {user.email || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p>
                      <strong>Rôle :</strong> {user.role || "-"}
                    </p>

                    <p>
                      <strong>Cellule :</strong>{" "}
                      {user.cells
                        ? `${user.cells.name} (${user.cells.code})`
                        : "Non rattaché"}
                    </p>

                    <p>
                      <strong>Statut :</strong> {user.status || "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function RoleBadge({ role }: { role?: string | null }) {
  const label = role || "-";

  return (
    <span className="inline-flex rounded-full bg-[var(--louange-gold-soft)] px-3 py-1 text-xs font-black text-[var(--louange-purple)]">
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const isActive = status === "active";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        isActive
          ? "bg-green-50 text-green-700 ring-1 ring-green-200"
          : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
      }`}
    >
      {status || "-"}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-black uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700">
      {children}
    </td>
  );
}
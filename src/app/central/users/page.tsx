import Link from "next/link";
import { Plus, Users } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status, assigned_cell_id, cells:assigned_cell_id(name, code, country, city)")
    .order("full_name", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description="Gestion des accès : central, finances, logistique et utilisateurs rattachés aux cellules."
        action={
          <Link
            href="/central/users/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-gold)] px-5 py-3 text-sm font-black text-black shadow-sm"
          >
            <Plus size={18} />
            Créer un utilisateur
          </Link>
        }
      />

      {error ? (
        <div className="mb-6 rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700">
          {error.message}
        </div>
      ) : null}

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        {(users || []).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-[var(--louange-bg)] p-10 text-center">
            <Users size={44} className="mx-auto text-[var(--louange-purple)]" />
            <h3 className="mt-4 text-xl font-black text-gray-950">
              Aucun utilisateur
            </h3>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[var(--louange-purple-dark)] text-white">
                  <tr>
                    <Th>Nom</Th>
                    <Th>Email</Th>
                    <Th>Rôle</Th>
                    <Th>Cellule rattachée</Th>
                    <Th>Statut</Th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {(users || []).map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <Td>{user.full_name || "-"}</Td>
                      <Td>{user.email || "-"}</Td>
                      <Td>{user.role || "-"}</Td>
                      <Td>
                        {user.cells
                          ? `${user.cells.name} (${user.cells.code})`
                          : "Non rattaché"}
                      </Td>
                      <Td>{user.status || "-"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
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
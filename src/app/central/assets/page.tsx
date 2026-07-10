import { Building2, Landmark, PackageCheck, Wallet } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const { data: assets } = await supabase
    .from("assets")
    .select("*, cells(name, code)")
    .order("created_at", { ascending: false });

  const list = assets || [];

  const totalAssets = list.length;

  const totalEstimatedValue = list.reduce(
    (sum: number, asset: any) => sum + Number(asset.estimated_value || 0),
    0
  );

  const buildings = list.filter((asset: any) =>
    ["temple", "parcelle", "maison", "terrain", "bureau"].includes(
      String(asset.category || "").toLowerCase()
    )
  ).length;

  return (
    <div>
      <PageHeader
        title="Dashboard Patrimoine"
        description="Suivi des biens immobiliers, mobiliers, matériels, équipements et valeurs patrimoniales."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Biens enregistrés"
          value={String(totalAssets)}
          subtitle="Patrimoine total"
          icon={PackageCheck}
          tone="purple"
        />

        <StatCard
          title="Immobilier"
          value={String(buildings)}
          subtitle="Temples, parcelles, maisons"
          icon={Landmark}
          tone="gold"
        />

        <StatCard
          title="Valeur estimée"
          value={`${totalEstimatedValue.toLocaleString("fr-FR")} USD`}
          subtitle="À affiner par devise"
          icon={Wallet}
          tone="green"
        />

        <StatCard
          title="Autres biens"
          value={String(totalAssets - buildings)}
          subtitle="Mobilier, matériel, équipements"
          icon={Building2}
          tone="red"
        />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h3 className="text-xl font-black text-gray-950">
          Liste du patrimoine
        </h3>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[var(--louange-purple-dark)] text-white">
                <tr>
                  <Th>Bien</Th>
                  <Th>Catégorie</Th>
                  <Th>Cellule</Th>
                  <Th>Localisation</Th>
                  <Th>Valeur</Th>
                  <Th>État</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {list.map((asset: any) => (
                  <tr key={asset.id}>
                    <Td>{asset.name}</Td>
                    <Td>{asset.category}</Td>
                    <Td>{asset.cells?.name || "Central / Non affecté"}</Td>
                    <Td>{asset.location || "-"}</Td>
                    <Td>
                      {Number(asset.estimated_value || 0).toLocaleString("fr-FR")}{" "}
                      {asset.currency || "USD"}
                    </Td>
                    <Td>{asset.condition || "Non renseigné"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
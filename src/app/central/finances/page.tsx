import { Clock, TrendingUp, Wallet } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import FinanceReportForm from "@/components/finances/FinanceReportForm";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function FinancesPage() {
  const { data: reports } = await supabase
    .from("finance_reports")
    .select("*, cells(name, code)")
    .order("activity_date", { ascending: false });

  const list = reports || [];

  const totalCdf = list.reduce(
    (sum: number, item: any) => sum + Number(item.total_cdf || 0),
    0
  );

  const totalUsd = list.reduce(
    (sum: number, item: any) => sum + Number(item.total_usd || 0),
    0
  );

  const pending = list.filter((item: any) => item.status === "pending").length;

  return (
    <div>
      <PageHeader
        title="Rapports financiers"
        description="Saisie séparée des recettes financières par activité : offrandes, dîmes, construction, soutien et autres."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total FC"
          value={`${totalCdf.toLocaleString("fr-FR")} FC`}
          subtitle="Toutes recettes saisies"
          icon={TrendingUp}
          tone="green"
        />

        <StatCard
          title="Equivalent USD"
          value={`${totalUsd.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} USD`}
          subtitle="Conversion selon taux paramètres"
          icon={Wallet}
          tone="purple"
        />

        <StatCard
          title="En attente"
          value={String(pending)}
          subtitle="Rapports à valider"
          icon={Clock}
          tone="gold"
        />
      </section>

      <div className="mt-6">
        <FinanceReportForm />
      </div>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h3 className="text-xl font-black text-gray-950">
          Derniers rapports financiers
        </h3>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[var(--louange-purple-dark)] text-white">
                <tr>
                  <Th>Date</Th>
                  <Th>Cellule</Th>
                  <Th>Activité</Th>
                  <Th>Total FC</Th>
                  <Th>Total USD</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {list.map((report: any) => (
                  <tr key={report.id}>
                    <Td>{report.activity_date}</Td>
                    <Td>{report.cells?.name || "Non renseignée"}</Td>
                    <Td>{report.activity_name}</Td>
                    <Td>{Number(report.total_cdf || 0).toLocaleString("fr-FR")} FC</Td>
                    <Td>
                      {Number(report.total_usd || 0).toLocaleString("fr-FR", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      USD
                    </Td>
                    <Td>{report.status}</Td>
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
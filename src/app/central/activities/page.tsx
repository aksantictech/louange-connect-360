import PageHeader from "@/components/layout/PageHeader";
import ActivityForm from "@/components/activities/ActivityForm";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const { data: activities } = await supabase
    .from("activities")
    .select("*, cells(name, code)")
    .order("activity_date", { ascending: false })
    .limit(20);

  return (
    <div>
      <PageHeader
        title="Activités des églises"
        description="Encodez les cultes du dimanche, activités de semaine, participations, intervenants et recettes."
      />

      <ActivityForm />

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h3 className="text-xl font-black text-gray-950">
          Dernières activités
        </h3>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[var(--louange-purple-dark)] text-white">
                <tr>
                  <Th>Date</Th>
                  <Th>Cellule</Th>
                  <Th>Type</Th>
                  <Th>Intervenant</Th>
                  <Th>Participants</Th>
                  <Th>Recettes</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {(activities || []).map((activity: any) => (
                  <tr key={activity.id}>
                    <Td>{activity.activity_date}</Td>
                    <Td>{activity.cells?.name || "Non renseignée"}</Td>
                    <Td>{activity.activity_type}</Td>
                    <Td>{activity.speaker_name || "-"}</Td>
                    <Td>{activity.participants_count || 0}</Td>
                    <Td>
                      {Number(activity.income_amount || 0).toLocaleString("fr-FR")}{" "}
                      {activity.currency || "CDF"}
                    </Td>
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
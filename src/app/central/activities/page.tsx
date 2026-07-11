import PageHeader from "@/components/layout/PageHeader";
import ActivityForm from "@/components/activities/ActivityForm";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const { data: activities, error } = await supabase
    .from("activities")
    .select("*, cells(name, code, country, city)")
    .order("activity_date", { ascending: false })
    .limit(20);

  const list = activities || [];

  return (
    <div>
      <PageHeader
        title="Activités des églises"
        description="Rapports d’activités : cultes, séminaires, réunions, participation, présences et observations."
      />

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Erreur Supabase : {error.message}
        </div>
      ) : null}

      <CollapsibleSection
        title="Nouveau rapport d’activité"
        description="Cliquez pour encoder un culte, une réunion, un séminaire ou une autre activité."
        buttonLabel="Ajouter un nouveau rapport"
      >
        <ActivityForm />
      </CollapsibleSection>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-black text-gray-950">
              Dernières activités
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {list.length} rapport(s) affiché(s).
            </p>
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-gray-100 lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[var(--louange-purple-dark)] text-white">
                <tr>
                  <Th>Date</Th>
                  <Th>Cellule</Th>
                  <Th>Type</Th>
                  <Th>Intervenant</Th>
                  <Th>Présence totale</Th>
                  <Th>Nouveaux</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {list.map((activity: any) => {
                  const totalAttendance =
                    Number(activity.total_attendance || 0) ||
                    Number(activity.participants_count || 0);

                  const newPeople =
                    Number(activity.new_converts_count || 0) +
                    Number(activity.new_visitors_count || 0);

                  return (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <Td>{activity.activity_date || "-"}</Td>

                      <Td>
                        <p className="font-black text-gray-950">
                          {activity.cells?.name || "Non renseignée"}
                        </p>
                        <p className="text-xs font-bold text-[var(--louange-purple)]">
                          {activity.cells?.code || ""}
                        </p>
                      </Td>

                      <Td>
                        <p>{activity.activity_type || "-"}</p>
                        <p className="text-xs text-gray-500">
                          {activity.activity_title || ""}
                        </p>
                      </Td>

                      <Td>{activity.speaker_name || "-"}</Td>

                      <Td>{totalAttendance}</Td>

                      <Td>{newPeople}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 lg:hidden">
          {list.map((activity: any) => {
            const totalAttendance =
              Number(activity.total_attendance || 0) ||
              Number(activity.participants_count || 0);

            const newPeople =
              Number(activity.new_converts_count || 0) +
              Number(activity.new_visitors_count || 0);

            return (
              <div
                key={activity.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-gray-950">
                      {activity.activity_type || "Activité"}
                    </p>
                    <p className="text-sm font-semibold text-gray-500">
                      {activity.activity_date || "-"}
                    </p>
                  </div>

                  <span className="rounded-full bg-[var(--louange-gold-soft)] px-3 py-1 text-xs font-black text-[var(--louange-purple)]">
                    {totalAttendance} pers.
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>Cellule :</strong>{" "}
                    {activity.cells?.name || "Non renseignée"}
                  </p>
                  <p>
                    <strong>Intervenant :</strong>{" "}
                    {activity.speaker_name || "-"}
                  </p>
                  <p>
                    <strong>Nouveaux :</strong> {newPeople}
                  </p>
                </div>
              </div>
            );
          })}
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
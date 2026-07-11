import PrintButton from "@/components/ui/PrintButton";
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
    .limit(50);

  const list = activities || [];

  const totalAttendance = list.reduce((sum: number, activity: any) => {
    return (
      sum +
      (Number(activity.total_attendance || 0) ||
        Number(activity.participants_count || 0))
    );
  }, 0);

  const totalNewPeople = list.reduce((sum: number, activity: any) => {
    return (
      sum +
      Number(activity.new_converts_count || 0) +
      Number(activity.new_visitors_count || 0)
    );
  }, 0);

  return (
    <div>
      <PageHeader
        title="Activités des églises"
        description="Rapports d’activités : cultes, séminaires, réunions, participation, présences et observations."
        action={
          <PrintButton
            label="Imprimer activités"
            title="Rapport des activités - Louange Connect 360"
          />
        }
      />

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Erreur Supabase : {error.message}
        </div>
      ) : null}

      <div className="no-print">
        <CollapsibleSection
          title="Nouveau rapport d’activité"
          description="Cliquez pour encoder un culte, une réunion, un séminaire ou une autre activité."
          buttonLabel="Ajouter un nouveau rapport"
        >
          <ActivityForm />
        </CollapsibleSection>
      </div>

      <div id="printable-report">
        <div className="print-only mb-6 border-b pb-4">
          <h1 className="text-2xl font-black">Louange Connect 360</h1>
          <p className="text-sm">
            Rapport des activités généré le{" "}
            {new Date().toLocaleDateString("fr-FR")}
          </p>
          <p className="text-sm">
            Total activités : {list.length} | Présence totale :{" "}
            {totalAttendance} | Nouveaux : {totalNewPeople}
          </p>
        </div>

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
                  {list.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm font-semibold text-gray-500"
                      >
                        Aucune activité enregistrée.
                      </td>
                    </tr>
                  ) : (
                    list.map((activity: any) => {
                      const activityTotalAttendance =
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

                          <Td>{activityTotalAttendance}</Td>

                          <Td>{newPeople}</Td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 lg:hidden">
            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500">
                Aucune activité enregistrée.
              </div>
            ) : (
              list.map((activity: any) => {
                const activityTotalAttendance =
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
                        {activityTotalAttendance} pers.
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
              })
            )}
          </div>
        </section>
      </div>
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
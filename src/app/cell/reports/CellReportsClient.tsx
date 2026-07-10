"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase/client";

export default function CellReportsClient() {
  const [activities, setActivities] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadReports() {
      const { data: authData } = await supabase.auth.getUser();

      const user = authData.user;

      if (!user) {
        setErrorMessage("Utilisateur non connecté.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("assigned_cell_id")
        .eq("id", user.id)
        .single();

      if (!profile?.assigned_cell_id) {
        setErrorMessage("Aucune cellule rattachée.");
        return;
      }

      const cellId = profile.assigned_cell_id;

      const { data: activitiesData } = await supabase
        .from("activities")
        .select("*")
        .eq("cell_id", cellId)
        .order("activity_date", { ascending: false });

      const { data: financesData } = await supabase
        .from("finance_reports")
        .select("*")
        .eq("cell_id", cellId)
        .order("activity_date", { ascending: false });

      setActivities(activitiesData || []);
      setFinances(financesData || []);
    }

    loadReports();
  }, []);

  return (
    <div>
      <PageHeader
        title="Rapports de la cellule"
        description="Vue consolidée des activités et rapports financiers de votre cellule."
      />

      {errorMessage ? (
        <div className="rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="text-xl font-black text-gray-950">
            Rapports d’activités
          </h3>

          <div className="mt-4 space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="font-black text-gray-950">
                  {activity.activity_type} — {activity.activity_date}
                </p>
                <p className="text-sm text-gray-500">
                  Présence totale : {activity.total_attendance || activity.participants_count || 0}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="text-xl font-black text-gray-950">
            Rapports financiers
          </h3>

          <div className="mt-4 space-y-3">
            {finances.map((finance) => (
              <div
                key={finance.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="font-black text-gray-950">
                  {finance.activity_name} — {finance.activity_date}
                </p>
                <p className="text-sm text-gray-500">
                  Total : {Number(finance.total_cdf || 0).toLocaleString("fr-FR")} FC
                </p>
                <p className="text-sm text-gray-500">
                  Statut : {finance.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
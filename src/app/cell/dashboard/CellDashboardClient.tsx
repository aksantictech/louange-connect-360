"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Church, TrendingUp, Wallet } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase/client";

type Cell = {
  id: string;
  name: string;
  code: string;
  country: string | null;
  city: string | null;
};

export default function CellDashboardClient() {
  const [cell, setCell] = useState<Cell | null>(null);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [financeTotal, setFinanceTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: authData } = await supabase.auth.getUser();

      const user = authData.user;

      if (!user) {
        setErrorMessage("Utilisateur non connecté.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, assigned_cell_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.assigned_cell_id) {
        setErrorMessage("Aucune cellule n’est rattachée à ce compte utilisateur.");
        return;
      }

      const cellId = profile.assigned_cell_id;

      const { data: cellData, error: cellError } = await supabase
        .from("cells")
        .select("id, name, code, country, city")
        .eq("id", cellId)
        .single();

      if (cellError || !cellData) {
        setErrorMessage("Cellule rattachée introuvable.");
        return;
      }

      setCell(cellData as Cell);

      const { data: activities } = await supabase
        .from("activities")
        .select("id, total_attendance, participants_count")
        .eq("cell_id", cellId);

      const { data: financeReports } = await supabase
        .from("finance_reports")
        .select("id, total_cdf")
        .eq("cell_id", cellId);

      setActivitiesCount(activities?.length || 0);

      const totalParticipants = (activities || []).reduce(
        (sum: number, item: any) => {
          const attendance =
            Number(item.total_attendance || 0) ||
            Number(item.participants_count || 0);

          return sum + attendance;
        },
        0
      );

      setParticipants(totalParticipants);

      const totalFinance = (financeReports || []).reduce(
        (sum: number, item: any) => {
          return sum + Number(item.total_cdf || 0);
        },
        0
      );

      setFinanceTotal(totalFinance);
    }

    loadData();
  }, []);

  return (
    <div>
      <PageHeader
        title={cell ? `Dashboard cellule - ${cell.name}` : "Dashboard cellule"}
        description="Vue limitée aux données de la cellule rattachée à votre compte."
      />

      {errorMessage ? (
        <div className="rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {cell ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Cellule"
            value={cell.code}
            subtitle={`${cell.country || ""} ${cell.city || ""}`}
            icon={Church}
            tone="purple"
          />

          <StatCard
            title="Activités"
            value={String(activitiesCount)}
            subtitle="Rapports encodés"
            icon={CalendarCheck}
            tone="gold"
          />

          <StatCard
            title="Participants"
            value={String(participants)}
            subtitle="Cumul enregistré"
            icon={TrendingUp}
            tone="green"
          />

          <StatCard
            title="Recettes déclarées"
            value={`${financeTotal.toLocaleString("fr-FR")} FC`}
            subtitle="Rapports financiers"
            icon={Wallet}
            tone="purple"
          />
        </section>
      ) : null}
    </div>
  );
}
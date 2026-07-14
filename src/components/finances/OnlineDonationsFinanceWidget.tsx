"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartHandshake, Wallet } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase/client";

export default function OnlineDonationsFinanceWidget() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from("online_donations")
      .select("amount_cdf, amount_usd, status")
      .in("status", ["paid", "validated"]);

    setItems(data || []);
  }

  const totalCdf = items.reduce(
    (sum, item) => sum + Number(item.amount_cdf || 0),
    0
  );

  const totalUsd = items.reduce(
    (sum, item) => sum + Number(item.amount_usd || 0),
    0
  );

  const validatedCount = items.filter(
    (item) => item.status === "validated"
  ).length;

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-black text-gray-950">
            Dons en ligne
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Données importées depuis la page publique de dons.
          </p>
        </div>

        <Link
          href="/central/finances/online-donations"
          className="inline-flex items-center justify-center rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white"
        >
          Gérer les dons en ligne
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total dons en ligne"
          value={`${totalCdf.toLocaleString("fr-FR")} FC`}
          subtitle="Payés + validés"
          icon={HeartHandshake}
          tone="green"
        />

        <StatCard
          title="Équivalent USD"
          value={`${totalUsd.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} USD`}
          subtitle="Conversion indicative"
          icon={Wallet}
          tone="purple"
        />

        <StatCard
          title="Dons validés"
          value={String(validatedCount)}
          subtitle="Contrôlés par finance"
          icon={HeartHandshake}
          tone="gold"
        />
      </div>
    </section>
  );
}
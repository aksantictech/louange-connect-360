"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [rate, setRate] = useState("2200");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadRate() {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "usd_cdf_rate")
        .single();

      if (data?.value) {
        setRate(data.value);
      }
    }

    loadRate();
  }, []);

  async function saveRate() {
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.from("app_settings").upsert({
      key: "usd_cdf_rate",
      value: rate,
      description:
        "Taux de conversion utilisé pour convertir les francs congolais en dollars américains.",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Taux de conversion mis à jour.");
  }

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Réglages généraux de Louange Connect 360."
      />

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
            {message}
          </div>
        ) : null}

        <h3 className="text-xl font-black text-gray-950">
          Taux de conversion
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Valeur utilisée dans les rapports financiers. Par défaut : 1 USD = 2200 FC.
        </p>

        <div className="mt-5 max-w-md">
          <label className="mb-2 block text-sm font-bold text-gray-800">
            1 USD équivaut à combien de FC ?
          </label>

          <input
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
          />

          <button
            type="button"
            onClick={saveRate}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white"
          >
            <Save size={18} />
            Enregistrer
          </button>
        </div>
      </section>
    </div>
  );
}
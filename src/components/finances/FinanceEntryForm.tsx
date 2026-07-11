"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Cell = {
  id: string;
  name: string;
  code: string;
  country: string | null;
  city: string | null;
};

type EntryLine = {
  category: string;
  description: string;
  amount_cdf: string;
};

const defaultLines: EntryLine[] = [
  { category: "offrandes", description: "Offrandes", amount_cdf: "" },
  { category: "dimes", description: "Dîmes", amount_cdf: "" },
  { category: "construction", description: "Construction", amount_cdf: "" },
  { category: "soutien", description: "Soutien", amount_cdf: "" },
  { category: "autres", description: "Autres entrées", amount_cdf: "" },
];

const activityNames = [
  "Culte dimanche",
  "Culte semaine",
  "Séminaire",
  "Conférence",
  "Réunion de prière",
  "Évangélisation",
  "Don spécial",
  "Soutien",
  "Autres",
];

export default function FinanceEntryForm() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [usdRate, setUsdRate] = useState(2200);

  const [form, setForm] = useState({
    cell_id: "",
    source_type: "activite",
    activity_name: "Culte dimanche",
    activity_date: "",
    observations: "",
  });

  const [lines, setLines] = useState<EntryLine[]>(defaultLines);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: cellsData } = await supabase
        .from("cells")
        .select("id, name, code, country, city")
        .order("name", { ascending: true });

      setCells((cellsData || []) as Cell[]);

      const { data: rateData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "usd_cdf_rate")
        .single();

      if (rateData?.value) {
        setUsdRate(Number(rateData.value));
      }
    }

    loadData();
  }, []);

  const totalCdf = useMemo(() => {
    return lines.reduce((sum, line) => {
      const value = Number(line.amount_cdf || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
  }, [lines]);

  const totalUsd = usdRate > 0 ? totalCdf / usdRate : 0;

  function updateForm(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateLine(index: number, field: keyof EntryLine, value: string) {
    setLines((current) =>
      current.map((line, currentIndex) =>
        currentIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function addLine() {
    setLines((current) => [
      ...current,
      { category: "autres", description: "", amount_cdf: "" },
    ]);
  }

  function removeLine(index: number) {
    setLines((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!form.cell_id || !form.activity_date) {
      setErrorMessage("La cellule et la date sont obligatoires.");
      return;
    }

    const validLines = lines
      .filter((line) => Number(line.amount_cdf || 0) > 0)
      .map((line) => {
        const amountCdf = Number(line.amount_cdf || 0);

        return {
          category: line.category,
          description: line.description || line.category,
          amount_cdf: amountCdf,
          amount_usd: usdRate > 0 ? amountCdf / usdRate : 0,
        };
      });

    if (validLines.length === 0) {
      setErrorMessage("Ajoute au moins une ligne d’entrée avec un montant.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();

    const { data: report, error: reportError } = await supabase
      .from("finance_reports")
      .insert({
        cell_id: form.cell_id,
        source_type: form.source_type,
        activity_name: form.activity_name,
        activity_date: form.activity_date,
        currency: "CDF",
        usd_cdf_rate: usdRate,
        total_cdf: totalCdf,
        total_usd: totalUsd,
        observations: form.observations || null,
        status: "pending",
        submitted_by: authData.user?.id || null,
      })
      .select("id")
      .single();

    if (reportError) {
      setErrorMessage(reportError.message);
      return;
    }

    const { error: linesError } = await supabase
      .from("finance_report_lines")
      .insert(validLines.map((line) => ({ ...line, report_id: report.id })));

    if (linesError) {
      setErrorMessage(linesError.message);
      return;
    }

    setMessage("Entrée financière enregistrée avec succès.");
    setLines(defaultLines);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
    >
      <h3 className="text-xl font-black text-gray-950">
        Entrées / Recettes
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Recettes par activité ou autres entrées financières.
      </p>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Select
          label="Cellule"
          value={form.cell_id}
          onChange={(value) => updateForm("cell_id", value)}
          options={cells.map((cell) => ({
            value: cell.id,
            label: `${cell.name} (${cell.code}) - ${cell.country || ""} ${cell.city || ""}`,
          }))}
        />

        <Select
          label="Type d’entrée"
          value={form.source_type}
          onChange={(value) => updateForm("source_type", value)}
          options={[
            { value: "activite", label: "Recette par activité" },
            { value: "autre_entree", label: "Autre entrée" },
          ]}
        />

        <Select
          label="Nom de l’activité / entrée"
          value={form.activity_name}
          onChange={(value) => updateForm("activity_name", value)}
          options={activityNames.map((item) => ({ value: item, label: item }))}
        />

        <Input
          label="Date"
          type="date"
          value={form.activity_date}
          onChange={(value) => updateForm("activity_date", value)}
        />
      </div>

      <div className="mt-5 space-y-3">
        {lines.map((line, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-[200px_1fr_180px_auto]"
          >
            <Input
              label="Catégorie"
              value={line.category}
              onChange={(value) => updateLine(index, "category", value)}
            />

            <Input
              label="Description"
              value={line.description}
              onChange={(value) => updateLine(index, "description", value)}
            />

            <Input
              label="Montant FC"
              value={line.amount_cdf}
              onChange={(value) => updateLine(index, "amount_cdf", value)}
            />

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removeLine(index)}
                className="rounded-2xl border border-red-200 bg-red-50 p-3 text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addLine}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--louange-purple)] px-5 py-3 text-sm font-black text-[var(--louange-purple)]"
      >
        <Plus size={18} />
        Ajouter une ligne
      </button>

      <div className="mt-5 rounded-3xl bg-[var(--louange-purple-dark)] p-5 text-white">
        <p className="text-sm font-bold text-white/70">Total recettes</p>
        <p className="text-3xl font-black">
          {totalCdf.toLocaleString("fr-FR")} FC
        </p>
        <p className="mt-2 text-xl font-black text-[var(--louange-gold)]">
          {totalUsd.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} USD
        </p>
      </div>

      <Textarea
        label="Observations"
        value={form.observations}
        onChange={(value) => updateForm("observations", value)}
      />

      <button
        type="submit"
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white"
      >
        <Save size={18} />
        Enregistrer l’entrée
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
      >
        <option value="">Sélectionner</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-5">
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      />
    </div>
  );
}
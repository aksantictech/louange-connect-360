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

type ExpenseLine = {
  label: string;
  description: string;
  amount_cdf: string;
};

const defaultLines: ExpenseLine[] = [
  { label: "Loyer", description: "Loyer / salle", amount_cdf: "" },
  { label: "Transport", description: "Transport", amount_cdf: "" },
  { label: "Communication", description: "Téléphone / Internet", amount_cdf: "" },
  { label: "Eau et électricité", description: "Eau et électricité", amount_cdf: "" },
  { label: "Entretien", description: "Entretien / nettoyage", amount_cdf: "" },
  { label: "Assistance", description: "Assistance sociale", amount_cdf: "" },
  { label: "Matériel", description: "Achat matériel", amount_cdf: "" },
  { label: "Autres", description: "Autres dépenses", amount_cdf: "" },
];

export default function FinanceExpenseForm() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [usdRate, setUsdRate] = useState(2200);

  const [form, setForm] = useState({
    cell_id: "",
    expense_date: "",
    observations: "",
  });

  const [lines, setLines] = useState<ExpenseLine[]>(defaultLines);
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

  function updateLine(index: number, field: keyof ExpenseLine, value: string) {
    setLines((current) =>
      current.map((line, currentIndex) =>
        currentIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function addLine() {
    setLines((current) => [
      ...current,
      { label: "Autres", description: "", amount_cdf: "" },
    ]);
  }

  function removeLine(index: number) {
    setLines((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  function firstDayOfMonth(dateValue: string) {
    if (!dateValue) return "";
    return `${dateValue.slice(0, 7)}-01`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!form.cell_id || !form.expense_date) {
      setErrorMessage("La cellule et la date de dépense sont obligatoires.");
      return;
    }

    const validLines = lines
      .filter((line) => Number(line.amount_cdf || 0) > 0)
      .map((line) => {
        const amountCdf = Number(line.amount_cdf || 0);

        return {
          label: line.label,
          description: line.description || line.label,
          amount_cdf: amountCdf,
          amount_usd: usdRate > 0 ? amountCdf / usdRate : 0,
        };
      });

    if (validLines.length === 0) {
      setErrorMessage("Ajoute au moins une dépense avec un montant.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();

    const { data: report, error: reportError } = await supabase
      .from("finance_expense_reports")
      .insert({
        cell_id: form.cell_id,
        expense_date: form.expense_date,
        report_month: firstDayOfMonth(form.expense_date),
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
      .from("finance_expense_lines")
      .insert(validLines.map((line) => ({ ...line, report_id: report.id })));

    if (linesError) {
      setErrorMessage(linesError.message);
      return;
    }

    setMessage("Dépense enregistrée avec succès.");
    setLines(defaultLines);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
    >
      <h3 className="text-xl font-black text-gray-950">Dépenses</h3>
      <p className="mt-1 text-sm text-gray-500">
        Dépenses par cellule avec date et libellés détaillés.
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

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Select
          label="Cellule"
          value={form.cell_id}
          onChange={(value) => updateForm("cell_id", value)}
          options={cells.map((cell) => ({
            value: cell.id,
            label: `${cell.name} (${cell.code}) - ${cell.country || ""} ${cell.city || ""}`,
          }))}
        />

        <Input
          label="Date de dépense"
          type="date"
          value={form.expense_date}
          onChange={(value) => updateForm("expense_date", value)}
        />
      </div>

      <div className="mt-5 space-y-3">
        {lines.map((line, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-[200px_1fr_180px_auto]"
          >
            <Input
              label="Libellé"
              value={line.label}
              onChange={(value) => updateLine(index, "label", value)}
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
        Ajouter une dépense
      </button>

      <div className="mt-5 rounded-3xl bg-[var(--louange-purple-dark)] p-5 text-white">
        <p className="text-sm font-bold text-white/70">Total dépenses</p>
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
        Enregistrer la dépense
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
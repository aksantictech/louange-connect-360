"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Save, Trash2, Wallet } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase/client";

type ExpenseLine = {
  label: string;
  description: string;
  amount_cdf: string;
};

const defaultExpenseLines: ExpenseLine[] = [
  { label: "Loyer", description: "Loyer / location salle", amount_cdf: "" },
  { label: "Transport", description: "Transport", amount_cdf: "" },
  { label: "Communication", description: "Communication / téléphone", amount_cdf: "" },
  { label: "Eau et électricité", description: "Eau et électricité", amount_cdf: "" },
  { label: "Entretien", description: "Entretien / nettoyage", amount_cdf: "" },
  { label: "Assistance", description: "Assistance sociale", amount_cdf: "" },
  { label: "Matériel", description: "Achat matériel", amount_cdf: "" },
  { label: "Autres", description: "Autres dépenses", amount_cdf: "" },
];

export default function CellFinancesClient() {
  const [cellId, setCellId] = useState("");
  const [cellName, setCellName] = useState("");
  const [userId, setUserId] = useState("");

  const [usdRate, setUsdRate] = useState(2200);

  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [expenseLines, setExpenseLines] =
    useState<ExpenseLine[]>(defaultExpenseLines);

  const [observations, setObservations] = useState("");

  const [incomeReports, setIncomeReports] = useState<any[]>([]);
  const [expenseReports, setExpenseReports] = useState<any[]>([]);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setErrorMessage("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setErrorMessage("Utilisateur non connecté.");
      return;
    }

    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("assigned_cell_id")
      .eq("id", user.id)
      .single();

    if (!profile?.assigned_cell_id) {
      setErrorMessage("Aucune cellule n’est rattachée à ce compte.");
      return;
    }

    const assignedCellId = profile.assigned_cell_id;
    setCellId(assignedCellId);

    const { data: cell } = await supabase
      .from("cells")
      .select("name, code")
      .eq("id", assignedCellId)
      .single();

    if (cell) {
      setCellName(`${cell.name} (${cell.code})`);
    }

    const { data: rateData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "usd_cdf_rate")
      .single();

    if (rateData?.value) {
      setUsdRate(Number(rateData.value));
    }

    const { data: incomes } = await supabase
      .from("finance_reports")
      .select("*")
      .eq("cell_id", assignedCellId)
      .order("activity_date", { ascending: false })
      .limit(20);

    const { data: expenses } = await supabase
      .from("finance_expense_reports")
      .select("*")
      .eq("cell_id", assignedCellId)
      .order("report_month", { ascending: false })
      .limit(20);

    setIncomeReports(incomes || []);
    setExpenseReports(expenses || []);
  }

  const totalExpenseCdf = useMemo(() => {
    return expenseLines.reduce((sum, line) => {
      const amount = Number(line.amount_cdf || 0);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);
  }, [expenseLines]);

  const totalExpenseUsd = usdRate > 0 ? totalExpenseCdf / usdRate : 0;

  const totalIncomeCdf = incomeReports.reduce(
    (sum, report) => sum + Number(report.total_cdf || 0),
    0
  );

  const previousExpensesCdf = expenseReports.reduce(
    (sum, report) => sum + Number(report.total_cdf || 0),
    0
  );

  const balanceCdf = totalIncomeCdf - previousExpensesCdf;

  function updateLine(index: number, field: keyof ExpenseLine, value: string) {
    setExpenseLines((current) =>
      current.map((line, currentIndex) =>
        currentIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function addLine() {
    setExpenseLines((current) => [
      ...current,
      { label: "Autres", description: "", amount_cdf: "" },
    ]);
  }

  function removeLine(index: number) {
    setExpenseLines((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!cellId) {
      setErrorMessage("Cellule introuvable.");
      return;
    }

    const validLines = expenseLines
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

    const reportMonthDate = `${reportMonth}-01`;

    const { data: report, error: reportError } = await supabase
      .from("finance_expense_reports")
      .insert({
        cell_id: cellId,
        report_month: reportMonthDate,
        currency: "CDF",
        usd_cdf_rate: usdRate,
        total_cdf: totalExpenseCdf,
        total_usd: totalExpenseUsd,
        status: "pending",
        observations: observations || null,
        submitted_by: userId || null,
      })
      .select("id")
      .single();

    if (reportError) {
      setErrorMessage(reportError.message);
      return;
    }

    const { error: linesError } = await supabase
      .from("finance_expense_lines")
      .insert(
        validLines.map((line) => ({
          ...line,
          report_id: report.id,
        }))
      );

    if (linesError) {
      setErrorMessage(linesError.message);
      return;
    }

    setMessage("Rapport de dépenses mensuelles enregistré avec succès.");
    setExpenseLines(defaultExpenseLines);
    setObservations("");
    loadInitialData();
  }

  return (
    <div>
      <PageHeader
        title="Finances de la cellule"
        description={`Recettes et dépenses limitées à la cellule : ${cellName || "chargement..."}`}
      />

      {errorMessage ? (
        <div className="mb-5 rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {message ? (
        <div className="mb-5 rounded-3xl bg-green-50 p-5 text-sm font-bold text-green-700">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Recettes déclarées"
          value={`${totalIncomeCdf.toLocaleString("fr-FR")} FC`}
          subtitle="Rapports financiers d'activités"
          icon={Wallet}
          tone="green"
        />

        <StatCard
          title="Dépenses déclarées"
          value={`${previousExpensesCdf.toLocaleString("fr-FR")} FC`}
          subtitle="Rapports mensuels"
          icon={Wallet}
          tone="red"
        />

        <StatCard
          title="Solde provisoire"
          value={`${balanceCdf.toLocaleString("fr-FR")} FC`}
          subtitle="Recettes - dépenses"
          icon={Wallet}
          tone={balanceCdf >= 0 ? "purple" : "red"}
        />

        <StatCard
          title="Taux USD"
          value={`1 USD = ${usdRate.toLocaleString("fr-FR")} FC`}
          subtitle="Paramètre global"
          icon={Wallet}
          tone="gold"
        />
      </section>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
      >
        <div className="mb-6 rounded-3xl border border-[var(--louange-gold)] bg-[var(--louange-bg)] p-5">
          <h3 className="text-lg font-black text-gray-950">
            Rapport des dépenses mensuelles
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Chaque cellule encode ses dépenses du mois. Le rapport sera validé au niveau central.
          </p>
        </div>

        <div className="mb-5 max-w-sm">
          <label className="mb-2 block text-sm font-bold text-gray-800">
            Mois concerné
          </label>
          <input
            type="month"
            value={reportMonth}
            onChange={(event) => setReportMonth(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="space-y-3">
          {expenseLines.map((line, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-[200px_1fr_200px_auto]"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Libellé
                </label>
                <input
                  value={line.label}
                  onChange={(event) =>
                    updateLine(index, "label", event.target.value)
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Description
                </label>
                <input
                  value={line.description}
                  onChange={(event) =>
                    updateLine(index, "description", event.target.value)
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Montant FC
                </label>
                <input
                  value={line.amount_cdf}
                  onChange={(event) =>
                    updateLine(index, "amount_cdf", event.target.value)
                  }
                  placeholder="0"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

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

        <div className="mt-6 rounded-3xl bg-[var(--louange-purple-dark)] p-5 text-white">
          <p className="text-sm font-bold text-white/70">
            Total dépenses du mois
          </p>
          <p className="text-3xl font-black">
            {totalExpenseCdf.toLocaleString("fr-FR")} FC
          </p>

          <p className="mt-3 text-sm font-bold text-white/70">
            Équivalent USD
          </p>
          <p className="text-2xl font-black text-[var(--louange-gold)]">
            {totalExpenseUsd.toLocaleString("fr-FR", {
              maximumFractionDigits: 2,
            })}{" "}
            USD
          </p>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-bold text-gray-800">
            Observations
          </label>
          <textarea
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
          />
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white"
        >
          <Save size={18} />
          Enregistrer les dépenses mensuelles
        </button>
      </form>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="text-xl font-black text-gray-950">
            Dernières recettes
          </h3>

          <div className="mt-4 space-y-3">
            {incomeReports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="font-black text-gray-950">
                  {report.activity_name} — {report.activity_date}
                </p>
                <p className="text-sm text-gray-500">
                  Total : {Number(report.total_cdf || 0).toLocaleString("fr-FR")} FC
                </p>
                <p className="text-sm text-gray-500">
                  Statut : {report.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="text-xl font-black text-gray-950">
            Dernières dépenses
          </h3>

          <div className="mt-4 space-y-3">
            {expenseReports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="font-black text-gray-950">
                  Mois : {report.report_month}
                </p>
                <p className="text-sm text-gray-500">
                  Total : {Number(report.total_cdf || 0).toLocaleString("fr-FR")} FC
                </p>
                <p className="text-sm text-gray-500">
                  Statut : {report.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Save,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase/client";

type EntryLine = {
  category: string;
  description: string;
  amount_cdf: string;
};

type ExpenseLine = {
  label: string;
  description: string;
  amount_cdf: string;
};

function makeDefaultEntryLines(): EntryLine[] {
  return [
    { category: "offrandes", description: "Offrandes", amount_cdf: "" },
    { category: "dimes", description: "Dîmes", amount_cdf: "" },
    { category: "construction", description: "Construction", amount_cdf: "" },
    { category: "soutien", description: "Soutien", amount_cdf: "" },
    { category: "autres", description: "Autres entrées", amount_cdf: "" },
  ];
}

function makeDefaultExpenseLines(): ExpenseLine[] {
  return [
    { label: "Loyer", description: "Loyer / salle", amount_cdf: "" },
    { label: "Transport", description: "Transport", amount_cdf: "" },
    { label: "Communication", description: "Téléphone / Internet", amount_cdf: "" },
    { label: "Eau et électricité", description: "Eau et électricité", amount_cdf: "" },
    { label: "Entretien", description: "Entretien / nettoyage", amount_cdf: "" },
    { label: "Assistance", description: "Assistance sociale", amount_cdf: "" },
    { label: "Matériel", description: "Achat matériel", amount_cdf: "" },
    { label: "Autres", description: "Autres dépenses", amount_cdf: "" },
  ];
}

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

export default function CellFinancesClient() {
  const [cellId, setCellId] = useState("");
  const [cellName, setCellName] = useState("");
  const [userId, setUserId] = useState("");

  const [usdRate, setUsdRate] = useState(2200);

  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);

  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [entryForm, setEntryForm] = useState({
    source_type: "activite",
    activity_name: "Culte dimanche",
    activity_date: "",
    observations: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    expense_date: "",
    observations: "",
  });

  const [entryLines, setEntryLines] = useState<EntryLine[]>(
    makeDefaultEntryLines()
  );
  const [expenseLines, setExpenseLines] = useState<ExpenseLine[]>(
    makeDefaultExpenseLines()
  );

  const [incomeReports, setIncomeReports] = useState<any[]>([]);
  const [expenseReports, setExpenseReports] = useState<any[]>([]);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("assigned_cell_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.assigned_cell_id) {
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
      .maybeSingle();

    if (rateData?.value) {
      setUsdRate(Number(rateData.value));
    }

    const { data: incomes, error: incomeError } = await supabase
      .from("finance_reports")
      .select("*")
      .eq("cell_id", assignedCellId)
      .order("activity_date", { ascending: false })
      .limit(50);

    if (incomeError) {
      setErrorMessage(incomeError.message);
      return;
    }

    const { data: expenses, error: expenseError } = await supabase
      .from("finance_expense_reports")
      .select("*")
      .eq("cell_id", assignedCellId)
      .order("expense_date", { ascending: false })
      .limit(50);

    if (expenseError) {
      setErrorMessage(expenseError.message);
      return;
    }

    setIncomeReports(incomes || []);
    setExpenseReports(expenses || []);
  }

  const totalEntryCdf = useMemo(() => {
    return entryLines.reduce((sum, line) => {
      const amount = Number(line.amount_cdf || 0);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);
  }, [entryLines]);

  const totalEntryUsd = usdRate > 0 ? totalEntryCdf / usdRate : 0;

  const totalExpenseCdf = useMemo(() => {
    return expenseLines.reduce((sum, line) => {
      const amount = Number(line.amount_cdf || 0);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);
  }, [expenseLines]);

  const totalExpenseUsd = usdRate > 0 ? totalExpenseCdf / usdRate : 0;

  const previousIncomeCdf = incomeReports.reduce(
    (sum, report) => sum + Number(report.total_cdf || 0),
    0
  );

  const previousExpenseCdf = expenseReports.reduce(
    (sum, report) => sum + Number(report.total_cdf || 0),
    0
  );

  const balanceCdf = previousIncomeCdf - previousExpenseCdf;

  function updateEntryForm(name: keyof typeof entryForm, value: string) {
    setEntryForm((current) => ({ ...current, [name]: value }));
  }

  function updateExpenseForm(name: keyof typeof expenseForm, value: string) {
    setExpenseForm((current) => ({ ...current, [name]: value }));
  }

  function updateEntryLine(index: number, field: keyof EntryLine, value: string) {
    setEntryLines((current) =>
      current.map((line, currentIndex) =>
        currentIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function updateExpenseLine(
    index: number,
    field: keyof ExpenseLine,
    value: string
  ) {
    setExpenseLines((current) =>
      current.map((line, currentIndex) =>
        currentIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function addEntryLine() {
    setEntryLines((current) => [
      ...current,
      { category: "autres", description: "", amount_cdf: "" },
    ]);
  }

  function addExpenseLine() {
    setExpenseLines((current) => [
      ...current,
      { label: "Autres", description: "", amount_cdf: "" },
    ]);
  }

  function removeEntryLine(index: number) {
    setEntryLines((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  function removeExpenseLine(index: number) {
    setExpenseLines((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  function firstDayOfMonth(dateValue: string) {
    if (!dateValue) return "";
    return `${dateValue.slice(0, 7)}-01`;
  }

  function resetEntryForm() {
    setEditingIncomeId(null);
    setEntryForm({
      source_type: "activite",
      activity_name: "Culte dimanche",
      activity_date: "",
      observations: "",
    });
    setEntryLines(makeDefaultEntryLines());
  }

  function resetExpenseForm() {
    setEditingExpenseId(null);
    setExpenseForm({
      expense_date: "",
      observations: "",
    });
    setExpenseLines(makeDefaultExpenseLines());
  }

  async function editIncomeReport(report: any) {
    setMessage("");
    setErrorMessage("");
if (report.status === "validated") {
  setErrorMessage(
    "Cette recette est déjà validée par l'administration centrale. Elle ne peut plus être modifiée."
  );
  return;
}
    const { data: lines, error } = await supabase
      .from("finance_report_lines")
      .select("category, description, amount_cdf")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setEditingIncomeId(report.id);
    setEntryForm({
      source_type: report.source_type || "activite",
      activity_name: report.activity_name || "Culte dimanche",
      activity_date: report.activity_date || "",
      observations: report.observations || "",
    });

    setEntryLines(
      lines && lines.length > 0
        ? lines.map((line: any) => ({
            category: line.category || "autres",
            description: line.description || "",
            amount_cdf: String(line.amount_cdf || ""),
          }))
        : makeDefaultEntryLines()
    );

    setEntryFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function editExpenseReport(report: any) {
    setMessage("");
    setErrorMessage("");
if (report.status === "validated") {
  setErrorMessage(
    "Cette dépense est déjà validée par l'administration centrale. Elle ne peut plus être modifiée."
  );
  return;
}
    const { data: lines, error } = await supabase
      .from("finance_expense_lines")
      .select("label, description, amount_cdf")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setEditingExpenseId(report.id);
    setExpenseForm({
      expense_date: report.expense_date || "",
      observations: report.observations || "",
    });

    setExpenseLines(
      lines && lines.length > 0
        ? lines.map((line: any) => ({
            label: line.label || "Autres",
            description: line.description || "",
            amount_cdf: String(line.amount_cdf || ""),
          }))
        : makeDefaultExpenseLines()
    );

    setExpenseFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEntrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!cellId) {
      setErrorMessage("Cellule introuvable.");
      return;
    }

    if (!entryForm.activity_date) {
      setErrorMessage("La date de l’entrée est obligatoire.");
      return;
    }

    const validLines = entryLines
      .filter((line) => Number(line.amount_cdf || 0) > 0)
      .map((line) => {
        const amountCdf = Number(line.amount_cdf || 0);

        return {
          category: line.category || "autres",
          description: line.description || line.category || "Entrée",
          amount_cdf: amountCdf,
          amount_usd: usdRate > 0 ? amountCdf / usdRate : 0,
        };
      });

    if (validLines.length === 0) {
      setErrorMessage("Ajoute au moins une entrée avec un montant.");
      return;
    }

    setIsSavingEntry(true);

    const payload = {
      cell_id: cellId,
      source_type: entryForm.source_type,
      activity_name: entryForm.activity_name,
      activity_date: entryForm.activity_date,
      currency: "CDF",
      usd_cdf_rate: usdRate,
      total_cdf: totalEntryCdf,
      total_usd: totalEntryUsd,
      observations: entryForm.observations || null,
      status: "pending",
      submitted_by: userId || null,
    };

    let reportId = editingIncomeId;

    if (editingIncomeId) {
      const { error: updateError } = await supabase
        .from("finance_reports")
        .update(payload)
        .eq("id", editingIncomeId)
        .eq("cell_id", cellId);

      if (updateError) {
        setIsSavingEntry(false);
        setErrorMessage(updateError.message);
        return;
      }
    } else {
      const { data: report, error: reportError } = await supabase
        .from("finance_reports")
        .insert(payload)
        .select("id")
        .single();

      if (reportError) {
        setIsSavingEntry(false);
        setErrorMessage(reportError.message);
        return;
      }

      reportId = report.id;
    }

    if (!reportId) {
      setIsSavingEntry(false);
      setErrorMessage("Rapport financier introuvable.");
      return;
    }

    const { error: deleteLinesError } = await supabase
      .from("finance_report_lines")
      .delete()
      .eq("report_id", reportId);

    if (deleteLinesError) {
      setIsSavingEntry(false);
      setErrorMessage(deleteLinesError.message);
      return;
    }

    const { error: linesError } = await supabase
      .from("finance_report_lines")
      .insert(
        validLines.map((line) => ({
          ...line,
          report_id: reportId,
        }))
      );

    setIsSavingEntry(false);

    if (linesError) {
      setErrorMessage(linesError.message);
      return;
    }

    setMessage(
      editingIncomeId
        ? "Entrée financière modifiée avec succès."
        : "Entrée financière enregistrée avec succès."
    );

    resetEntryForm();
    setEntryFormOpen(false);
    loadInitialData();
  }

  async function handleExpenseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!cellId) {
      setErrorMessage("Cellule introuvable.");
      return;
    }

    if (!expenseForm.expense_date) {
      setErrorMessage("La date de dépense est obligatoire.");
      return;
    }

    const validLines = expenseLines
      .filter((line) => Number(line.amount_cdf || 0) > 0)
      .map((line) => {
        const amountCdf = Number(line.amount_cdf || 0);

        return {
          label: line.label || "Autres",
          description: line.description || line.label || "Dépense",
          amount_cdf: amountCdf,
          amount_usd: usdRate > 0 ? amountCdf / usdRate : 0,
        };
      });

    if (validLines.length === 0) {
      setErrorMessage("Ajoute au moins une dépense avec un montant.");
      return;
    }

    setIsSavingExpense(true);

    const payload = {
      cell_id: cellId,
      expense_date: expenseForm.expense_date,
      report_month: firstDayOfMonth(expenseForm.expense_date),
      currency: "CDF",
      usd_cdf_rate: usdRate,
      total_cdf: totalExpenseCdf,
      total_usd: totalExpenseUsd,
      observations: expenseForm.observations || null,
      status: "pending",
      submitted_by: userId || null,
    };

    let reportId = editingExpenseId;

    if (editingExpenseId) {
      const { error: updateError } = await supabase
        .from("finance_expense_reports")
        .update(payload)
        .eq("id", editingExpenseId)
        .eq("cell_id", cellId);

      if (updateError) {
        setIsSavingExpense(false);
        setErrorMessage(updateError.message);
        return;
      }
    } else {
      const { data: report, error: reportError } = await supabase
        .from("finance_expense_reports")
        .insert(payload)
        .select("id")
        .single();

      if (reportError) {
        setIsSavingExpense(false);
        setErrorMessage(reportError.message);
        return;
      }

      reportId = report.id;
    }

    if (!reportId) {
      setIsSavingExpense(false);
      setErrorMessage("Rapport de dépense introuvable.");
      return;
    }

    const { error: deleteLinesError } = await supabase
      .from("finance_expense_lines")
      .delete()
      .eq("report_id", reportId);

    if (deleteLinesError) {
      setIsSavingExpense(false);
      setErrorMessage(deleteLinesError.message);
      return;
    }

    const { error: linesError } = await supabase
      .from("finance_expense_lines")
      .insert(
        validLines.map((line) => ({
          ...line,
          report_id: reportId,
        }))
      );

    setIsSavingExpense(false);

    if (linesError) {
      setErrorMessage(linesError.message);
      return;
    }

    setMessage(
      editingExpenseId
        ? "Dépense modifiée avec succès."
        : "Dépense enregistrée avec succès."
    );

    resetExpenseForm();
    setExpenseFormOpen(false);
    loadInitialData();
  }

  return (
    <div>
      <PageHeader
        title="Finances de la cellule"
        description={`Recettes et dépenses rattachées automatiquement à : ${
          cellName || "chargement..."
        }`}
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
          value={`${previousIncomeCdf.toLocaleString("fr-FR")} FC`}
          subtitle="Total des recettes encodées"
          icon={ArrowUpCircle}
          tone="green"
        />

        <StatCard
          title="Dépenses déclarées"
          value={`${previousExpenseCdf.toLocaleString("fr-FR")} FC`}
          subtitle="Total des dépenses encodées"
          icon={ArrowDownCircle}
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

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <FormCard
          title={editingIncomeId ? "Modifier une entrée" : "Ajouter une entrée"}
          description="Offrandes, dîmes, soutien, construction ou autre recette."
          buttonLabel={editingIncomeId ? "Formulaire ouvert" : "Nouvelle entrée"}
          open={entryFormOpen}
          onToggle={() => setEntryFormOpen((current) => !current)}
          onCancel={editingIncomeId ? resetEntryForm : undefined}
        >
          <EntryFormContent
            form={entryForm}
            lines={entryLines}
            totalCdf={totalEntryCdf}
            totalUsd={totalEntryUsd}
            isSaving={isSavingEntry}
            editing={Boolean(editingIncomeId)}
            onSubmit={handleEntrySubmit}
            updateForm={updateEntryForm}
            updateLine={updateEntryLine}
            addLine={addEntryLine}
            removeLine={removeEntryLine}
          />
        </FormCard>

        <FormCard
          title={editingExpenseId ? "Modifier une dépense" : "Ajouter une dépense"}
          description="Loyer, transport, communication, assistance, matériel ou autre dépense."
          buttonLabel={editingExpenseId ? "Formulaire ouvert" : "Nouvelle dépense"}
          open={expenseFormOpen}
          onToggle={() => setExpenseFormOpen((current) => !current)}
          onCancel={editingExpenseId ? resetExpenseForm : undefined}
        >
          <ExpenseFormContent
            form={expenseForm}
            lines={expenseLines}
            totalCdf={totalExpenseCdf}
            totalUsd={totalExpenseUsd}
            isSaving={isSavingExpense}
            editing={Boolean(editingExpenseId)}
            onSubmit={handleExpenseSubmit}
            updateForm={updateExpenseForm}
            updateLine={updateExpenseLine}
            addLine={addExpenseLine}
            removeLine={removeExpenseLine}
          />
        </FormCard>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <ReportList
          title="Dernières recettes"
          items={incomeReports}
          type="income"
          onEdit={editIncomeReport}
        />

        <ReportList
          title="Dernières dépenses"
          items={expenseReports}
          type="expense"
          onEdit={editExpenseReport}
        />
      </section>
    </div>
  );
}

function FormCard({
  title,
  description,
  buttonLabel,
  open,
  onToggle,
  onCancel,
  children,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  open: boolean;
  onToggle: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-black text-gray-950">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700"
            >
              <XCircle size={18} />
              Annuler
            </button>
          ) : null}

          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white shadow-sm"
          >
            <Plus size={18} />
            {buttonLabel}
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {open ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

function EntryFormContent({
  form,
  lines,
  totalCdf,
  totalUsd,
  isSaving,
  editing,
  onSubmit,
  updateForm,
  updateLine,
  addLine,
  removeLine,
}: any) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
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
          label="Activité / source"
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

      <LinesEditor
        lines={lines}
        type="entry"
        updateLine={updateLine}
        addLine={addLine}
        removeLine={removeLine}
      />

      <TotalBox label="Total entrée" totalCdf={totalCdf} totalUsd={totalUsd} />

      <Textarea
        label="Observations"
        value={form.observations}
        onChange={(value) => updateForm("observations", value)}
      />

      <SubmitButton
        label={editing ? "Modifier l’entrée" : "Enregistrer l’entrée"}
        loading={isSaving}
      />
    </form>
  );
}

function ExpenseFormContent({
  form,
  lines,
  totalCdf,
  totalUsd,
  isSaving,
  editing,
  onSubmit,
  updateForm,
  updateLine,
  addLine,
  removeLine,
}: any) {
  return (
    <form onSubmit={onSubmit}>
      <Input
        label="Date de dépense"
        type="date"
        value={form.expense_date}
        onChange={(value) => updateForm("expense_date", value)}
      />

      <LinesEditor
        lines={lines}
        type="expense"
        updateLine={updateLine}
        addLine={addLine}
        removeLine={removeLine}
      />

      <TotalBox label="Total dépense" totalCdf={totalCdf} totalUsd={totalUsd} />

      <Textarea
        label="Observations"
        value={form.observations}
        onChange={(value) => updateForm("observations", value)}
      />

      <SubmitButton
        label={editing ? "Modifier la dépense" : "Enregistrer la dépense"}
        loading={isSaving}
      />
    </form>
  );
}

function LinesEditor({
  lines,
  type,
  updateLine,
  addLine,
  removeLine,
}: any) {
  return (
    <div className="mt-5 space-y-3">
      {lines.map((line: any, index: number) => (
        <div
          key={index}
          className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-[180px_1fr_150px_auto]"
        >
          <Input
            label={type === "entry" ? "Catégorie" : "Libellé"}
            value={type === "entry" ? line.category : line.label}
            onChange={(value) =>
              updateLine(index, type === "entry" ? "category" : "label", value)
            }
          />

          <Input
            label="Description"
            value={line.description}
            onChange={(value) => updateLine(index, "description", value)}
          />

          <Input
            label="Montant FC"
            type="number"
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

      <button
        type="button"
        onClick={addLine}
        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--louange-purple)] px-5 py-3 text-sm font-black text-[var(--louange-purple)]"
      >
        <Plus size={18} />
        Ajouter une ligne
      </button>
    </div>
  );
}

function TotalBox({
  label,
  totalCdf,
  totalUsd,
}: {
  label: string;
  totalCdf: number;
  totalUsd: number;
}) {
  return (
    <div className="mt-5 rounded-3xl bg-[var(--louange-purple-dark)] p-5 text-white">
      <p className="text-sm font-bold text-white/70">{label}</p>
      <p className="text-3xl font-black">
        {totalCdf.toLocaleString("fr-FR")} FC
      </p>
      <p className="mt-2 text-xl font-black text-[var(--louange-gold)]">
        {totalUsd.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} USD
      </p>
    </div>
  );
}

function ReportList({
  title,
  items,
  type,
  onEdit,
}: {
  title: string;
  items: any[];
  type: "income" | "expense";
  onEdit: (item: any) => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h3 className="text-xl font-black text-gray-950">{title}</h3>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500">
          Aucune donnée enregistrée.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const isValidated = item.status === "validated";

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-black text-gray-950">
                      {type === "income"
                        ? item.activity_name || "Entrée"
                        : "Dépense"}{" "}
                      — {type === "income" ? item.activity_date : item.expense_date}
                    </p>

                    <p className="text-sm font-bold text-gray-700">
                      Total : {Number(item.total_cdf || 0).toLocaleString("fr-FR")} FC
                    </p>

                    <p className="text-sm text-gray-500">
                      Statut : {item.status || "pending"}
                    </p>
                  </div>

                  {isValidated ? (
                    <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 ring-1 ring-green-200">
                      Validé — modification bloquée
                    </span>
                  ) : (
                    <span className="w-fit rounded-full bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700 ring-1 ring-yellow-200">
                      En attente
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isValidated}
                  onClick={() => onEdit(item)}
                  className={`mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-black ${
                    isValidated
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-[var(--louange-purple)] text-[var(--louange-purple)]"
                  }`}
                >
                  <Pencil size={16} />
                  {isValidated ? "Modification bloquée" : "Modifier"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
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
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      >
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
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      />
    </div>
  );
}

function SubmitButton({
  label,
  loading,
}: {
  label: string;
  loading: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white disabled:opacity-60"
    >
      <Save size={18} />
      {loading ? "Enregistrement..." : label}
    </button>
  );
}
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Filter,
  FileText,
  Wallet,
  XCircle,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import ValidationActions from "@/components/validations/ValidationActions";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    type?: string;
    status?: string;
    country?: string;
    city?: string;
    q?: string;
  }>;
};

type LinkedCell = {
  id: string;
  code: string | null;
  name: string | null;
  country: string | null;
  city: string | null;
  pastor_name: string | null;
};

type ValidationItem = {
  id: string;
  type: "income" | "expense" | "monthly_report";
  table: "finance_reports" | "finance_expense_reports" | "cell_monthly_reports";
  title: string;
  date: string | null;
  total_cdf: number;
  total_usd: number;
  status: string | null;
  observations: string | null;
  cell: LinkedCell | null;
};

function normalizeCell(cell: LinkedCell | LinkedCell[] | null | undefined) {
  if (!cell) return null;
  if (Array.isArray(cell)) return cell[0] || null;
  return cell;
}

function cleanStringList(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

function statusLabel(status: string | null) {
  const labels: Record<string, string> = {
    pending: "En attente",
    validated: "Validé",
    rejected: "Rejeté",
    archived: "Archivé",
  };

  return labels[status || ""] || status || "-";
}

function typeLabel(type: ValidationItem["type"]) {
  const labels = {
    income: "Recette",
    expense: "Dépense",
    monthly_report: "Rapport mensuel",
  };

  return labels[type];
}

function typeTone(type: ValidationItem["type"]) {
  if (type === "income") return "bg-green-50 text-green-700 ring-green-200";
  if (type === "expense") return "bg-red-50 text-red-700 ring-red-200";
  return "bg-[var(--louange-gold-soft)] text-[var(--louange-purple)] ring-yellow-200";
}

function matchesSearch(item: ValidationItem, search: string) {
  if (!search) return true;

  const value = search.toLowerCase();

  const searchable = [
    item.title,
    item.status,
    item.observations,
    item.cell?.name,
    item.cell?.code,
    item.cell?.country,
    item.cell?.city,
    item.cell?.pastor_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(value);
}

export default async function CentralValidationsPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : undefined;

  const selectedType = params?.type || "";
  const selectedStatus = params?.status || "pending";
  const selectedCountry = params?.country || "";
  const selectedCity = params?.city || "";
  const search = params?.q || "";

  const { data: allCells } = await supabase
    .from("cells")
    .select("id, country, city")
    .order("country", { ascending: true });

  const countries = cleanStringList((allCells || []).map((cell) => cell.country));

  const cities = cleanStringList(
    (allCells || [])
      .filter((cell) =>
        selectedCountry ? cell.country === selectedCountry : true
      )
      .map((cell) => cell.city)
  );

  const filteredCellIds = (allCells || [])
    .filter((cell) => {
      const countryOk = selectedCountry ? cell.country === selectedCountry : true;
      const cityOk = selectedCity ? cell.city === selectedCity : true;
      return countryOk && cityOk;
    })
    .map((cell) => cell.id);

  const shouldFilterCells = selectedCountry || selectedCity;
  const noCellMatch = shouldFilterCells && filteredCellIds.length === 0;

  const items: ValidationItem[] = [];

  if (!noCellMatch && (!selectedType || selectedType === "income")) {
    let incomeQuery = supabase
      .from("finance_reports")
      .select(
        `
        id,
        cell_id,
        activity_name,
        activity_date,
        total_cdf,
        total_usd,
        status,
        observations,
        cells:cell_id(
          id,
          code,
          name,
          country,
          city,
          pastor_name
        )
      `
      )
      .order("activity_date", { ascending: false })
      .limit(100);

    if (selectedStatus) {
      incomeQuery = incomeQuery.eq("status", selectedStatus);
    }

    if (shouldFilterCells) {
      incomeQuery = incomeQuery.in("cell_id", filteredCellIds);
    }

    const { data: incomes } = await incomeQuery;

    for (const item of incomes || []) {
      const cell = normalizeCell((item as any).cells);

      items.push({
        id: item.id,
        type: "income",
        table: "finance_reports",
        title: item.activity_name || "Recette",
        date: item.activity_date,
        total_cdf: Number(item.total_cdf || 0),
        total_usd: Number(item.total_usd || 0),
        status: item.status,
        observations: item.observations,
        cell,
      });
    }
  }

  if (!noCellMatch && (!selectedType || selectedType === "expense")) {
    let expenseQuery = supabase
      .from("finance_expense_reports")
      .select(
        `
        id,
        cell_id,
        expense_date,
        total_cdf,
        total_usd,
        status,
        observations,
        cells:cell_id(
          id,
          code,
          name,
          country,
          city,
          pastor_name
        )
      `
      )
      .order("expense_date", { ascending: false })
      .limit(100);

    if (selectedStatus) {
      expenseQuery = expenseQuery.eq("status", selectedStatus);
    }

    if (shouldFilterCells) {
      expenseQuery = expenseQuery.in("cell_id", filteredCellIds);
    }

    const { data: expenses } = await expenseQuery;

    for (const item of expenses || []) {
      const cell = normalizeCell((item as any).cells);

      items.push({
        id: item.id,
        type: "expense",
        table: "finance_expense_reports",
        title: "Dépense",
        date: item.expense_date,
        total_cdf: Number(item.total_cdf || 0),
        total_usd: Number(item.total_usd || 0),
        status: item.status,
        observations: item.observations,
        cell,
      });
    }
  }

  if (!noCellMatch && (!selectedType || selectedType === "monthly_report")) {
    let reportQuery = supabase
      .from("cell_monthly_reports")
      .select(
        `
        id,
        cell_id,
        report_month,
        activities_count,
        total_attendance,
        status,
        needs,
        pastor_notes,
        cells:cell_id(
          id,
          code,
          name,
          country,
          city,
          pastor_name
        )
      `
      )
      .order("report_month", { ascending: false })
      .limit(100);

    if (selectedStatus) {
      reportQuery = reportQuery.eq("status", selectedStatus);
    }

    if (shouldFilterCells) {
      reportQuery = reportQuery.in("cell_id", filteredCellIds);
    }

    const { data: reports } = await reportQuery;

    for (const item of reports || []) {
      const cell = normalizeCell((item as any).cells);

      items.push({
        id: item.id,
        type: "monthly_report",
        table: "cell_monthly_reports",
        title: `Rapport mensuel — ${item.report_month || "-"}`,
        date: item.report_month,
        total_cdf: 0,
        total_usd: 0,
        status: item.status,
        observations:
          item.needs ||
          item.pastor_notes ||
          `${item.activities_count || 0} activité(s), ${
            item.total_attendance || 0
          } présence(s)`,
        cell,
      });
    }
  }

  const filteredItems = items
    .filter((item) => matchesSearch(item, search))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const pendingCount = filteredItems.filter(
    (item) => item.status === "pending"
  ).length;

  const validatedCount = filteredItems.filter(
    (item) => item.status === "validated"
  ).length;

  const rejectedCount = filteredItems.filter(
    (item) => item.status === "rejected"
  ).length;

  const totalIncome = filteredItems
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.total_cdf, 0);

  const totalExpense = filteredItems
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.total_cdf, 0);

  return (
    <div>
      <PageHeader
        title="Validations"
        description="Validez ou rejetez les données envoyées par les cellules : recettes, dépenses et rapports mensuels."
      />

      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={20} className="text-[var(--louange-purple)]" />
          <h3 className="text-lg font-black text-gray-950">
            Filtres de validation
          </h3>
        </div>

        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          <SelectFilter
            name="type"
            label="Type"
            value={selectedType}
            options={["income", "expense", "monthly_report"]}
            labels={{
              income: "Recettes",
              expense: "Dépenses",
              monthly_report: "Rapports mensuels",
            }}
          />

          <SelectFilter
            name="status"
            label="Statut"
            value={selectedStatus}
            options={["pending", "validated", "rejected"]}
            labels={{
              pending: "En attente",
              validated: "Validé",
              rejected: "Rejeté",
            }}
          />

          <SelectFilter
            name="country"
            label="Pays"
            value={selectedCountry}
            options={countries}
          />

          <SelectFilter
            name="city"
            label="Ville"
            value={selectedCity}
            options={cities}
          />

          <div className="lg:col-span-2 xl:col-span-2">
            <label className="mb-2 block text-sm font-bold text-gray-800">
              Recherche
            </label>
            <input
              name="q"
              defaultValue={search}
              placeholder="Cellule, code, pasteur..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white"
            >
              Filtrer
            </button>

            <Link
              href="/central/validations"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 sm:w-auto"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="En attente"
          value={String(pendingCount)}
          subtitle="À traiter"
          icon={Activity}
          tone="gold"
        />

        <StatCard
          title="Validés"
          value={String(validatedCount)}
          subtitle="Contrôlés par l’administration"
          icon={CheckCircle2}
          tone="green"
        />

        <StatCard
          title="Rejetés"
          value={String(rejectedCount)}
          subtitle="À corriger par la cellule"
          icon={XCircle}
          tone="red"
        />

        <StatCard
          title="Solde affiché"
          value={`${(totalIncome - totalExpense).toLocaleString("fr-FR")} FC`}
          subtitle="Recettes - dépenses filtrées"
          icon={Wallet}
          tone="purple"
        />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-5">
          <h3 className="text-xl font-black text-gray-950">
            Éléments à valider
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filteredItems.length} élément(s) trouvé(s).
          </p>
        </div>

        <div className="hidden rounded-2xl border border-gray-100 lg:block">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-[1150px] divide-y divide-gray-100">
              <thead className="bg-[var(--louange-purple-dark)] text-white">
                <tr>
                  <Th>Type</Th>
                  <Th>Date</Th>
                  <Th>Cellule</Th>
                  <Th>Pays / Ville</Th>
                  <Th>Détail</Th>
                  <Th>Montant</Th>
                  <Th>Statut</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm font-semibold text-gray-500"
                    >
                      Aucun élément trouvé pour les filtres sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={`${item.table}-${item.id}`} className="hover:bg-gray-50">
                      <Td>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${typeTone(
                            item.type
                          )}`}
                        >
                          {typeLabel(item.type)}
                        </span>
                      </Td>

                      <Td>{item.date || "-"}</Td>

                      <Td>
                        <p className="font-black text-gray-950">
                          {item.cell?.name || "-"}
                        </p>
                        <p className="text-xs font-bold text-[var(--louange-purple)]">
                          {item.cell?.code || "-"}
                        </p>
                      </Td>

                      <Td>
                        <p>{item.cell?.country || "-"}</p>
                        <p className="text-sm text-gray-500">
                          {item.cell?.city || "-"}
                        </p>
                      </Td>

                      <Td>
                        <p className="font-black text-gray-950">{item.title}</p>
                        <p className="max-w-[260px] truncate text-sm text-gray-500">
                          {item.observations || "-"}
                        </p>
                      </Td>

                      <Td>
                        {item.type === "monthly_report" ? (
                          "-"
                        ) : (
                          <p className="font-black text-gray-950">
                            {item.total_cdf.toLocaleString("fr-FR")} FC
                          </p>
                        )}
                      </Td>

                      <Td>
                        <StatusBadge status={item.status} />
                      </Td>

                      <Td>
                        <ValidationActions
                          table={item.table}
                          recordId={item.id}
                          currentStatus={item.status}
                        />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 lg:hidden">
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500">
              Aucun élément trouvé.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={`${item.table}-${item.id}`}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${typeTone(
                      item.type
                    )}`}
                  >
                    {typeLabel(item.type)}
                  </span>

                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-3">
                  <p className="font-black text-gray-950">{item.title}</p>
                  <p className="text-xs font-bold text-[var(--louange-purple)]">
                    {item.cell?.name || "-"} — {item.cell?.code || "-"}
                  </p>
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>Date :</strong> {item.date || "-"}
                  </p>

                  <p>
                    <strong>Pays / Ville :</strong>{" "}
                    {item.cell?.country || "-"} / {item.cell?.city || "-"}
                  </p>

                  {item.type !== "monthly_report" ? (
                    <p>
                      <strong>Montant :</strong>{" "}
                      {item.total_cdf.toLocaleString("fr-FR")} FC
                    </p>
                  ) : null}

                  <p>
                    <strong>Observation :</strong> {item.observations || "-"}
                  </p>
                </div>

                <div className="mt-4">
                  <ValidationActions
                    table={item.table}
                    recordId={item.id}
                    currentStatus={item.status}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SelectFilter({
  name,
  label,
  value,
  options,
  labels,
}: {
  name: string;
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>

      <select
        name={name}
        defaultValue={value}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      >
        <option value="">Tous</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] || option}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const value = status || "pending";

  const styles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    validated: "bg-green-50 text-green-700 ring-green-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
    archived: "bg-gray-100 text-gray-700 ring-gray-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${
        styles[value] || styles.pending
      }`}
    >
      {statusLabel(value)}
    </span>
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
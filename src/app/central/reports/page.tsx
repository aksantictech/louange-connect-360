import Link from "next/link";
import PrintButton from "@/components/ui/PrintButton";
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CalendarDays,
  FileText,
  Filter,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    year?: string;
    month?: string;
    date_from?: string;
    date_to?: string;
    country?: string;
    city?: string;
    type?: string;
    status?: string;
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

type ReportType = "activity" | "income" | "expense" | "monthly_report";

type ReportItem = {
  id: string;
  type: ReportType;
  title: string;
  date: string | null;
  status: string | null;
  cell: LinkedCell | null;
  attendance: number;
  new_people: number;
  total_cdf: number;
  observations: string | null;
};

function normalizeCell(cell: LinkedCell | LinkedCell[] | null | undefined) {
  if (!cell) return null;
  if (Array.isArray(cell)) return cell[0] || null;
  return cell;
}

function cleanStringList(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

function numberValue(value: number | string | null | undefined) {
  return Number(value || 0);
}

function statusLabel(status: string | null) {
  const labels: Record<string, string> = {
    recorded: "Encodé",
    pending: "En attente",
    validated: "Validé",
    rejected: "Rejeté",
    archived: "Archivé",
  };

  return labels[status || ""] || status || "-";
}

function typeLabel(type: ReportType) {
  const labels: Record<ReportType, string> = {
    activity: "Activité",
    income: "Recette",
    expense: "Dépense",
    monthly_report: "Rapport mensuel",
  };

  return labels[type];
}

function typeStyle(type: ReportType) {
  if (type === "activity") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  if (type === "income") {
    return "bg-green-50 text-green-700 ring-green-200";
  }

  if (type === "expense") {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  return "bg-[var(--louange-gold-soft)] text-[var(--louange-purple)] ring-yellow-200";
}

function reportMatchesSearch(item: ReportItem, search: string) {
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

function getDefaultDateRange(year: string, month: string) {
  if (year && month) {
    const monthNumber = Number(month);
    const lastDay = new Date(Number(year), monthNumber, 0).getDate();

    return {
      from: `${year}-${month.padStart(2, "0")}-01`,
      to: `${year}-${month.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  if (year) {
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    };
  }

  return {
    from: "",
    to: "",
  };
}

function applyDateRange(query: any, column: string, from: string, to: string) {
  let nextQuery = query;

  if (from) {
    nextQuery = nextQuery.gte(column, from);
  }

  if (to) {
    nextQuery = nextQuery.lte(column, to);
  }

  return nextQuery;
}

export default async function CentralReportsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;

  const currentYear = new Date().getFullYear();

  const selectedYear = params?.year || String(currentYear);
  const selectedMonth = params?.month || "";
  const selectedCountry = params?.country || "";
  const selectedCity = params?.city || "";
  const selectedType = params?.type || "";
  const selectedStatus = params?.status || "";
  const search = params?.q || "";

  const defaultRange = getDefaultDateRange(selectedYear, selectedMonth);

  const dateFrom = params?.date_from || defaultRange.from;
  const dateTo = params?.date_to || defaultRange.to;

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

  const shouldFilterCells = Boolean(selectedCountry || selectedCity);
  const noCellMatch = shouldFilterCells && filteredCellIds.length === 0;

  const items: ReportItem[] = [];
  const errors: string[] = [];

  if (!noCellMatch && (!selectedType || selectedType === "activity")) {
    if (!selectedStatus || selectedStatus === "recorded") {
      let activityQuery = supabase
        .from("activities")
        .select(
          `
          id,
          cell_id,
          activity_type,
          activity_title,
          activity_date,
          total_attendance,
          participants_count,
          new_converts_count,
          new_visitors_count,
          summary,
          needs,
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
        .limit(200);

      activityQuery = applyDateRange(activityQuery, "activity_date", dateFrom, dateTo);

      if (shouldFilterCells) {
        activityQuery = activityQuery.in("cell_id", filteredCellIds);
      }

      const { data, error } = await activityQuery;

      if (error) {
        errors.push(error.message);
      }

      for (const item of data || []) {
        const cell = normalizeCell((item as any).cells);

        items.push({
          id: item.id,
          type: "activity",
          title: `${item.activity_type || "Activité"} — ${
            item.activity_title || "Sans thème"
          }`,
          date: item.activity_date,
          status: "recorded",
          cell,
          attendance:
            numberValue(item.total_attendance) ||
            numberValue(item.participants_count),
          new_people:
            numberValue(item.new_converts_count) +
            numberValue(item.new_visitors_count),
          total_cdf: 0,
          observations: item.summary || item.needs || null,
        });
      }
    }
  }

  if (!noCellMatch && (!selectedType || selectedType === "income")) {
    if (!selectedStatus || selectedStatus !== "recorded") {
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
        .limit(200);

      incomeQuery = applyDateRange(incomeQuery, "activity_date", dateFrom, dateTo);

      if (selectedStatus) {
        incomeQuery = incomeQuery.eq("status", selectedStatus);
      }

      if (shouldFilterCells) {
        incomeQuery = incomeQuery.in("cell_id", filteredCellIds);
      }

      const { data, error } = await incomeQuery;

      if (error) {
        errors.push(error.message);
      }

      for (const item of data || []) {
        const cell = normalizeCell((item as any).cells);

        items.push({
          id: item.id,
          type: "income",
          title: item.activity_name || "Recette",
          date: item.activity_date,
          status: item.status || "pending",
          cell,
          attendance: 0,
          new_people: 0,
          total_cdf: numberValue(item.total_cdf),
          observations: item.observations || null,
        });
      }
    }
  }

  if (!noCellMatch && (!selectedType || selectedType === "expense")) {
    if (!selectedStatus || selectedStatus !== "recorded") {
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
        .limit(200);

      expenseQuery = applyDateRange(expenseQuery, "expense_date", dateFrom, dateTo);

      if (selectedStatus) {
        expenseQuery = expenseQuery.eq("status", selectedStatus);
      }

      if (shouldFilterCells) {
        expenseQuery = expenseQuery.in("cell_id", filteredCellIds);
      }

      const { data, error } = await expenseQuery;

      if (error) {
        errors.push(error.message);
      }

      for (const item of data || []) {
        const cell = normalizeCell((item as any).cells);

        items.push({
          id: item.id,
          type: "expense",
          title: "Dépense",
          date: item.expense_date,
          status: item.status || "pending",
          cell,
          attendance: 0,
          new_people: 0,
          total_cdf: numberValue(item.total_cdf),
          observations: item.observations || null,
        });
      }
    }
  }

  if (!noCellMatch && (!selectedType || selectedType === "monthly_report")) {
    if (!selectedStatus || selectedStatus !== "recorded") {
      let monthlyQuery = supabase
        .from("cell_monthly_reports")
        .select(
          `
          id,
          cell_id,
          report_month,
          activities_count,
          total_attendance,
          new_converts_count,
          new_visitors_count,
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
        .limit(200);

      monthlyQuery = applyDateRange(monthlyQuery, "report_month", dateFrom, dateTo);

      if (selectedStatus) {
        monthlyQuery = monthlyQuery.eq("status", selectedStatus);
      }

      if (shouldFilterCells) {
        monthlyQuery = monthlyQuery.in("cell_id", filteredCellIds);
      }

      const { data, error } = await monthlyQuery;

      if (error) {
        errors.push(error.message);
      }

      for (const item of data || []) {
        const cell = normalizeCell((item as any).cells);

        items.push({
          id: item.id,
          type: "monthly_report",
          title: `Rapport mensuel — ${item.report_month || "-"}`,
          date: item.report_month,
          status: item.status || "pending",
          cell,
          attendance: numberValue(item.total_attendance),
          new_people:
            numberValue(item.new_converts_count) +
            numberValue(item.new_visitors_count),
          total_cdf: 0,
          observations:
            item.needs ||
            item.pastor_notes ||
            `${numberValue(item.activities_count)} activité(s)`,
        });
      }
    }
  }

  const filteredItems = items
    .filter((item) => reportMatchesSearch(item, search))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const activityItems = filteredItems.filter((item) => item.type === "activity");
  const monthlyItems = filteredItems.filter(
    (item) => item.type === "monthly_report"
  );
  const incomeItems = filteredItems.filter((item) => item.type === "income");
  const expenseItems = filteredItems.filter((item) => item.type === "expense");

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.total_cdf, 0);
  const totalExpense = expenseItems.reduce((sum, item) => sum + item.total_cdf, 0);

  const totalAttendance =
    activityItems.length > 0
      ? activityItems.reduce((sum, item) => sum + item.attendance, 0)
      : monthlyItems.reduce((sum, item) => sum + item.attendance, 0);

  const totalNewPeople =
    activityItems.length > 0
      ? activityItems.reduce((sum, item) => sum + item.new_people, 0)
      : monthlyItems.reduce((sum, item) => sum + item.new_people, 0);

  const pendingCount = filteredItems.filter(
    (item) => item.status === "pending"
  ).length;

  const years = Array.from({ length: 6 }, (_, index) =>
    String(currentYear - index)
  );

  return (
    <div>
      <PageHeader
  title="Rapports globaux"
  description="Vue consolidée des données envoyées par les cellules : activités, recettes, dépenses et rapports mensuels."
  action={
    <PrintButton
      label="Imprimer le rapport"
      title="Rapport global - Louange Connect 360"
    />
  }
/>

<section className="no-print mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">        <div className="mb-4 flex items-center gap-2">
          <Filter size={20} className="text-[var(--louange-purple)]" />
          <h3 className="text-lg font-black text-gray-950">
            Filtres des rapports
          </h3>
        </div>

        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <SelectFilter name="year" label="Année" value={selectedYear} options={years} />

          <SelectFilter
            name="month"
            label="Mois"
            value={selectedMonth}
            options={["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]}
            labels={{
              "01": "Janvier",
              "02": "Février",
              "03": "Mars",
              "04": "Avril",
              "05": "Mai",
              "06": "Juin",
              "07": "Juillet",
              "08": "Août",
              "09": "Septembre",
              "10": "Octobre",
              "11": "Novembre",
              "12": "Décembre",
            }}
          />

          <InputFilter
            name="date_from"
            label="Date début"
            type="date"
            value={dateFrom}
          />

          <InputFilter
            name="date_to"
            label="Date fin"
            type="date"
            value={dateTo}
          />

          <SelectFilter
            name="type"
            label="Type"
            value={selectedType}
            options={["activity", "income", "expense", "monthly_report"]}
            labels={{
              activity: "Activités",
              income: "Recettes",
              expense: "Dépenses",
              monthly_report: "Rapports mensuels",
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

          <SelectFilter
            name="status"
            label="Statut"
            value={selectedStatus}
            options={["recorded", "pending", "validated", "rejected"]}
            labels={{
              recorded: "Encodé",
              pending: "En attente",
              validated: "Validé",
              rejected: "Rejeté",
            }}
          />

          <InputFilter
            name="q"
            label="Recherche"
            value={search}
            placeholder="Cellule, code, pasteur..."
          />

          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-3 xl:col-span-4 2xl:col-span-5">
            <button
              type="submit"
              className="rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white"
            >
              Appliquer
            </button>

            <Link
              href="/central/reports"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-black text-gray-700"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>
<div id="printable-report">
  <div className="print-only mb-6 border-b pb-4">
    <h1 className="text-2xl font-black">Louange Connect 360</h1>
    <p className="text-sm">
      Rapport global généré le {new Date().toLocaleDateString("fr-FR")}
    </p>
    <p className="text-sm">
      Période : {dateFrom} au {dateTo}
    </p>
  </div>
   </div>
      {errors.length > 0 ? (
        <div className="mb-6 rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700">
          {errors.join(" / ")}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Données reçues"
          value={String(filteredItems.length)}
          subtitle={`${pendingCount} en attente`}
          icon={BarChart3}
          tone="purple"
        />

        <StatCard
          title="Activités"
          value={String(activityItems.length)}
          subtitle="Rapports d’activités cellule"
          icon={Activity}
          tone="green"
        />

        <StatCard
          title="Présence totale"
          value={totalAttendance.toLocaleString("fr-FR")}
          subtitle="Participants déclarés"
          icon={Users}
          tone="purple"
        />

        <StatCard
          title="Nouveaux"
          value={String(totalNewPeople)}
          subtitle="Convertis + arrivants"
          icon={UserPlus}
          tone="gold"
        />

        <StatCard
          title="Recettes"
          value={`${totalIncome.toLocaleString("fr-FR")} FC`}
          subtitle="Entrées financières"
          icon={ArrowUpCircle}
          tone="green"
        />

        <StatCard
          title="Dépenses"
          value={`${totalExpense.toLocaleString("fr-FR")} FC`}
          subtitle="Sorties financières"
          icon={ArrowDownCircle}
          tone="red"
        />

        <StatCard
          title="Solde"
          value={`${(totalIncome - totalExpense).toLocaleString("fr-FR")} FC`}
          subtitle="Recettes - dépenses"
          icon={Wallet}
          tone={totalIncome - totalExpense >= 0 ? "purple" : "red"}
        />

        <StatCard
          title="Rapports mensuels"
          value={String(monthlyItems.length)}
          subtitle="Synthèses pastorales"
          icon={FileText}
          tone="gold"
        />

        <StatCard
          title="Période"
          value={dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : selectedYear}
          subtitle="Filtre actif"
          icon={CalendarDays}
          tone="purple"
        />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-5">
          <h3 className="text-xl font-black text-gray-950">
            Liste consolidée des rapports
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filteredItems.length} élément(s) trouvé(s).
          </p>
        </div>

        <div className="hidden rounded-2xl border border-gray-100 lg:block">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-[1200px] divide-y divide-gray-100">
              <thead className="bg-[var(--louange-purple-dark)] text-white">
                <tr>
                  <Th>Type</Th>
                  <Th>Date</Th>
                  <Th>Cellule</Th>
                  <Th>Pays / Ville</Th>
                  <Th>Détail</Th>
                  <Th>Présence</Th>
                  <Th>Nouveaux</Th>
                  <Th>Montant</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-sm font-semibold text-gray-500"
                    >
                      Aucune donnée trouvée pour les filtres sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                      <Td>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${typeStyle(
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

                      <Td>{item.attendance || "-"}</Td>
                      <Td>{item.new_people || "-"}</Td>

                      <Td>
                        {item.total_cdf > 0
                          ? `${item.total_cdf.toLocaleString("fr-FR")} FC`
                          : "-"}
                      </Td>

                      <Td>
                        <StatusBadge status={item.status} />
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
              Aucune donnée trouvée.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${typeStyle(
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
                  <p>
                    <strong>Présence :</strong> {item.attendance || "-"}
                  </p>
                  <p>
                    <strong>Nouveaux :</strong> {item.new_people || "-"}
                  </p>
                  <p>
                    <strong>Montant :</strong>{" "}
                    {item.total_cdf > 0
                      ? `${item.total_cdf.toLocaleString("fr-FR")} FC`
                      : "-"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function InputFilter({
  name,
  label,
  value,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>

      <input
        name={name}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      />
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
    recorded: "bg-blue-50 text-blue-700 ring-blue-200",
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
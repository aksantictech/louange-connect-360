import Link from "next/link";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  Search,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import OnlineDonationsFinanceWidget from "@/components/finances/OnlineDonationsFinanceWidget";
import StatCard from "@/components/dashboard/StatCard";
import FinanceEntryForm from "@/components/finances/FinanceEntryForm";
import FinanceExpenseForm from "@/components/finances/FinanceExpenseForm";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    year?: string;
    month?: string;
    country?: string;
    city?: string;
    cell?: string;
    q?: string;
  }>;
};

function getDateRange(yearValue: string, monthValue: string) {
  const year = Number(yearValue || new Date().getFullYear());

  if (monthValue) {
    const month = Number(monthValue) - 1;

    return {
      startDate: new Date(year, month, 1).toISOString().slice(0, 10),
      endDate: new Date(year, month + 1, 0).toISOString().slice(0, 10),
    };
  }

  return {
    startDate: new Date(year, 0, 1).toISOString().slice(0, 10),
    endDate: new Date(year, 11, 31).toISOString().slice(0, 10),
  };
}

function cleanStringList(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

export default async function FinancesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;

  const selectedYear = params?.year || String(new Date().getFullYear());
  const selectedMonth = params?.month || "";
  const selectedCountry = params?.country || "";
  const selectedCity = params?.city || "";
  const selectedCell = params?.cell || "";
  const search = params?.q || "";

  const { startDate, endDate } = getDateRange(selectedYear, selectedMonth);

  const { data: cellsData } = await supabase
    .from("cells")
    .select("id, code, name, country, city")
    .order("name", { ascending: true });

  const allCells = (cellsData || []) as Array<{
    id: string;
    code: string | null;
    name: string | null;
    country: string | null;
    city: string | null;
  }>;

  const countries = cleanStringList(allCells.map((cell) => cell.country));

  const cities = cleanStringList(
    allCells
      .filter((cell) =>
        selectedCountry ? cell.country === selectedCountry : true
      )
      .map((cell) => cell.city)
  );

  let filteredCells = allCells;

  if (selectedCountry) {
    filteredCells = filteredCells.filter(
      (cell) => cell.country === selectedCountry
    );
  }

  if (selectedCity) {
    filteredCells = filteredCells.filter((cell) => cell.city === selectedCity);
  }

  if (selectedCell) {
    filteredCells = filteredCells.filter((cell) => cell.id === selectedCell);
  }

  if (search) {
    const lowered = search.toLowerCase();

    filteredCells = filteredCells.filter((cell) => {
      return (
        cell.name?.toLowerCase().includes(lowered) ||
        cell.code?.toLowerCase().includes(lowered) ||
        cell.country?.toLowerCase().includes(lowered) ||
        cell.city?.toLowerCase().includes(lowered)
      );
    });
  }

  const cellIds = filteredCells.map((cell) => cell.id);
  const noCellAfterFilter = cellIds.length === 0;

  let incomeReports: any[] = [];
  let expenseReports: any[] = [];

  if (!noCellAfterFilter) {
    let incomeQuery = supabase
      .from("finance_reports")
      .select("*, cells(name, code, country, city)")
      .gte("activity_date", startDate)
      .lte("activity_date", endDate)
      .order("activity_date", { ascending: false });

    let expenseQuery = supabase
      .from("finance_expense_reports")
      .select("*, cells(name, code, country, city)")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
      .order("expense_date", { ascending: false });

    incomeQuery = incomeQuery.in("cell_id", cellIds);
    expenseQuery = expenseQuery.in("cell_id", cellIds);

    const [incomeResponse, expenseResponse] = await Promise.all([
      incomeQuery,
      expenseQuery,
    ]);

    incomeReports = incomeResponse.data || [];
    expenseReports = expenseResponse.data || [];
  }

  const totalIncomeCdf = incomeReports.reduce(
    (sum, report) => sum + Number(report.total_cdf || 0),
    0
  );

  const totalIncomeUsd = incomeReports.reduce(
    (sum, report) => sum + Number(report.total_usd || 0),
    0
  );

  const totalExpenseCdf = expenseReports.reduce(
    (sum, report) => sum + Number(report.total_cdf || 0),
    0
  );

  const totalExpenseUsd = expenseReports.reduce(
    (sum, report) => sum + Number(report.total_usd || 0),
    0
  );

  const balanceCdf = totalIncomeCdf - totalExpenseCdf;
  const balanceUsd = totalIncomeUsd - totalExpenseUsd;

  const yearOptions = Array.from({ length: 6 }).map((_, index) =>
    String(new Date().getFullYear() - index)
  );

  const cellLabels = Object.fromEntries(
    filteredCells.map((cell) => [
      cell.id,
      `${cell.name || "Cellule"} (${cell.code || "-"})`,
    ])
  );

  return (
    <div>
      <PageHeader
        title="Dashboard Finance"
        description="Vue financière filtrable : recettes, dépenses, solde, cellules et périodes."
      />

      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={20} className="text-[var(--louange-purple)]" />
          <h3 className="text-lg font-black text-gray-950">
            Filtres financiers
          </h3>
        </div>

        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
          <FilterSelect
            name="year"
            label="Année"
            value={selectedYear}
            options={yearOptions}
          />

          <FilterSelect
            name="month"
            label="Mois"
            value={selectedMonth}
            options={[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "10",
              "11",
              "12",
            ]}
            labels={{
              "1": "Janvier",
              "2": "Février",
              "3": "Mars",
              "4": "Avril",
              "5": "Mai",
              "6": "Juin",
              "7": "Juillet",
              "8": "Août",
              "9": "Septembre",
              "10": "Octobre",
              "11": "Novembre",
              "12": "Décembre",
            }}
          />

          <FilterSelect
            name="country"
            label="Pays"
            value={selectedCountry}
            options={countries}
          />

          <FilterSelect
            name="city"
            label="Ville"
            value={selectedCity}
            options={cities}
          />

          <FilterSelect
            name="cell"
            label="Cellule"
            value={selectedCell}
            options={filteredCells.map((cell) => cell.id)}
            labels={cellLabels}
          />

          <FilterInput name="q" label="Recherche" defaultValue={search} />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white"
            >
              Filtrer
            </button>

            <Link
              href="/central/finances"
              className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700"
            >
              Reset
            </Link>
          </div>
        </form>

        <p className="mt-4 text-sm font-semibold text-gray-500">
          Période affichée : {startDate} au {endDate}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Recettes"
          value={`${totalIncomeCdf.toLocaleString("fr-FR")} FC`}
          subtitle={`${totalIncomeUsd.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} USD`}
          icon={ArrowUpCircle}
          tone="green"
        />

        <StatCard
          title="Dépenses"
          value={`${totalExpenseCdf.toLocaleString("fr-FR")} FC`}
          subtitle={`${totalExpenseUsd.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} USD`}
          icon={ArrowDownCircle}
          tone="red"
        />

        <StatCard
          title="Solde"
          value={`${balanceCdf.toLocaleString("fr-FR")} FC`}
          subtitle={`${balanceUsd.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} USD`}
          icon={Wallet}
          tone={balanceCdf >= 0 ? "purple" : "red"}
        />

        <StatCard
          title="Cellules concernées"
          value={String(filteredCells.length)}
          subtitle={`${incomeReports.length} entrée(s), ${expenseReports.length} dépense(s)`}
          icon={Wallet}
          tone="gold"
        />
      </section>
      <OnlineDonationsFinanceWidget />

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <CollapsibleSection
          title="Entrées / Recettes"
          description="Ajouter une recette par activité ou une autre entrée financière."
          buttonLabel="Ajouter une entrée"
        >
          <FinanceEntryForm />
        </CollapsibleSection>

        <CollapsibleSection
          title="Dépenses"
          description="Ajouter une dépense avec date, libellé et montant."
          buttonLabel="Ajouter une dépense"
        >
          <FinanceExpenseForm />
        </CollapsibleSection>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <FinanceList
          title="Dernières entrées"
          items={incomeReports}
          type="income"
        />

        <FinanceList
          title="Dernières dépenses"
          items={expenseReports}
          type="expense"
        />
      </section>
    </div>
  );
}

function FinanceList({
  title,
  items,
  type,
}: {
  title: string;
  items: any[];
  type: "income" | "expense";
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h3 className="text-xl font-black text-gray-950">{title}</h3>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500">
          Aucune donnée trouvée pour les filtres sélectionnés.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <p className="font-black text-gray-950">
                {type === "income" ? item.activity_name : "Dépense"} —{" "}
                {type === "income" ? item.activity_date : item.expense_date}
              </p>

              <p className="text-sm text-gray-500">
                Cellule : {item.cells?.name || "-"} ({item.cells?.code || "-"})
              </p>

              <p className="text-sm font-bold text-gray-700">
                Total : {Number(item.total_cdf || 0).toLocaleString("fr-FR")} FC
              </p>

              <p className="text-sm text-gray-500">Statut : {item.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterInput({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>

      <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3">
        <Search size={17} className="text-gray-400" />

        <input
          name={name}
          defaultValue={defaultValue}
          placeholder="Cellule, pays, ville..."
          className="ml-2 w-full bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

function FilterSelect({
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
import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  Church,
  Filter,
  Globe2,
  Landmark,
  MapPinned,
  Search,
  TrendingDown,
  TrendingUp,
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
    quarter?: string;
    month?: string;
    country?: string;
    city?: string;
    q?: string;
  }>;
};

type CellRow = {
  id: string;
  code: string | null;
  name: string | null;
  country: string | null;
  city: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  lead_pastor_id: string | null;
};

type PastorRow = {
  id: string;
  pastor_role: string | null;
  status: string | null;
};

type ActivityRow = {
  id: string;
  participants_count: number | null;
  total_attendance: number | null;
};

type FinanceReportRow = {
  id: string;
  total_cdf: number | null;
  total_usd: number | null;
  status: string | null;
};

type ExpenseReportRow = {
  id: string;
  total_cdf: number | null;
  total_usd: number | null;
  status: string | null;
};

type AssetRow = {
  id: string;
  estimated_value: number | null;
};

function getDateRange(
  yearValue: string,
  quarterValue: string,
  monthValue: string
) {
  const currentYear = new Date().getFullYear();
  const year = Number(yearValue || currentYear);

  let startMonth = 0;
  let endMonth = 11;

  if (quarterValue) {
    const quarter = Number(quarterValue);
    startMonth = (quarter - 1) * 3;
    endMonth = startMonth + 2;
  }

  if (monthValue) {
    const month = Number(monthValue) - 1;
    startMonth = month;
    endMonth = month;
  }

  const startDate = new Date(year, startMonth, 1).toISOString().slice(0, 10);
  const endDate = new Date(year, endMonth + 1, 0).toISOString().slice(0, 10);

  return { startDate, endDate };
}

function cleanStringList(values: Array<string | null>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

export default async function CentralDashboardPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : undefined;

  const selectedYear = params?.year || String(new Date().getFullYear());
  const selectedQuarter = params?.quarter || "";
  const selectedMonth = params?.month || "";
  const selectedCountry = params?.country || "";
  const selectedCity = params?.city || "";
  const search = params?.q || "";

  const { startDate, endDate } = getDateRange(
    selectedYear,
    selectedQuarter,
    selectedMonth
  );

  const { data: allCellsData } = await supabase
    .from("cells")
    .select(
      "id, code, name, country, city, status, latitude, longitude, lead_pastor_id"
    )
    .order("country", { ascending: true });

  const { data: allPastorsData } = await supabase
    .from("pastors")
    .select("id, pastor_role, status");

  const allCells = (allCellsData || []) as CellRow[];
  const allPastors = (allPastorsData || []) as PastorRow[];

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

  const filteredCellIds = filteredCells.map((cell) => cell.id);
  const hasCellFilter = Boolean(selectedCountry || selectedCity || search);
  const noCellAfterFilter = hasCellFilter && filteredCellIds.length === 0;

  let activities: ActivityRow[] = [];
  let financeReports: FinanceReportRow[] = [];
  let expenseReports: ExpenseReportRow[] = [];
  let assets: AssetRow[] = [];
  let ministers: Array<{ pastor_id: string | null }> = [];

  if (!noCellAfterFilter) {
    let activitiesQuery = supabase
      .from("activities")
      .select("id, participants_count, total_attendance")
      .gte("activity_date", startDate)
      .lte("activity_date", endDate);

    let financeQuery = supabase
      .from("finance_reports")
      .select("id, total_cdf, total_usd, status")
      .gte("activity_date", startDate)
      .lte("activity_date", endDate);

    let expenseQuery = supabase
      .from("finance_expense_reports")
      .select("id, total_cdf, total_usd, status")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate);

    let assetsQuery = supabase.from("assets").select("id, estimated_value");

    let ministersQuery = supabase.from("cell_ministers").select("pastor_id");

    if (filteredCellIds.length > 0) {
      activitiesQuery = activitiesQuery.in("cell_id", filteredCellIds);
      financeQuery = financeQuery.in("cell_id", filteredCellIds);
      expenseQuery = expenseQuery.in("cell_id", filteredCellIds);
      assetsQuery = assetsQuery.in("cell_id", filteredCellIds);
      ministersQuery = ministersQuery.in("cell_id", filteredCellIds);
    }

    const [
      activitiesResponse,
      financeResponse,
      expenseResponse,
      assetsResponse,
      ministersResponse,
    ] = await Promise.all([
      activitiesQuery,
      financeQuery,
      expenseQuery,
      assetsQuery,
      ministersQuery,
    ]);

    activities = (activitiesResponse.data || []) as ActivityRow[];
    financeReports = (financeResponse.data || []) as FinanceReportRow[];
    expenseReports = (expenseResponse.data || []) as ExpenseReportRow[];
    assets = (assetsResponse.data || []) as AssetRow[];
    ministers = (ministersResponse.data || []) as Array<{
      pastor_id: string | null;
    }>;
  }

  const leadPastorIds = filteredCells
    .map((cell) => cell.lead_pastor_id)
    .filter(Boolean) as string[];

  const ministerPastorIds = ministers
    .map((minister) => minister.pastor_id)
    .filter(Boolean) as string[];

  const uniquePastorIds = new Set([...leadPastorIds, ...ministerPastorIds]);

  const pastorsForDashboard = hasCellFilter
    ? allPastors.filter((pastor) => uniquePastorIds.has(pastor.id))
    : allPastors;

  const totalCells = filteredCells.length;

  const activeCells = filteredCells.filter(
    (cell) => cell.status === "active"
  ).length;

  const inactiveCells = filteredCells.filter(
    (cell) => cell.status === "inactive"
  ).length;

  const localizedCells = filteredCells.filter(
    (cell) => cell.latitude !== null && cell.longitude !== null
  ).length;

  const countriesCount = new Set(
    filteredCells.map((cell) => cell.country).filter(Boolean)
  ).size;

  const totalPastors = pastorsForDashboard.length;

  const visionaries = pastorsForDashboard.filter(
    (pastor) => pastor.pastor_role === "pasteur_visionnaire"
  ).length;

  const titularPastors = pastorsForDashboard.filter(
    (pastor) => pastor.pastor_role === "pasteur_titulaire"
  ).length;

  const assistantPastors = pastorsForDashboard.filter(
    (pastor) => pastor.pastor_role === "pasteur_assistant"
  ).length;

  const bergers = pastorsForDashboard.filter(
    (pastor) => pastor.pastor_role === "berger"
  ).length;

  const monthlyParticipants = activities.reduce((sum, activity) => {
    const total =
      Number(activity.total_attendance || 0) ||
      Number(activity.participants_count || 0);

    return sum + total;
  }, 0);

  const monthlyReportsCount = activities.length;

  const monthlyIncomeCdf = financeReports.reduce(
    (sum, report) => sum + Number(report.total_cdf || 0),
    0
  );

  const monthlyIncomeUsd = financeReports.reduce(
    (sum, report) => sum + Number(report.total_usd || 0),
    0
  );

  const monthlyExpenseCdf = expenseReports.reduce(
    (sum, report) => sum + Number(report.total_cdf || 0),
    0
  );

  const monthlyExpenseUsd = expenseReports.reduce(
    (sum, report) => sum + Number(report.total_usd || 0),
    0
  );

  const balanceCdf = monthlyIncomeCdf - monthlyExpenseCdf;
  const balanceUsd = monthlyIncomeUsd - monthlyExpenseUsd;

  const pendingFinanceReports = financeReports.filter(
    (report) => report.status === "pending"
  ).length;

  const pendingExpenseReports = expenseReports.filter(
    (report) => report.status === "pending"
  ).length;

  const totalPendingReports = pendingFinanceReports + pendingExpenseReports;

  const assetsCount = assets.length;

  const assetsValue = assets.reduce(
    (sum, asset) => sum + Number(asset.estimated_value || 0),
    0
  );

  const yearOptions = Array.from({ length: 6 }).map((_, index) =>
    String(new Date().getFullYear() - index)
  );

  return (
    <div>
      <PageHeader
        title="Dashboard central"
        description="Vue stratégique filtrable des cellules, activités, finances, pasteurs et patrimoine de l’Église La Louange."
      />

      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={20} className="text-[var(--louange-purple)]" />
          <h3 className="text-lg font-black text-gray-950">
            Filtres du dashboard
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
            name="quarter"
            label="Trimestre"
            value={selectedQuarter}
            options={["1", "2", "3", "4"]}
            labels={{
              "1": "T1",
              "2": "T2",
              "3": "T3",
              "4": "T4",
            }}
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

          <FilterInput name="q" label="Recherche" defaultValue={search} />

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white"
            >
              Appliquer
            </button>

            <Link
              href="/central/dashboard"
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
          title="Cellules"
          value={String(totalCells)}
          subtitle={`${activeCells} active(s), ${inactiveCells} inactive(s)`}
          icon={Church}
          tone="purple"
        />

        <StatCard
          title="Pays couverts"
          value={String(countriesCount)}
          subtitle={`${localizedCells} cellule(s) géolocalisée(s)`}
          icon={Globe2}
          tone="gold"
        />

        <StatCard
          title="Pasteurs associés"
          value={String(totalPastors)}
          subtitle="Selon les filtres appliqués"
          icon={Users}
          tone="green"
        />

        <StatCard
          title="Participants"
          value={String(monthlyParticipants)}
          subtitle={`${monthlyReportsCount} rapport(s) d’activité`}
          icon={CalendarCheck}
          tone="purple"
        />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pasteurs visionnaires"
          value={String(visionaries)}
          subtitle="Leadership général"
          icon={Users}
          tone="purple"
        />

        <StatCard
          title="Pasteurs titulaires"
          value={String(titularPastors)}
          subtitle="Responsables principaux"
          icon={Users}
          tone="green"
        />

        <StatCard
          title="Pasteurs assistants"
          value={String(assistantPastors)}
          subtitle="Appui pastoral"
          icon={Users}
          tone="gold"
        />

        <StatCard
          title="Bergers"
          value={String(bergers)}
          subtitle="Encadrement des cellules"
          icon={Users}
          tone="red"
        />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Recettes FC"
          value={`${monthlyIncomeCdf.toLocaleString("fr-FR")} FC`}
          subtitle={`${monthlyIncomeUsd.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} USD`}
          icon={TrendingUp}
          tone="green"
        />

        <StatCard
          title="Dépenses FC"
          value={`${monthlyExpenseCdf.toLocaleString("fr-FR")} FC`}
          subtitle={`${monthlyExpenseUsd.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} USD`}
          icon={TrendingDown}
          tone="red"
        />

        <StatCard
          title="Solde financier"
          value={`${balanceCdf.toLocaleString("fr-FR")} FC`}
          subtitle={`${balanceUsd.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} USD`}
          icon={Wallet}
          tone={balanceCdf >= 0 ? "purple" : "red"}
        />

        <StatCard
          title="Validations"
          value={String(totalPendingReports)}
          subtitle={`${pendingFinanceReports} entrée(s), ${pendingExpenseReports} dépense(s)`}
          icon={AlertTriangle}
          tone="gold"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-950">
                Vue géographique
              </h3>
              <p className="text-sm text-gray-500">
                Suivi mondial des cellules par pays et localisation.
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--louange-gold-soft)] p-3 text-[var(--louange-purple)]">
              <MapPinned size={24} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MiniStat label="Pays" value={countriesCount} icon={Globe2} />
            <MiniStat
              label="Cellules GPS"
              value={localizedCells}
              icon={MapPinned}
            />
            <MiniStat
              label="Cellules actives"
              value={activeCells}
              icon={Church}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="text-xl font-black text-gray-950">
            Synthèse patrimoine
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Lecture rapide selon les filtres appliqués.
          </p>

          <div className="mt-5 space-y-3">
            <MiniStat
              label="Biens enregistrés"
              value={assetsCount}
              icon={Landmark}
            />

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-bold text-gray-500">
                Valeur estimée
              </p>
              <p className="mt-1 text-2xl font-black text-gray-950">
                {assetsValue.toLocaleString("fr-FR")} USD
              </p>
            </div>
          </div>
        </div>
      </section>
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
          placeholder="Cellule, code, pays..."
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

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: any;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div>
        <p className="text-sm font-bold text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-gray-950">{value}</p>
      </div>

      <Icon size={24} className="text-[var(--louange-purple)]" />
    </div>
  );
}
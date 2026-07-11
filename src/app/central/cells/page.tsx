import Link from "next/link";
import {
  Church,
  MapPinned,
  Plus,
  Search,
  TrendingUp,
  Upload,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import CellStatusBadge from "@/components/cells/CellStatusBadge";
import CellActions from "@/components/cells/CellActions";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type PageProps = {
  searchParams?: Promise<{
    country?: string;
    city?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
};

type Cell = {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  pastor_name: string | null;
  pastor_phone: string | null;
  status: string | null;
};

export default async function CentralCellsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const country = params?.country || "";
  const city = params?.city || "";
  const status = params?.status || "";
  const q = params?.q || "";
  const currentPage = Math.max(Number(params?.page || 1), 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: allCells } = await supabase
    .from("cells")
    .select("country, city, status");

  const countries = Array.from(
    new Set((allCells || []).map((cell) => cell.country).filter(Boolean))
  ).sort();

  const cities = Array.from(
    new Set(
      (allCells || [])
        .filter((cell) => (country ? cell.country === country : true))
        .map((cell) => cell.city)
        .filter(Boolean)
    )
  ).sort();

  let query = supabase
    .from("cells")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (country) query = query.eq("country", country);
  if (city) query = query.eq("city", city);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,pastor_name.ilike.%${q}%`);

  const { data, error, count } = await query;

  const cells = (data || []) as Cell[];
  const totalRows = count || 0;
  const totalPages = Math.max(Math.ceil(totalRows / PAGE_SIZE), 1);

  const activeCells =
    allCells?.filter((cell) => cell.status === "active").length || 0;

  const localizedCells =
    cells.filter((cell) => cell.latitude !== null && cell.longitude !== null)
      .length || 0;

  return (
    <div>
      <PageHeader
        title="Gestion des cellules"
        description="Suivi des cellules de l’Église La Louange : localisation, responsables, rapports et finances."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/central/cells/import"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--louange-purple)] bg-white px-5 py-3 text-sm font-black text-[var(--louange-purple)] shadow-sm"
            >
              <Upload size={18} />
              Importer Excel
            </Link>

            <Link
              href="/central/cells/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--louange-gold)] px-5 py-3 text-sm font-black text-black shadow-sm"
            >
              <Plus size={18} />
              Ajouter une cellule
            </Link>
          </div>
        }
      />

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          Erreur Supabase : {error.message}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total cellules"
          value={String(totalRows)}
          subtitle="Résultat filtré"
          icon={Church}
          tone="purple"
        />

        <StatCard
          title="Cellules actives"
          value={String(activeCells)}
          subtitle="Statut actif"
          icon={TrendingUp}
          tone="green"
        />

        <StatCard
          title="Page actuelle"
          value={`${currentPage}/${totalPages}`}
          subtitle="50 cellules par page"
          icon={Search}
          tone="gold"
        />

        <StatCard
          title="Avec GPS"
          value={String(localizedCells)}
          subtitle="Sur cette page"
          icon={MapPinned}
          tone="purple"
        />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <form className="mb-5 grid gap-4 lg:grid-cols-5">
          <FilterInput name="q" label="Recherche" defaultValue={q} />

          <FilterSelect name="country" label="Pays" value={country} options={countries} />

          <FilterSelect name="city" label="Ville" value={city} options={cities} />

          <FilterSelect
            name="status"
            label="Statut"
            value={status}
            options={["active", "pending", "inactive", "archived"]}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white"
            >
              Filtrer
            </button>

            <Link
              href="/central/cells"
              className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700"
            >
              Reset
            </Link>
          </div>
        </form>

        <div className="rounded-2xl border border-gray-100">
  <div className="max-w-full overflow-x-auto">
            <table className="min-w-[980px] divide-y divide-gray-100">
              <thead className="bg-[var(--louange-purple-dark)] text-white">
                <tr>
                  <Th>Cellule</Th>
                  <Th>Pays / Ville</Th>
                  <Th>Pasteur</Th>
                  <Th>Adresse</Th>
                  <Th>GPS</Th>
                  <Th>Statut</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {cells.map((cell) => (
                  <tr key={cell.id} className="hover:bg-gray-50">
                    <Td>
                      <p className="font-black text-gray-950">{cell.name}</p>
                      <p className="text-xs font-semibold text-[var(--louange-purple)]">
                        {cell.code}
                      </p>
                    </Td>

                    <Td>
                      <p className="font-semibold">{cell.country}</p>
                      <p className="text-sm text-gray-500">{cell.city || "-"}</p>
                    </Td>

                    <Td>
                      <p className="font-semibold">{cell.pastor_name || "-"}</p>
                      <p className="text-sm text-gray-500">{cell.pastor_phone || "-"}</p>
                    </Td>

                    <Td>{cell.address || "-"}</Td>

                    <Td>{cell.latitude && cell.longitude ? "Oui" : "Non"}</Td>

                    <Td>
                      <CellStatusBadge status={cell.status} />
                    </Td>

                    <Td>
                      <CellActions cellId={cell.id} cellName={cell.name} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/central/cells"
          params={{ country, city, status, q }}
        />
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
      <label className="mb-2 block text-sm font-bold text-gray-800">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder="Nom, code, pasteur..."
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      />
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">{label}</label>
      <select
        name={name}
        defaultValue={value}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
      >
        <option value="">Tous</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  basePath,
  params,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string>;
}) {
  function href(page: number) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });

    searchParams.set("page", String(page));

    return `${basePath}?${searchParams.toString()}`;
  }

  return (
    <div className="mt-5 flex items-center justify-between">
      <p className="text-sm font-semibold text-gray-500">
        Page {currentPage} sur {totalPages}
      </p>

      <div className="flex gap-2">
        <Link
          href={href(Math.max(currentPage - 1, 1))}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700"
        >
          Précédent
        </Link>

        <Link
          href={href(Math.min(currentPage + 1, totalPages))}
          className="rounded-2xl bg-[var(--louange-purple)] px-4 py-2 text-sm font-black text-white"
        >
          Suivant
        </Link>
      </div>
    </div>
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
import Link from "next/link";
import { Filter, MapPinned } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import CellMapClient from "@/components/map/CellMapClient";
import CellStatusBadge from "@/components/cells/CellStatusBadge";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    country?: string;
    city?: string;
    status?: string;
  }>;
};

type CellMapItem = {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string | null;
  address: string | null;
  pastor_name: string | null;
  pastor_phone: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
};

function cleanStringList(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

export default async function CentralMapPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;

  const selectedCountry = params?.country || "";
  const selectedCity = params?.city || "";
  const selectedStatus = params?.status || "";

  const { data: allCells } = await supabase
    .from("cells")
    .select("country, city, status");

  const countries = cleanStringList(
    (allCells || []).map((cell) => cell.country)
  );

  const cities = cleanStringList(
    (allCells || [])
      .filter((cell) =>
        selectedCountry ? cell.country === selectedCountry : true
      )
      .map((cell) => cell.city)
  );

  let query = supabase
    .from("cells")
    .select(
      "id, code, name, country, city, address, pastor_name, pastor_phone, status, latitude, longitude"
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("country", { ascending: true });

  if (selectedCountry) {
    query = query.eq("country", selectedCountry);
  }

  if (selectedCity) {
    query = query.eq("city", selectedCity);
  }

  if (selectedStatus) {
    query = query.eq("status", selectedStatus);
  }

  const { data: cells, error } = await query;

  const mappedCells: CellMapItem[] = (cells || []).map((cell: any) => ({
    id: cell.id,
    code: cell.code || "-",
    name: cell.name || "Cellule sans nom",
    country: cell.country || "-",
    city: cell.city || null,
    address: cell.address || null,
    pastor_name: cell.pastor_name || null,
    pastor_phone: cell.pastor_phone || null,
    status: cell.status || null,
    latitude: cell.latitude,
    longitude: cell.longitude,
  }));

  return (
    <div>
      <PageHeader
        title="Carte mondiale des cellules"
        description="Visualisez les cellules de l’Église La Louange par pays, ville et statut."
      />

      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={20} className="text-[var(--louange-purple)]" />
          <h3 className="text-lg font-black text-gray-950">
            Filtres de la carte
          </h3>
        </div>

        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            options={["active", "pending", "inactive", "archived"]}
            labels={{
              active: "Active",
              pending: "En création",
              inactive: "Inactive",
              archived: "Archivée",
            }}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white"
            >
              Appliquer
            </button>

            <Link
              href="/central/map"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 sm:w-auto"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          {error.message}
        </div>
      ) : null}

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-950">
              Cellules géolocalisées
            </h3>
            <p className="text-sm text-gray-500">
              {mappedCells.length} cellule(s) affichée(s) sur la carte.
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--louange-gold-soft)] p-3 text-[var(--louange-purple)]">
            <MapPinned size={24} />
          </div>
        </div>

        <CellMapClient cells={mappedCells} />

        <div className="mt-6 rounded-2xl border border-gray-100">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-[950px] divide-y divide-gray-100">
              <thead className="bg-[var(--louange-purple-dark)] text-white">
                <tr>
                  <Th>Église / Cellule</Th>
                  <Th>Pays / Ville</Th>
                  <Th>Adresse</Th>
                  <Th>Pasteur</Th>
                  <Th>Contact</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {mappedCells.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm font-semibold text-gray-500"
                    >
                      Aucune cellule géolocalisée trouvée avec les filtres
                      sélectionnés.
                    </td>
                  </tr>
                ) : (
                  mappedCells.map((cell) => (
                    <tr key={cell.id} className="hover:bg-gray-50">
                      <Td>
                        <p className="font-black text-gray-950">{cell.name}</p>
                        <p className="text-xs font-bold text-[var(--louange-purple)]">
                          {cell.code}
                        </p>
                      </Td>

                      <Td>
                        <p>{cell.country}</p>
                        <p className="text-sm text-gray-500">
                          {cell.city || "-"}
                        </p>
                      </Td>

                      <Td>{cell.address || "-"}</Td>

                      <Td>{cell.pastor_name || "-"}</Td>

                      <Td>{cell.pastor_phone || "-"}</Td>

                      <Td>
                        <CellStatusBadge status={cell.status} />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 space-y-3 lg:hidden">
          {mappedCells.map((cell) => (
            <div
              key={cell.id}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-gray-950">{cell.name}</p>
                  <p className="text-xs font-bold text-[var(--louange-purple)]">
                    {cell.code}
                  </p>
                </div>

                <CellStatusBadge status={cell.status} />
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Pays / Ville :</strong> {cell.country} /{" "}
                  {cell.city || "-"}
                </p>
                <p>
                  <strong>Adresse :</strong> {cell.address || "-"}
                </p>
                <p>
                  <strong>Pasteur :</strong> {cell.pastor_name || "-"}
                </p>
                <p>
                  <strong>Contact :</strong> {cell.pastor_phone || "-"}
                </p>
              </div>
            </div>
          ))}
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
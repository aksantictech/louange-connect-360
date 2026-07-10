import Link from "next/link";
import { Filter, MapPinned } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import CellMapClient from "@/components/map/CellMapClient";
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

function onlyStrings(value: string | null | undefined): value is string {
  return Boolean(value);
}

export default async function CentralMapPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;

  const selectedCountry = params?.country || "";
  const selectedCity = params?.city || "";
  const selectedStatus = params?.status || "";

  const { data: allCells } = await supabase
    .from("cells")
    .select("country, city, status");

  const countries = Array.from(
    new Set(
      (allCells || [])
        .map((cell) => cell.country)
        .filter(onlyStrings)
    )
  ).sort();

  const cities = Array.from(
    new Set(
      (allCells || [])
        .filter((cell) =>
          selectedCountry ? cell.country === selectedCountry : true
        )
        .map((cell) => cell.city)
        .filter(onlyStrings)
    )
  ).sort();

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

  const mappedCells = (cells || []) as CellMapItem[];

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

        <form className="grid gap-4 md:grid-cols-4">
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

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white"
            >
              Appliquer
            </button>

            <Link
              href="/central/map"
              className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700"
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
        <div className="mb-4 flex items-center justify-between">
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
import Link from "next/link";
import { Plus, Search, UserRoundCheck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PastorActions from "@/components/pastors/PastorActions";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type PageProps = {
  searchParams?: Promise<{
    country?: string;
    city?: string;
    role?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
};

type Pastor = {
  id: string;
  full_name: string;
  pastor_role: string;
  phone: string | null;
  email: string | null;
  residence_country: string | null;
  residence_city: string | null;
  ordination_year: number | null;
  photo_url: string | null;
  status: string;
};

const roleLabels: Record<string, string> = {
  pasteur_visionnaire: "Pasteur Visionnaire",
  pasteur_titulaire: "Pasteur Titulaire",
  pasteur_assistant: "Pasteur Assistant",
  berger: "Berger",
};

export default async function PastorsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const country = params?.country || "";
  const city = params?.city || "";
  const role = params?.role || "";
  const status = params?.status || "";
  const q = params?.q || "";
  const currentPage = Math.max(Number(params?.page || 1), 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: allPastors } = await supabase
    .from("pastors")
    .select("residence_country, residence_city, pastor_role, status");

  const countries = Array.from(
    new Set(
      (allPastors || [])
        .map((pastor) => pastor.residence_country)
        .filter(Boolean)
    )
  ).sort();

  const cities = Array.from(
    new Set(
      (allPastors || [])
        .filter((pastor) =>
          country ? pastor.residence_country === country : true
        )
        .map((pastor) => pastor.residence_city)
        .filter(Boolean)
    )
  ).sort();

  let query = supabase
    .from("pastors")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (country) query = query.eq("residence_country", country);
  if (city) query = query.eq("residence_city", city);
  if (role) query = query.eq("pastor_role", role);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data, error, count } = await query;

  const pastors = (data || []) as Pastor[];
  const totalRows = count || 0;
  const totalPages = Math.max(Math.ceil(totalRows / PAGE_SIZE), 1);

  return (
    <div>
      <PageHeader
        title="Pasteurs & Bergers"
        description="Table d’identification des pasteurs, assistants, bergers et pasteur visionnaire."
        action={
          <Link
            href="/central/pastors/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-gold)] px-5 py-3 text-sm font-black text-black shadow-sm"
          >
            <Plus size={18} />
            Ajouter un pasteur
          </Link>
        }
      />

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          {error.message}
        </div>
      ) : null}

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <form className="mb-5 grid gap-4 xl:grid-cols-6">
          <FilterInput name="q" label="Recherche" defaultValue={q} />

          <FilterSelect name="country" label="Pays" value={country} options={countries} />

          <FilterSelect name="city" label="Ville" value={city} options={cities} />

          <FilterSelect
            name="role"
            label="Fonction"
            value={role}
            options={[
              "pasteur_visionnaire",
              "pasteur_titulaire",
              "pasteur_assistant",
              "berger",
            ]}
            labels={roleLabels}
          />

          <FilterSelect
            name="status"
            label="Statut"
            value={status}
            options={["active", "inactive", "archived"]}
          />

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white"
            >
              Filtrer
            </button>

            <Link
              href="/central/pastors"
              className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700"
            >
              Reset
            </Link>
          </div>
        </form>

        {pastors.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-[var(--louange-bg)] p-10 text-center">
            <UserRoundCheck
              size={44}
              className="mx-auto text-[var(--louange-purple)]"
            />
            <h3 className="mt-4 text-xl font-black text-gray-950">
              Aucun pasteur trouvé
            </h3>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[var(--louange-purple-dark)] text-white">
                  <tr>
                    <Th>Pasteur</Th>
                    <Th>Fonction</Th>
                    <Th>Contact</Th>
                    <Th>Pays / Ville</Th>
                    <Th>Ordination</Th>
                    <Th>Statut</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {pastors.map((pastor) => (
                    <tr key={pastor.id} className="hover:bg-gray-50">
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-2xl bg-gray-100">
                            {pastor.photo_url ? (
                              <img
                                src={pastor.photo_url}
                                alt={pastor.full_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[var(--louange-purple)] text-sm font-black text-white">
                                {pastor.full_name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-black text-gray-950">
                              {pastor.full_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {pastor.email || "Email non renseigné"}
                            </p>
                          </div>
                        </div>
                      </Td>

                      <Td>{roleLabels[pastor.pastor_role] || pastor.pastor_role}</Td>

                      <Td>{pastor.phone || "-"}</Td>

                      <Td>
                        <p>{pastor.residence_country || "-"}</p>
                        <p className="text-sm text-gray-500">
                          {pastor.residence_city || "-"}
                        </p>
                      </Td>

                      <Td>{pastor.ordination_year || "-"}</Td>

                      <Td>{pastor.status}</Td>

                      <Td>
                        <PastorActions
                          pastorId={pastor.id}
                          pastorName={pastor.full_name}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/central/pastors"
          params={{ country, city, role, status, q }}
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
        placeholder="Nom, email, téléphone..."
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
      <label className="mb-2 block text-sm font-bold text-gray-800">{label}</label>
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
        Page {currentPage} sur {totalPages} — 50 par page
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
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPinned, Pencil } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CellDetailsPage({ params }: PageProps) {
  const { id } = await params;
if (!id) {
  notFound();
}
  const { data: cell, error } = await supabase
    .from("cells")
    .select("*")
    .eq("id", id)
    .single();

  const { data: ministers } = await supabase
    .from("cell_ministers")
    .select("*")
    .eq("cell_id", id)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <PageHeader
        title={cell?.name || "Détail cellule"}
        description="Fiche détaillée de la cellule : localisation, responsables, pasteurs, bergers et statut."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/central/cells"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:border-[var(--louange-purple)] hover:text-[var(--louange-purple)]"
            >
              <ArrowLeft size={18} />
              Retour
            </Link>

            <Link
              href={`/central/cells/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-gold)] px-5 py-3 text-sm font-black text-black shadow-sm"
            >
              <Pencil size={18} />
              Modifier
            </Link>
          </div>
        }
      />

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      ) : null}

      {cell ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 xl:col-span-2">
            <h3 className="text-xl font-black text-gray-950">
              Informations générales
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Info label="Code" value={cell.code} />
              <Info label="Statut" value={cell.status} />
              <Info label="Pays" value={cell.country} />
              <Info label="Province / Région" value={cell.province} />
              <Info label="Ville" value={cell.city} />
              <Info label="Commune / Quartier" value={cell.commune} />
              <Info label="Adresse" value={cell.address} />
              <Info label="Jour de culte" value={cell.main_service_day} />
              <Info label="Heure du culte" value={cell.main_service_time} />
              <Info label="Pasteur responsable" value={cell.pastor_name} />
              <Info label="Téléphone pasteur" value={cell.pastor_phone} />
              <Info label="Secrétaire" value={cell.secretary_name} />
              <Info label="Téléphone secrétaire" value={cell.secretary_phone} />
              <Info label="Trésorier" value={cell.treasurer_name} />
              <Info label="Téléphone trésorier" value={cell.treasurer_phone} />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-950">
                Localisation
              </h3>
              <MapPinned className="text-[var(--louange-purple)]" />
            </div>

            <div className="mt-5 space-y-3">
              <Info label="Latitude" value={cell.latitude} />
              <Info label="Longitude" value={cell.longitude} />
            </div>

            {cell.photo_url ? (
              <img
                src={cell.photo_url}
                alt={cell.name}
                className="mt-5 h-48 w-full rounded-3xl object-cover"
              />
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-gray-300 bg-[var(--louange-bg)] p-6 text-center text-sm font-semibold text-gray-500">
                Aucune photo de cellule.
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 xl:col-span-3">
            <h3 className="text-xl font-black text-gray-950">
              Pasteurs assistants & bergers
            </h3>

            {ministers && ministers.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ministers.map((minister: any) => (
                  <div
                    key={minister.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <p className="font-black text-gray-950">
                      {minister.full_name}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--louange-purple)]">
                      {minister.minister_role === "berger"
                        ? "Berger"
                        : "Pasteur assistant"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {minister.phone || "Téléphone non renseigné"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-gray-300 bg-[var(--louange-bg)] p-6 text-center text-sm font-semibold text-gray-500">
                Aucun pasteur assistant ou berger rattaché.
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 font-bold text-gray-950">
        {value || "Non renseigné"}
      </p>
    </div>
  );
}
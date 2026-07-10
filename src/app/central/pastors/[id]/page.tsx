import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PastorDetailsPage({ params }: PageProps) {
  const { id } = await params;
if (!id) {
  notFound();
}
  const { data: pastor, error } = await supabase
    .from("pastors")
    .select("*")
    .eq("id", id)
    .single();

  return (
    <div>
      <PageHeader
        title={pastor?.full_name || "Détail pasteur"}
        description="Fiche détaillée du pasteur ou berger."
        action={
          <Link
            href="/central/pastors"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:border-[var(--louange-purple)] hover:text-[var(--louange-purple)]"
          >
            <ArrowLeft size={18} />
            Retour
          </Link>
        }
      />

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      ) : null}

      {pastor ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
            <div className="h-40 w-40 overflow-hidden rounded-3xl bg-gray-100">
              {pastor.photo_url ? (
                <img
                  src={pastor.photo_url}
                  alt={pastor.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--louange-purple)] text-3xl font-black text-white">
                  {pastor.full_name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Nom complet" value={pastor.full_name} />
              <Info label="Fonction" value={pastor.pastor_role} />
              <Info label="Téléphone" value={pastor.phone} />
              <Info label="Email" value={pastor.email} />
              <Info label="Adresse" value={pastor.residence_address} />
              <Info label="Ville" value={pastor.residence_city} />
              <Info label="État civil" value={pastor.marital_status} />
              <Info label="Épouse / Époux" value={pastor.spouse_name} />
              <Info label="Nombre d’enfants" value={pastor.children_count} />
              <Info label="Année d’ordination" value={pastor.ordination_year} />
              <Info label="Année de conversion" value={pastor.conversion_year} />
              <Info label="Statut" value={pastor.status} />
            </div>
          </div>
        </section>
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
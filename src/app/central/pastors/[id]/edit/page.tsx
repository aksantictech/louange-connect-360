import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPastorPage({ params }: PageProps) {
  const { id } = await params;
if (!id) {
  notFound();
}
  return (
    <div>
      <PageHeader
        title="Modifier le pasteur"
        description="La modification complète du pasteur sera connectée dans la prochaine étape."
        action={
          <Link
            href={`/central/pastors/${id}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:border-[var(--louange-purple)] hover:text-[var(--louange-purple)]"
          >
            <ArrowLeft size={18} />
            Retour détail
          </Link>
        }
      />

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p className="text-sm font-semibold text-gray-600">
          ID pasteur : {id}
        </p>
        <p className="mt-3 text-gray-700">
          On connectera ici le formulaire de modification complet avec les
          données existantes du pasteur.
        </p>
      </div>
    </div>
  );
}
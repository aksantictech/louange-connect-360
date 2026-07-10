import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ImportCellsForm from "@/components/cells/ImportCellsForm";

export default function ImportCellsPage() {
  return (
    <div>
      <PageHeader
        title="Importation massive des cellules"
        description="Importez plusieurs cellules depuis un fichier Excel conforme au modèle officiel Louange Connect 360."
        action={
          <Link
            href="/central/cells"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:border-[var(--louange-purple)] hover:text-[var(--louange-purple)]"
          >
            <ArrowLeft size={18} />
            Retour
          </Link>
        }
      />

      <ImportCellsForm />
    </div>
  );
}
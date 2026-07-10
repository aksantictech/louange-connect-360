import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import CellForm from "@/components/cells/CellForm";

export default function NewCellPage() {
  return (
    <div>
      <PageHeader
        title="Ajouter une cellule"
        description="Enregistrez une nouvelle cellule avec ses informations pastorales, administratives et géographiques."
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

      <CellForm />
    </div>
  );
}
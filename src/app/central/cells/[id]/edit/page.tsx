import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import CellEditForm from "@/components/cells/CellEditForm";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCellPage({ params }: PageProps) {
  const { id } = await params;
if (!id) {
  notFound();
}
  const { data: cell, error } = await supabase
    .from("cells")
    .select("*")
    .eq("id", id)
    .single();

  return (
    <div>
      <PageHeader
        title="Modifier la cellule"
        description="Mettez à jour les informations de la cellule."
        action={
          <Link
            href={`/central/cells/${id}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 shadow-sm"
          >
            <ArrowLeft size={18} />
            Retour détail
          </Link>
        }
      />

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          {error.message}
        </div>
      ) : null}

      {cell ? <CellEditForm cell={cell as any} /> : null}
    </div>
  );
}
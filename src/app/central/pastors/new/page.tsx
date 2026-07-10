import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PastorForm from "@/components/pastors/PastorForm";

export default function NewPastorPage() {
  return (
    <div>
      <PageHeader
        title="Ajouter un pasteur / berger"
        description="Enregistrez un pasteur, un pasteur assistant, un berger ou le pasteur visionnaire."
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

      <PastorForm />
    </div>
  );
}